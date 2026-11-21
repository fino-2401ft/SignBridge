export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface NormalizedLandmarks {
  points: LandmarkPoint[];
  palmSize: number;
  wristOffset: LandmarkPoint;
}

/**
 * Normalizes 21 MediaPipe hand keypoints:
 * 1. Translates keypoints relative to wrist (index 0).
 * 2. Normalizes scale by palm distance (wrist to middle MCP index 9).
 */
export function normalizeHandLandmarks(
  rawPoints: LandmarkPoint[],
): NormalizedLandmarks | null {
  if (rawPoints.length < 21) {
    return null;
  }

  const wrist = rawPoints[0] || { x: 0, y: 0 };
  const middleMcp = rawPoints[9] || { x: 0, y: 0 };

  // Calculate palm size (Euclidean distance from wrist to middle MCP)
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const palmSize = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));

  const normalized = rawPoints.map((pt) => ({
    x: (pt.x - wrist.x) / palmSize,
    y: (pt.y - wrist.y) / palmSize,
    z: pt.z !== undefined ? pt.z / palmSize : undefined,
  }));

  return {
    points: normalized,
    palmSize,
    wristOffset: wrist,
  };
}

/**
 * Computes bounding box enclosing the 21 landmarks.
 */
export function computeBoundingBox(
  points: LandmarkPoint[],
): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  return { minX, maxX, minY, maxY };
}
