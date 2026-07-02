import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { images, annotations } from '@/lib/db/schema';
import { requireOwnedImage } from '@/lib/api/guards';

// Geometry fields pass through into the JSONB `data` column as-is;
// only the columns we index on get strict validation.
const annotationSchema = z.looseObject({
  id: z.uuid(),
  classId: z.uuid().nullable().optional(),
  type: z.enum(['bbox', 'polygon']),
});

const saveSchema = z.array(annotationSchema).max(500);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;

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
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;

  // Validate before any write — a bad payload must not get past the delete
  const parsed = saveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid annotations payload' }, { status: 400 });

  const anns = parsed.data;
  const status = anns.length > 0 ? 'in_progress' : 'unlabeled';

  const deleteOld = db.delete(annotations).where(eq(annotations.imageId, imageId));
  const updateStatus = db
    .update(images)
    .set({ status, updatedAt: new Date() })
    .where(eq(images.id, imageId));

  // db.batch → one HTTP request, one implicit transaction on Neon.
  // If any statement fails, none commit — the old annotations survive.
  if (anns.length > 0) {
    await db.batch([
      deleteOld,
      db.insert(annotations).values(
        anns.map((ann) => ({
          id: ann.id,
          imageId,
          classId: ann.classId ?? null,
          data: ann,
        }))
      ),
      updateStatus,
    ]);
  } else {
    await db.batch([deleteOld, updateStatus]);
  }

  return NextResponse.json({ saved: anns.length });
}
