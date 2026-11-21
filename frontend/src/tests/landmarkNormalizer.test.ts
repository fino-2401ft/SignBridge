import { describe, test, expect } from "./testHarness";
import { normalizeHandLandmarks, computeBoundingBox } from "../utils/landmarkNormalizer";
import type { LandmarkPoint } from "../utils/landmarkNormalizer";

describe("landmarkNormalizer", () => {
  function makeMockHand(): LandmarkPoint[] {
    const points: LandmarkPoint[] = [];
    for (let i = 0; i < 21; i++) {
      points.push({ x: 100 + i * 5, y: 200 + i * 5, z: i * 0.1 });
    }
    return points;
  }

  test("rejects invalid hand array with fewer than 21 keypoints", () => {
    const invalid = [{ x: 10, y: 10 }];
    const normalized = normalizeHandLandmarks(invalid);
    expect(normalized).toBeNull();
  });

  test("translates wrist to coordinate (0, 0) upon normalization", () => {
    const hand = makeMockHand();
    const normalized = normalizeHandLandmarks(hand);
    expect(normalized).not.toBeNull();
    if (normalized) {
      expect(normalized.points[0]?.x).toBe(0);
      expect(normalized.points[0]?.y).toBe(0);
      expect(normalized.palmSize).toBeGreaterThan(0);
    }
  });

  test("calculates accurate bounding box enclosing landmarks", () => {
    const hand = makeMockHand();
    const bbox = computeBoundingBox(hand);
    expect(bbox.maxX).toBeGreaterThanOrEqual(bbox.minX);
    expect(bbox.maxY).toBeGreaterThanOrEqual(bbox.minY);
    expect(bbox.minX).toBe(100);
  });
});
