import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq, count, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects, images, labelClasses } from '@/lib/db/schema';

const CLASS_COLORS = ['#3b6af5', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

async function upsertUser(clerkId: string) {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (existing[0]) return existing[0];

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const name =
    `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
    clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] ||
    'User';
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

  const [inserted] = await db
    .insert(users)
    .values({ clerkId, name, email, avatarUrl: clerkUser.imageUrl ?? null })
    .returning();
  return inserted;
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await upsertUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'Could not resolve user' }, { status: 500 });

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, dbUser.id))
    .orderBy(projects.updatedAt);

  if (rows.length === 0) return NextResponse.json([]);

  const ids = rows.map((r) => r.id);

  const imageCounts = await db
    .select({
      projectId: images.projectId,
      total: count(),
      labeled: sql<number>`cast(count(*) filter (where ${images.status} = 'labeled') as int)`,
    })
    .from(images)
    .where(inArray(images.projectId, ids))
    .groupBy(images.projectId);

  const classCounts = await db
    .select({ projectId: labelClasses.projectId, cnt: count() })
    .from(labelClasses)
    .where(inArray(labelClasses.projectId, ids))
    .groupBy(labelClasses.projectId);

  const imgMap = Object.fromEntries(imageCounts.map((r) => [r.projectId, r]));
  const clsMap = Object.fromEntries(classCounts.map((r) => [r.projectId, r.cnt]));

  return NextResponse.json(
    rows.map((p) => ({
      ...p,
      imageCount: imgMap[p.id]?.total ?? 0,
      labeledCount: imgMap[p.id]?.labeled ?? 0,
      classCount: clsMap[p.id] ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await upsertUser(clerkId);
  if (!dbUser) return NextResponse.json({ error: 'Could not resolve user' }, { status: 500 });

  const body = await req.json();
  const { name, taskType, classes = [] } = body as { name: string; taskType: string; classes: string[] };

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!taskType) return NextResponse.json({ error: 'Task type is required' }, { status: 400 });

  const [project] = await db
    .insert(projects)
    .values({ ownerId: dbUser.id, name: name.trim(), taskType })
    .returning();

  if (classes.length > 0) {
    await db.insert(labelClasses).values(
      classes.map((cls, i) => ({
        projectId: project.id,
        name: cls,
        color: CLASS_COLORS[i % CLASS_COLORS.length],
      }))
    );
  }

  return NextResponse.json(
    { ...project, imageCount: 0, labeledCount: 0, classCount: classes.length },
    { status: 201 }
  );
}
