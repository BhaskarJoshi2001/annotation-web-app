import { NextRequest, NextResponse } from 'next/server';
import { eq, count, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '@/lib/db';
import { images, projects } from '@/lib/db/schema';
import { presignPutUrl } from '@/lib/r2';
import { requireOwnedProject } from '@/lib/api/guards';
import { FREE_MAX_IMAGES, FREE_MAX_STORAGE_BYTES } from '@/lib/limits';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const guard = await requireOwnedProject(projectId);
  if (!guard.ok) return guard.response;

  const parsed = presignSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid file — JPG, PNG or WebP up to 50MB' },
      { status: 400 }
    );
  }

  // Quota check — soft limit: parallel presigns can race past it slightly,
  // bounded by upload concurrency. Fine for storage, unlike e.g. payments.
  const [usage] = await db
    .select({
      imageCount: count(),
      storageBytes: sql<number>`coalesce(sum(${images.sizeBytes}), 0)`,
    })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(eq(projects.ownerId, guard.user.id));

  if ((usage?.imageCount ?? 0) >= FREE_MAX_IMAGES) {
    return NextResponse.json(
      { error: `Image limit reached (${FREE_MAX_IMAGES.toLocaleString()} images on the free plan)` },
      { status: 403 }
    );
  }
  if (Number(usage?.storageBytes ?? 0) + parsed.data.size > FREE_MAX_STORAGE_BYTES) {
    return NextResponse.json(
      { error: 'Storage limit reached (1 GB on the free plan)' },
      { status: 403 }
    );
  }

  const { contentType } = parsed.data;
  const key = `projects/${projectId}/${uuidv4()}.${EXT_BY_TYPE[contentType]}`;
  const uploadUrl = await presignPutUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
