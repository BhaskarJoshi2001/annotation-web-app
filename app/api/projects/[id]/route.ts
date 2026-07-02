import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects } from '@/lib/db/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const dbUser = await getDbUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const project = await getOwnedProject(id, dbUser.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(project);
}

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const dbUser = await getDbUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const project = await getOwnedProject(id, dbUser.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { name?: string; archived?: boolean };
  const updates: { name?: string; archived?: boolean; updatedAt: Date } = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.archived !== undefined) updates.archived = body.archived;

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
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const dbUser = await getDbUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const project = await getOwnedProject(id, dbUser.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(projects).where(eq(projects.id, id));

  return new NextResponse(null, { status: 204 });
}
