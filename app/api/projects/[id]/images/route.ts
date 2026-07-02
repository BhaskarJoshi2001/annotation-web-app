import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, and, inArray, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { images, projects, users, annotations } from '@/lib/db/schema';
import { r2, R2_BUCKET } from '@/lib/r2';

async function getDbUser(clerkId: string) {
  const rows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  return rows[0] ?? null;
}

async function getOwnedProject(projectId: string, userId: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)));
  return rows[0] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const dbUser = await getDbUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const project = await getOwnedProject(projectId, dbUser.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(images)
    .where(eq(images.projectId, projectId))
    .orderBy(images.createdAt);

  const imageIds = rows.map((r) => r.id);
  const annCounts = imageIds.length > 0
    ? await db
        .select({ imageId: annotations.imageId, cnt: count() })
        .from(annotations)
        .where(inArray(annotations.imageId, imageIds))
        .groupBy(annotations.imageId)
    : [];

  const countMap = new Map(annCounts.map((r) => [r.imageId, r.cnt]));

  const result = rows.map((img) => ({
    ...img,
    url: `/api/images/${img.id}/file`,
    annotationCount: countMap.get(img.id) ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const dbUser = await getDbUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const project = await getOwnedProject(projectId, dbUser.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type))
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

  if (file.size > 50 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const id = uuidv4();
  const r2Key = `projects/${projectId}/${id}.${ext}`;

  const bytes = await file.arrayBuffer();
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    })
  );

  const width = Number(formData.get('width')) || null;
  const height = Number(formData.get('height')) || null;

  const [inserted] = await db
    .insert(images)
    .values({
      id,
      projectId,
      filename: file.name,
      r2Key,
      width,
      height,
      status: 'unlabeled',
    })
    .returning();

  return NextResponse.json({ ...inserted, url: `/api/images/${id}/file` }, { status: 201 });
}
