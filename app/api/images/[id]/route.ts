import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { users, images, projects, labelClasses } from '@/lib/db/schema';
import { r2, R2_BUCKET } from '@/lib/r2';

const VALID_STATUSES = ['unlabeled', 'in_progress', 'labeled'] as const;
type ImageStatus = typeof VALID_STATUSES[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: imageId } = await params;

  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Join image → project to verify ownership
  const rows = await db
    .select({ image: images, project: projects })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, dbUser.id)));

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { image, project } = rows[0];

  const classes = await db
    .select()
    .from(labelClasses)
    .where(eq(labelClasses.projectId, project.id));

  return NextResponse.json({
    ...image,
    url: `/api/images/${image.id}/file`,
    projectId: project.id,
    labelClasses: classes,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: imageId } = await params;

  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({ image: images })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, dbUser.id)));

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { status?: ImageStatus };
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const [updated] = await db
    .update(images)
    .set({ status: body.status, updatedAt: new Date() })
    .where(eq(images.id, imageId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: imageId } = await params;

  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select({ image: images })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, dbUser.id)));

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { image } = rows[0];

  // Delete from R2 first, then DB (DB cascades to annotations)
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: image.r2Key }))
    .catch(() => { /* continue even if R2 delete fails */ });

  await db.delete(images).where(eq(images.id, imageId));

  return new NextResponse(null, { status: 204 });
}
