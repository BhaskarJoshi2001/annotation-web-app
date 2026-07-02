import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

// Content-Type is part of the signature — the client cannot upload a
// different type than the one the URL was signed for.
export function presignPutUrl(key: string, contentType: string, expiresIn = 300) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

export function presignGetUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn }
  );
}

export async function headObject(key: string) {
  try {
    return await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    return null;
  }
}

export function deleteObject(key: string) {
  return r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

// List pages are capped at 1000 keys — the same limit DeleteObjects accepts,
// so each page maps to exactly one batch-delete call.
export async function deleteByPrefix(prefix: string) {
  let cursor: string | undefined;
  do {
    const listed = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: cursor,
      })
    );
    const keys = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: keys } })
      );
    }
    cursor = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (cursor);
}
