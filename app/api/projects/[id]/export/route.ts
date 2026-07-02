import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { images, annotations, labelClasses } from '@/lib/db/schema';
import { requireOwnedProject } from '@/lib/api/guards';

const formatSchema = z.enum(['coco', 'yolo', 'json', 'csv']);

interface AnnData {
  type: 'bbox' | 'polygon';
  classId: string;
  x?: number; y?: number; width?: number; height?: number;
  points?: { x: number; y: number }[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const guard = await requireOwnedProject(projectId);
  if (!guard.ok) return guard.response;
  const { project } = guard;

  const { searchParams } = new URL(req.url);
  const parsedFmt = formatSchema.safeParse(searchParams.get('format') ?? 'coco');
  if (!parsedFmt.success)
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  const format = parsedFmt.data;
  const includeEmpty = searchParams.get('includeEmpty') === 'true';

  const projectImages = await db.select().from(images).where(eq(images.projectId, projectId));
  const classes = await db.select().from(labelClasses).where(eq(labelClasses.projectId, projectId));

  const imageIds = projectImages.map((i) => i.id);
  const allAnns = imageIds.length > 0
    ? await db.select().from(annotations).where(inArray(annotations.imageId, imageIds))
    : [];

  const annsByImage = new Map<string, typeof allAnns>();
  allAnns.forEach((ann) => {
    if (!annsByImage.has(ann.imageId)) annsByImage.set(ann.imageId, []);
    annsByImage.get(ann.imageId)!.push(ann);
  });

  const toExport = includeEmpty
    ? projectImages
    : projectImages.filter((img) => (annsByImage.get(img.id)?.length ?? 0) > 0);

  const slug = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // ── COCO ────────────────────────────────────────────────────────────────────
  if (format === 'coco') {
    const catMap = new Map(classes.map((c, i) => [c.id, i + 1]));
    const categories = classes.map((c, i) => ({ id: i + 1, name: c.name, supercategory: 'object' }));
    const cocoImages = toExport.map((img, i) => ({
      id: i + 1, file_name: img.filename, width: img.width ?? 0, height: img.height ?? 0,
    }));
    const imgCocoId = new Map(toExport.map((img, i) => [img.id, i + 1]));

    let annId = 1;
    const cocoAnns: object[] = [];
    for (const img of toExport) {
      for (const ann of annsByImage.get(img.id) ?? []) {
        const d = ann.data as AnnData;
        const catId = catMap.get(d.classId) ?? 1;
        const imgId = imgCocoId.get(img.id)!;
        if (d.type === 'bbox' && d.x !== undefined) {
          cocoAnns.push({ id: annId++, image_id: imgId, category_id: catId,
            bbox: [d.x, d.y, d.width, d.height], area: (d.width ?? 0) * (d.height ?? 0), iscrowd: 0 });
        } else if (d.type === 'polygon' && d.points) {
          const flat = d.points.flatMap((p) => [p.x, p.y]);
          const xs = d.points.map((p) => p.x); const ys = d.points.map((p) => p.y);
          const minX = Math.min(...xs); const minY = Math.min(...ys);
          const w = Math.max(...xs) - minX; const h = Math.max(...ys) - minY;
          cocoAnns.push({ id: annId++, image_id: imgId, category_id: catId,
            bbox: [minX, minY, w, h], segmentation: [flat], area: w * h, iscrowd: 0 });
        }
      }
    }

    const coco = { images: cocoImages, annotations: cocoAnns, categories,
      info: { description: project.name, date_created: new Date().toISOString() } };
    return new NextResponse(JSON.stringify(coco, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${slug}_coco.json"`,
      },
    });
  }

  // ── YOLO (ZIP) ───────────────────────────────────────────────────────────────
  if (format === 'yolo') {
    const classIdToIdx = new Map(classes.map((c, i) => [c.id, i]));
    const zip = new JSZip();
    zip.file('classes.txt', classes.map((c) => c.name).join('\n'));

    for (const img of toExport) {
      const lines: string[] = [];
      for (const ann of annsByImage.get(img.id) ?? []) {
        const d = ann.data as AnnData;
        if (d.type !== 'bbox' || d.x === undefined) continue;
        const idx = classIdToIdx.get(d.classId) ?? 0;
        const W = img.width ?? 1; const H = img.height ?? 1;
        const xc = ((d.x ?? 0) + (d.width ?? 0) / 2) / W;
        const yc = ((d.y ?? 0) + (d.height ?? 0) / 2) / H;
        const w = (d.width ?? 0) / W; const h = (d.height ?? 0) / H;
        lines.push(`${idx} ${xc.toFixed(6)} ${yc.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`);
      }
      const base = img.filename.replace(/\.[^.]+$/, '');
      zip.folder('labels')!.file(`${base}.txt`, lines.join('\n'));
    }

    const buf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return new NextResponse(new Blob([ab], { type: 'application/zip' }), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${slug}_yolo.zip"`,
      },
    });
  }

  // ── JSON ─────────────────────────────────────────────────────────────────────
  if (format === 'json') {
    const result = {
      project: { id: project.id, name: project.name, taskType: project.taskType },
      labelClasses: classes,
      images: toExport.map((img) => ({
        id: img.id, filename: img.filename, width: img.width, height: img.height, status: img.status,
        annotations: (annsByImage.get(img.id) ?? []).map((a) => a.data),
      })),
      exportedAt: new Date().toISOString(),
    };
    return new NextResponse(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${slug}_annotations.json"`,
      },
    });
  }

  // ── CSV ──────────────────────────────────────────────────────────────────────
  if (format === 'csv') {
    const header = 'filename,width,height,status,annotation_count,class_ids';
    const rows = toExport.map((img) => {
      const anns = annsByImage.get(img.id) ?? [];
      const classIds = [...new Set(anns.map((a) => (a.data as AnnData).classId))].join(';');
      return `"${img.filename}",${img.width ?? ''},${img.height ?? ''},${img.status},${anns.length},"${classIds}"`;
    });
    return new NextResponse([header, ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${slug}_manifest.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
