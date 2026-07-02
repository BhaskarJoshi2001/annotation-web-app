import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { deleteByPrefix } from '@/lib/r2';
import { requireOwnedProject } from '@/lib/api/guards';

const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
  archived: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireOwnedProject(id);
  if (!guard.ok) return guard.response;

  return NextResponse.json(guard.project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireOwnedProject(id);
  if (!guard.ok) return guard.response;

  const parsed = updateProjectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }

  const updates: { name?: string; archived?: boolean; updatedAt: Date } = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.archived !== undefined) updates.archived = parsed.data.archived;

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireOwnedProject(id);
  if (!guard.ok) return guard.response;

  // Storage first, best-effort — the DB cascade only removes rows, not R2
  // objects. If cleanup partially fails the delete still goes through;
  // stragglers are orphans we can sweep later, not broken UX.
  await deleteByPrefix(`projects/${id}/`).catch(() => {});

  await db.delete(projects).where(eq(projects.id, id));

  return new NextResponse(null, { status: 204 });
}
