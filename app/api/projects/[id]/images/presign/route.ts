import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { presignPutUrl } from '@/lib/r2';
import { requireOwnedProject } from '@/lib/api/guards';

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

  const { contentType } = parsed.data;
  const key = `projects/${projectId}/${uuidv4()}.${EXT_BY_TYPE[contentType]}`;
  const uploadUrl = await presignPutUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
