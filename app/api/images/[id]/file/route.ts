import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { db } from '@/lib/db';
import { users, images, projects } from '@/lib/db/schema';
import { r2, R2_BUCKET } from '@/lib/r2';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 });

  const { id: imageId } = await params;

  const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId));
  const dbUser = userRows[0];
  if (!dbUser) return new NextResponse('Not found', { status: 404 });

  const rows = await db
    .select({ image: images })
    .from(images)
    .innerJoin(projects, eq(images.projectId, projects.id))
    .where(and(eq(images.id, imageId), eq(projects.ownerId, dbUser.id)));

  if (!rows[0]) return new NextResponse('Not found', { status: 404 });

  const { image } = rows[0];

  const obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: image.r2Key }));
  if (!obj.Body) return new NextResponse('Not found', { status: 404 });

  const bytes = await obj.Body.transformToByteArray();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': obj.ContentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
