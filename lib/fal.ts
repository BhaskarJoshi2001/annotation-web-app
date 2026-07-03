import { fal } from '@fal-ai/client';

// FAL_KEY is server-only (no NEXT_PUBLIC_ prefix) — this module must never
// be imported from client components.
fal.config({ credentials: process.env.FAL_KEY });

export { fal };
