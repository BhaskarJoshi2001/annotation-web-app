import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().max(50).optional(),
});

// Public on purpose — the landing/pricing pages need it pre-auth.
// Duplicate signups are silently absorbed by the unique constraint.
export async function POST(req: NextRequest) {
  const parsed = waitlistSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });

  await db
    .insert(waitlist)
    .values({ email: parsed.data.email, source: parsed.data.source ?? null })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}
