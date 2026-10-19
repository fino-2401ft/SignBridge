/**
 * On-device gesture classifier stub (ROADMAP Prompt 3).
 * Will load TFLite models and apply sliding-window debounce.
 */

export interface GesturePrediction {
  label: string;
  confidence: number;
}

export async function loadGestureModels(): Promise<void> {
  throw new Error("loadGestureModels is not implemented yet (ROADMAP Prompt 3).");
}

export function classifyLandmarks(_featureVector: Float32Array): GesturePrediction {
  throw new Error("classifyLandmarks is not implemented yet (ROADMAP Prompt 3).");
}
