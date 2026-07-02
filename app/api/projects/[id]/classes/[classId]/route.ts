import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { labelClasses } from '@/lib/db/schema';
import { requireOwnedClass } from '@/lib/api/guards';

const updateClassSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  const { classId } = await params;
  const guard = await requireOwnedClass(classId);
  if (!guard.ok) return guard.response;

  const parsed = updateClassSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }

  const updates: { name?: string; color?: string } = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;
  if (Object.keys(updates).length === 0) return NextResponse.json(guard.cls);

  const [updated] = await db
    .update(labelClasses)
    .set(updates)
    .where(eq(labelClasses.id, classId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  const { classId } = await params;
  const guard = await requireOwnedClass(classId);
  if (!guard.ok) return guard.response;

  await db.delete(labelClasses).where(eq(labelClasses.id, classId));
  return new NextResponse(null, { status: 204 });
}
