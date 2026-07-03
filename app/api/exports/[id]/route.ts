import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { exports as exportsTable, projects } from '@/lib/db/schema';
import { requireUser } from '@/lib/api/guards';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  // Ownership via the export's project
  const rows = await db
    .select({ exp: exportsTable })
    .from(exportsTable)
    .innerJoin(projects, eq(exportsTable.projectId, projects.id))
    .where(and(eq(exportsTable.id, id), eq(projects.ownerId, guard.user.id)));
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(exportsTable).where(eq(exportsTable.id, id));
  return new NextResponse(null, { status: 204 });
}
