export interface Point {
  x: number;
  y: number;
}

export function normalizePoints(points: Point[], targetCount: number = 32): Point[] {
  if (points.length < 2) return points;

  // Resample to uniform spacing
  const totalLength = pathLength(points);
  const interval = totalLength / (targetCount - 1);
  const resampled: Point[] = [points[0]];
  let D = 0;

  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i]);
    if (D + d >= interval) {
      const t = (interval - D) / d;
      const newPoint: Point = {
        x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + t * (points[i].y - points[i - 1].y),
      };
      resampled.push(newPoint);
      points.splice(i, 0, newPoint);
      D = 0;
    } else {
      D += d;
    }
  }

  while (resampled.length < targetCount) {
    resampled.push(points[points.length - 1]);
  }

  return resampled.slice(0, targetCount);
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getDirection(points: Point[]): number {
  if (points.length < 2) return 0;
  const start = points[0];
  const end = points[points.length - 1];
  return Math.atan2(end.y - start.y, end.x - start.x);
}

export function compareDirections(userStroke: Point[], refStroke: Point[]): number {
  const userDir = getDirection(userStroke);
  const refDir = getDirection(refStroke);
  const diff = Math.abs(userDir - refDir);
  const normalizedDiff = Math.min(diff, 2 * Math.PI - diff);
  return Math.max(0, 1 - normalizedDiff / Math.PI);
}

export function compareShapes(userStroke: Point[], refStroke: Point[]): number {
  const userNorm = normalizePoints([...userStroke]);
  const refNorm = normalizePoints([...refStroke]);

  const minLen = Math.min(userNorm.length, refNorm.length);
  if (minLen === 0) return 0;

  let totalDist = 0;
  for (let i = 0; i < minLen; i++) {
    totalDist += distance(userNorm[i], refNorm[i]);
  }

  const avgDist = totalDist / minLen;
  // Normalize: a perfect match would be 0, worse matches grow
  // Use a sigmoid-like function to map to 0-1
  return Math.max(0, 1 - avgDist / 200);
}

export function compareStroke(userStroke: Point[], refStroke: Point[]): number {
  if (userStroke.length < 2 || refStroke.length < 2) return 0;

  const dirSimilarity = compareDirections(userStroke, refStroke);
  const shapeSimilarity = compareShapes(userStroke, refStroke);

  return 0.4 * dirSimilarity + 0.6 * shapeSimilarity;
}

// Simple reference strokes for common kanji (basic approximations)
// In production, these would come from KanjiVG SVG path data
export function getBasicStrokeRefs(character: string, canvasSize: number): Point[][] {
  // Return simple reference strokes based on stroke count patterns
  // This is a simplified version - real app would parse KanjiVG SVG data
  const s = canvasSize;
  const margin = s * 0.15;
  const inner = s - margin * 2;

  // Horizontal stroke
  const horizontal = (y: number): Point[] => [
    { x: margin, y: margin + inner * y },
    { x: margin + inner, y: margin + inner * y },
  ];

  // Vertical stroke
  const vertical = (x: number): Point[] => [
    { x: margin + inner * x, y: margin },
    { x: margin + inner * x, y: margin + inner },
  ];

  // For unknown kanji, return empty (free draw mode)
  return [];
}
