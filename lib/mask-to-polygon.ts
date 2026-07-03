import { PNG } from 'pngjs';
import simplify from 'simplify-js';

export interface Point {
  x: number;
  y: number;
}

// Clockwise 8-neighborhood ring in image coordinates (y grows downward):
// E, SE, S, SW, W, NW, N, NE
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

/**
 * Convert a SAM mask PNG into an editable polygon.
 *
 * Traces the boundary of the mask blob containing `seed` (the user's click)
 * with Moore-neighbor tracing, then reduces the raster-edge points with
 * Ramer-Douglas-Peucker so the result has editable-vertex density instead
 * of thousands of pixel steps.
 *
 * Returns null when the mask has no foreground near the seed.
 */
export function maskToPolygon(png: Buffer, seed: Point): Point[] | null {
  const img = PNG.sync.read(png);
  const { width: W, height: H, data } = img;

  // SAM masks are white-on-black; alpha guard covers alpha-encoded variants
  const isFg = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = (y * W + x) * 4;
    return data[i] > 127 && data[i + 3] > 127;
  };

  const start = findSeedPixel(isFg, W, H, seed);
  if (!start) return null;

  // Walk left to the blob's boundary — the first pixel whose left
  // neighbor is background
  let bx = start.x;
  while (isFg(bx - 1, start.y)) bx--;
  const boundary = { x: bx, y: start.y };
  const backtrack = { x: bx - 1, y: start.y };

  const contour = traceBoundary(isFg, W, H, boundary, backtrack);
  if (contour.length < 3) return null;

  // Tolerance scales with image size: ~0.3% of the long edge, min 2px
  const tolerance = Math.max(2, 0.003 * Math.max(W, H));
  const simplified = simplify(contour, tolerance, true);

  return simplified.length >= 3 ? simplified : contour;
}

// The click should land inside the mask, but SAM boundaries are imprecise —
// spiral outward a little before giving up.
function findSeedPixel(
  isFg: (x: number, y: number) => boolean,
  W: number,
  H: number,
  seed: Point
): Point | null {
  const sx = Math.min(W - 1, Math.max(0, Math.round(seed.x)));
  const sy = Math.min(H - 1, Math.max(0, Math.round(seed.y)));

  const MAX_RADIUS = 20;
  for (let r = 0; r <= MAX_RADIUS; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring only
        if (isFg(sx + dx, sy + dy)) return { x: sx + dx, y: sy + dy };
      }
    }
  }
  return null;
}

function traceBoundary(
  isFg: (x: number, y: number) => boolean,
  W: number,
  H: number,
  start: Point,
  startBacktrack: Point
): Point[] {
  const contour: Point[] = [];
  let cur = start;
  let backtrack = startBacktrack;

  // A blob's boundary can't exceed its pixel count — hard cap against
  // any tracing pathology
  const maxSteps = W * H;

  for (let step = 0; step < maxSteps; step++) {
    contour.push(cur);

    const dx = backtrack.x - cur.x;
    const dy = backtrack.y - cur.y;
    const backIdx = DIRS.findIndex(([ex, ey]) => ex === dx && ey === dy);

    let advanced = false;
    for (let i = 1; i <= 8; i++) {
      const j = (backIdx + i) % 8;
      const nx = cur.x + DIRS[j][0];
      const ny = cur.y + DIRS[j][1];
      if (isFg(nx, ny)) {
        // New backtrack = the last background cell checked before this hit
        const prev = (j + 7) % 8;
        backtrack = { x: cur.x + DIRS[prev][0], y: cur.y + DIRS[prev][1] };
        cur = { x: nx, y: ny };
        advanced = true;
        break;
      }
    }

    if (!advanced) break; // isolated single pixel
    if (cur.x === start.x && cur.y === start.y) break; // closed the loop
  }

  return contour;
}
