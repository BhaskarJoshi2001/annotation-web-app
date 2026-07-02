import { NextResponse } from 'next/server';
import { eq, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { images, projects } from '@/lib/db/schema';
import { requireUser } from '@/lib/api/guards';
import { FREE_MAX_IMAGES, FREE_MAX_STORAGE_BYTES } from '@/lib/limits';

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const [usage] = await db
    .select({
      imageCount: count(),
      storageBytes: sql<number>`coalesce(sum(${images.sizeBytes}), 0)`,
    })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(eq(projects.ownerId, guard.user.id));

  return NextResponse.json({
    imageCount: usage?.imageCount ?? 0,
    storageBytes: Number(usage?.storageBytes ?? 0),
    imageLimit: FREE_MAX_IMAGES,
    storageLimit: FREE_MAX_STORAGE_BYTES,
  });
}
