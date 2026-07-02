import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { labelClasses } from '@/lib/db/schema';
import { requireOwnedProject } from '@/lib/api/guards';

const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').default('#3b82f6'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const guard = await requireOwnedProject(projectId);
  if (!guard.ok) return guard.response;

  const parsed = createClassSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }

  const [cls] = await db
    .insert(labelClasses)
    .values({ projectId, name: parsed.data.name, color: parsed.data.color })
    .returning();

  return NextResponse.json(cls, { status: 201 });
}
