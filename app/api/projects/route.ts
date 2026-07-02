import { NextRequest, NextResponse } from 'next/server';
import { eq, count, inArray, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects, images, labelClasses } from '@/lib/db/schema';
import { requireUser } from '@/lib/api/guards';

const CLASS_COLORS = ['#3b6af5', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  taskType: z.enum(['detection', 'segmentation', 'classification', 'keypoints']),
  classes: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const dbUser = guard.user;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, dbUser.id))
    .orderBy(desc(projects.updatedAt));

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
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const dbUser = guard.user;

  const parsed = createProjectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    );
  }
  const { name, taskType, classes } = parsed.data;

  const [project] = await db
    .insert(projects)
    .values({ ownerId: dbUser.id, name, taskType })
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
