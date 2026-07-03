import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { presignGetUrl } from '@/lib/r2';
import { fal } from '@/lib/fal';
import { maskToPolygon } from '@/lib/mask-to-polygon';
import { requireOwnedImage } from '@/lib/api/guards';
import { SAM_DAILY_LIMIT } from '@/lib/limits';

// SAM inference is 1-3s warm but ~10s on a cold fal container — don't let
// Vercel's default timeout kill the request
export const maxDuration = 60;

const segmentSchema = z.object({
  point: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: imageId } = await params;
  const guard = await requireOwnedImage(imageId);
  if (!guard.ok) return guard.response;
  const { user, image } = guard;

  const parsed = segmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const x = Math.round(parsed.data.point.x);
  const y = Math.round(parsed.data.point.y);
  if ((image.width && x >= image.width) || (image.height && y >= image.height))
    return NextResponse.json({ error: 'Point outside image' }, { status: 400 });

  // Daily cap — bump before the call so a crash mid-inference still counts
  const today = new Date().toISOString().slice(0, 10);
  const used = user.samCallsDate === today ? user.samCallsToday : 0;
  if (used >= SAM_DAILY_LIMIT) {
    return NextResponse.json(
      { error: `Daily AI limit reached (${SAM_DAILY_LIMIT} segmentations/day on the free plan)` },
      { status: 429 }
    );
  }
  await db
    .update(users)
    .set({ samCallsToday: used + 1, samCallsDate: today })
    .where(eq(users.id, user.id));

  // fal fetches the image straight from R2 — no bytes through this function
  const imageUrl = await presignGetUrl(image.r2Key);

  let maskUrl: string | undefined;
  try {
    const result = await fal.subscribe('fal-ai/sam2/image', {
      input: {
        image_url: imageUrl,
        prompts: [{ x, y, label: '1' }],
      },
    });
    maskUrl = (result.data as { image?: { url?: string } })?.image?.url;
  } catch (e) {
    console.error('fal segmentation error:', e);
    const detail = (e as { body?: { detail?: unknown } })?.body?.detail;
    return NextResponse.json(
      { error: typeof detail === 'string' ? detail : 'Segmentation service failed' },
      { status: 502 }
    );
  }
  if (!maskUrl)
    return NextResponse.json({ error: 'Segmentation returned no mask' }, { status: 502 });

  const maskRes = await fetch(maskUrl);
  if (!maskRes.ok)
    return NextResponse.json({ error: 'Could not fetch mask' }, { status: 502 });
  const maskBuf = Buffer.from(await maskRes.arrayBuffer());

  const points = maskToPolygon(maskBuf, { x, y });
  if (!points || points.length < 3)
    return NextResponse.json({ error: 'No object found at that point' }, { status: 422 });

  return NextResponse.json({ points });
}
