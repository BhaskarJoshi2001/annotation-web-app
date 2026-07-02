import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects, labelClasses } from '@/lib/db/schema';

async function verifyOwnership(clerkId: string, projectId: string) {
  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return null;
  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, dbUser.id)));
  if (!projectRows[0]) return null;
  return dbUser;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;
  const dbUser = await verifyOwnership(clerkId, projectId);
  if (!dbUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { name: string; color: string };
  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const [cls] = await db
    .insert(labelClasses)
    .values({ projectId, name: body.name.trim(), color: body.color ?? '#3b82f6' })
    .returning();

  return NextResponse.json(cls, { status: 201 });
}
