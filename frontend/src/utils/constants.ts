export const APP_NAME = "SignBridge";

export const MAIN_TABS = [
  "Learn",
  "Practice",
  "Translate",
  "Dictionary",
  "Profile",
] as const;

export type MainTab = (typeof MAIN_TABS)[number];

/** Confidence threshold before accepting a gesture prediction (ARCHITECTURE §2.3). */
export const GESTURE_CONFIDENCE_THRESHOLD = 0.85;

/** Consecutive matching frames required before emitting a token. */
export const GESTURE_STABLE_FRAME_COUNT = 4;

/** Debounce lockout (ms) before repeating the same gesture token. */
export const GESTURE_REPEAT_DEBOUNCE_MS = 400;
