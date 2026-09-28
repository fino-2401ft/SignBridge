---
name: clean-architecture-modular
description: >-
  Enforces Clean Architecture, Domain-Driven Design (DDD), and Modular Layering in React Native & TypeScript projects.
  Use when structuring features, decoupling ML inference from UI, organizing Zustand stores, or defining service contracts.
---

# Clean Architecture & Modular Patterns (React Native & Edge ML)

This skill guides the agent to design and maintain scalable, decoupled, and testable codebases for mobile applications integrating edge AI models.

---

## 1. The 4-Tier Architectural Boundary

All project modules must strictly respect unidirectional dependency boundaries:

```
[ Presentation Layer (UI/Screens) ]
               │
               ▼
   [ Domain / Application Layer (Zustand Stores & Use-Cases) ]
               │
               ▼
[ Infrastructure Layer (Firebase, MediaPipe/TFLite, Native Modules) ]
               │
               ▼
   [ Core Types & Data Transfer Objects (Zod Schemas, Entities) ]
```

### The Inviolable Separation Rules:
1. **Never Call Hardware/SDK directly from UI Components:**
   - ❌ `TranslationScreen.tsx` calling `firebase.firestore().collection(...)` or `tflite.runInference(...)`.
   - ✅ UI triggers a store action: `useTranslationStore.getState().startInference()`.
2. **Edge ML Isolation:**
   - All frame processing, coordinate math, and model interpreters reside strictly in `@src/ml/`.
   - Presentation components only receive clean domain objects: `{ gestureLabel: string, confidence: number, landmarks: Point3D[] }`.
3. **Data Access via Service Facades:**
   - Wrap external dependencies (Firebase Auth, Firestore, AsyncStorage, TTS) inside dedicated services in `@src/services/`. This allows effortless mocking during unit tests.

---

## 2. Zustand Store Design Patterns

1. **State Slices Pattern:**
   For complex domains (e.g. Learning curriculum + Practice progress), split state into distinct slices and compose them.
2. **Selector-based Subscriptions:**
   Always use selector hooks in React components to eliminate unnecessary re-renders during high-frequency camera inference:
   ```tsx
   // ❌ Anti-pattern: Component re-renders on ANY store update
   const { liveText } = useTranslationStore();

   // ✅ Best practice: Subscribes ONLY to the specific primitive
   const liveText = useTranslationStore((state) => state.liveText);
   ```

---

## 3. Strict DTO & Zod Validation Flow

All external payloads (incoming network JSON, local storage cache, URL deep links) must be validated at the boundary:

```typescript
import { z } from 'zod';

export const GestureSchema = z.object({
  gestureId: z.string().uuid(),
  label: z.string().min(1),
  category: z.enum(['alphabet', 'number', 'greeting', 'emergency', 'daily']),
  videoUrl: z.string().url(),
  isDynamic: z.boolean().default(false),
});

export type GestureDTO = z.infer<typeof GestureSchema>;

// Validate incoming data
export function parseGesture(payload: unknown): GestureDTO {
  return GestureSchema.parse(payload);
}
```

---

## 4. Error Handling & Resilience Strategy

- **Graceful Degradation:** When on-device inference runs on a low-end device, downsample camera frame rate from 30 FPS to 15 FPS dynamically before throwing frame drops.
- **Result Type Pattern:** For critical services, return a typed `Result<T, E>` pattern `{ success: true, data: T } | { success: false, error: AppError }` instead of throwing uncaught exceptions across native bridges.
