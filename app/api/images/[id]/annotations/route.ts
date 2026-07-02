import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, images, projects, annotations } from '@/lib/db/schema';

async function verifyAccess(imageId: string, clerkId: string) {
  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return null;

  const rows = await db
    .select({ image: images })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, dbUser.id)));

  return rows[0] ? dbUser : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: imageId } = await params;
  const dbUser = await verifyAccess(imageId, clerkId);
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.imageId, imageId));

  return NextResponse.json(rows.map((r) => r.data));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: imageId } = await params;
  const dbUser = await verifyAccess(imageId, clerkId);
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { id: string; classId?: string; [key: string]: unknown }[];

  // Replace all annotations for this image atomically
  await db.delete(annotations).where(eq(annotations.imageId, imageId));

  if (body.length > 0) {
    await db.insert(annotations).values(
      body.map((ann) => ({
        id: ann.id,
        imageId,
        classId: ann.classId ?? null,
        data: ann,
      }))
    );
  }

  // Update image status
  const status = body.length > 0 ? 'in_progress' : 'unlabeled';
  await db
    .update(images)
    .set({ status, updatedAt: new Date() })
    .where(eq(images.id, imageId));

  return NextResponse.json({ saved: body.length });
}
