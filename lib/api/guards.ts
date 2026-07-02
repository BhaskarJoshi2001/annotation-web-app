import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects, images, labelClasses } from '@/lib/db/schema';

type Fail = { ok: false; response: NextResponse };

function fail(error: string, status: number): Fail {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Non-UUID path params would otherwise reach Postgres and 500 on the
// uuid-column cast — turn them into clean 404s instead.
function isUuid(id: string) {
  return UUID_RE.test(id);
}

// Upserts on first sight so a fresh Clerk account can hit any route first,
// not just GET /api/projects, without a "user not found" dead end.
export async function requireUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return fail('Unauthorized', 401);

  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId));
  if (existing[0]) return { ok: true as const, user: existing[0] };

  const clerkUser = await currentUser();
  if (!clerkUser) return fail('Could not resolve user', 500);

  const name =
    `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
    clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] ||
    'User';
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

  const [inserted] = await db
    .insert(users)
    .values({ clerkId, name, email, avatarUrl: clerkUser.imageUrl ?? null })
    .returning();
  return { ok: true as const, user: inserted };
}

export async function requireOwnedProject(projectId: string) {
  if (!isUuid(projectId)) return fail('Not found', 404);

  const guard = await requireUser();
  if (!guard.ok) return guard;

  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, guard.user.id)));
  if (!rows[0]) return fail('Not found', 404);

  return { ok: true as const, user: guard.user, project: rows[0] };
}

export async function requireOwnedImage(imageId: string) {
  if (!isUuid(imageId)) return fail('Not found', 404);

  const guard = await requireUser();
  if (!guard.ok) return guard;

  const rows = await db
    .select({ image: images, project: projects })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, guard.user.id)));
  if (!rows[0]) return fail('Not found', 404);

  return {
    ok: true as const,
    user: guard.user,
    image: rows[0].image,
    project: rows[0].project,
  };
}

export async function requireOwnedClass(classId: string) {
  if (!isUuid(classId)) return fail('Not found', 404);

  const guard = await requireUser();
  if (!guard.ok) return guard;

  const rows = await db
    .select({ cls: labelClasses })
    .from(labelClasses)
    .innerJoin(projects, eq(labelClasses.projectId, projects.id))
    .where(and(eq(labelClasses.id, classId), eq(projects.ownerId, guard.user.id)));
  if (!rows[0]) return fail('Not found', 404);

  return { ok: true as const, user: guard.user, cls: rows[0].cls };
}
