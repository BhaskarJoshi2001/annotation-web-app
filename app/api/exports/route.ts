import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exports as exportsTable, projects } from '@/lib/db/schema';
import { requireUser } from '@/lib/api/guards';

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const rows = await db
    .select({ exp: exportsTable, projectName: projects.name })
    .from(exportsTable)
    .innerJoin(projects, eq(exportsTable.projectId, projects.id))
    .where(eq(projects.ownerId, guard.user.id))
    .orderBy(desc(exportsTable.createdAt));

  return NextResponse.json(
    rows.map(({ exp, projectName }) => ({ ...exp, projectName }))
  );
}
