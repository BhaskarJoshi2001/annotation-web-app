import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { images, labelClasses } from '@/lib/db/schema';
import { deleteObject, presignGetUrl } from '@/lib/r2';
import { requireOwnedImage } from '@/lib/api/guards';

const updateImageSchema = z.object({
  status: z.enum(['unlabeled', 'in_progress', 'labeled']).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;
  const { image, project } = guard;

  const classes = await db
    .select()
    .from(labelClasses)
    .where(eq(labelClasses.projectId, project.id));

  return NextResponse.json({
    ...image,
    url: await presignGetUrl(image.r2Key),
    projectId: project.id,
    labelClasses: classes,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;

  const parsed = updateImageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const updates: { status?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [updated] = await db
    .update(images)
    .set(updates)
    .where(eq(images.id, imageId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;

  // Delete from R2 first, then DB (DB cascades to annotations)
  await deleteObject(guard.image.r2Key).catch(() => {});

  await db.delete(images).where(eq(images.id, imageId));

  return new NextResponse(null, { status: 204 });
}
