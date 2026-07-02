import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects, labelClasses } from '@/lib/db/schema';

async function verifyClassOwnership(clerkId: string, classId: string) {
  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return null;

  // join label_classes → projects to check ownership
  const rows = await db
    .select({ cls: labelClasses, project: projects })
    .from(labelClasses)
    .innerJoin(projects, eq(labelClasses.projectId, projects.id))
    .where(and(eq(labelClasses.id, classId), eq(projects.ownerId, dbUser.id)));

  return rows[0]?.cls ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classId } = await params;
  const existing = await verifyClassOwnership(clerkId, classId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { name?: string; color?: string };
  const updates: { name?: string; color?: string } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.color !== undefined) updates.color = body.color;

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
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classId } = await params;
  const existing = await verifyClassOwnership(clerkId, classId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(labelClasses).where(eq(labelClasses.id, classId));
  return new NextResponse(null, { status: 204 });
}
