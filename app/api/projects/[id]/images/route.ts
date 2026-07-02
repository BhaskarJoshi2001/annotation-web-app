import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray, count } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { images, annotations } from '@/lib/db/schema';
import { headObject, deleteObject, presignGetUrl } from '@/lib/r2';
import { requireOwnedProject } from '@/lib/api/guards';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const confirmSchema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1).max(255),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const guard = await requireOwnedProject(projectId);
  if (!guard.ok) return guard.response;

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

  const result = await Promise.all(
    rows.map(async (img) => ({
      ...img,
      url: await presignGetUrl(img.r2Key),
      annotationCount: countMap.get(img.id) ?? 0,
    }))
  );

  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const guard = await requireOwnedProject(projectId);
  if (!guard.ok) return guard.response;

  const parsed = confirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const { key, filename, width, height } = parsed.data;

  // Key must be one this project's presign endpoint issued — prevents
  // registering objects that belong to another user's project.
  const keyMatch = key.match(
    new RegExp(
      `^projects/${projectId}/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.(jpg|png|webp)$`
    )
  );
  if (!keyMatch) return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  const id = keyMatch[1];

  // Verify the object actually landed in R2 — size claims at presign time
  // are unverified until now.
  const obj = await headObject(key);
  if (!obj)
    return NextResponse.json(
      { error: 'File not found in storage — upload may have failed' },
      { status: 400 }
    );

  if ((obj.ContentLength ?? 0) > MAX_FILE_SIZE) {
    await deleteObject(key).catch(() => {});
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(images)
    .values({
      id,
      projectId,
      filename,
      r2Key: key,
      width: width ?? null,
      height: height ?? null,
      sizeBytes: obj.ContentLength ?? null,
      status: 'unlabeled',
    })
    .onConflictDoNothing()
    .returning();

  // Duplicate confirm for the same key — return the existing row (idempotent)
  const image = inserted
    ?? (await db.select().from(images).where(eq(images.id, id)))[0];

  return NextResponse.json(
    { ...image, url: await presignGetUrl(key), annotationCount: 0 },
    { status: 201 }
  );
}
