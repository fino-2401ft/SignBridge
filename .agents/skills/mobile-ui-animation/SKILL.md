---
name: mobile-ui-animation
description: >-
  Specialized skill for crafting premium React Native & Expo UI components with NativeWind/Tailwind,
  React Native Reanimated micro-interactions, responsive mobile layouts across Android screens,
  dark mode palettes, and accessible visual-first design for deaf/hard-of-hearing users.
---

# Mobile UI & Micro-Animation Specialist (React Native & Android)

This skill guides the agent to produce state-of-the-art, accessible, and high-performance mobile user interfaces for React Native (Expo SDK 51+) targeting modern Android devices.

---

## 1. Core Visual Principles & Accessibility

1. **Visual-First Accessibility (Deaf & Hard-of-Hearing UX):**
   - Sound cues must **always** have visual counterparts (pulsing borders, color-coded badges, toast notifications).
   - Use subtle haptic feedback (`expo-haptics` or `react-native-haptic-feedback`) on successful recognition or button presses.
   - High contrast ratio (WCAG AAA) for subtitle HUD and camera overlays.
2. **Color Palette & Glassmorphism:**
   - Avoid harsh pure primaries. Use modern slate/zinc dark mode backgrounds (`#0F172A`, `#1E293B`) with emerald/teal accents (`#10B981`, `#06B6D4`) for success states and amber (`#F59E0B`) for warnings.
   - Use translucent frosted card backgrounds (`bg-slate-800/80 backdrop-blur-md border border-slate-700/50`).

---

## 2. Styling System with NativeWind / Tailwind

- **Layout & Safe Area:** Always wrap screen roots in `SafeAreaView` from `react-native-safe-area-context` with `edges={['top', 'bottom']}`.
- **Dynamic Sizing & Responsiveness:**
  - Avoid hardcoded fixed pixel widths. Use Flexbox (`flex-1`, `flex-row`, `items-center`, `justify-between`) and percentage/aspect-ratio values.
  - Use `gap-2`, `gap-4` for consistent grid spacing.
- **Interactive States:** Provide distinct active opacities or scale feedback for touchable elements:
  ```tsx
  <Pressable 
    className="active:scale-95 active:opacity-85 transition-transform bg-teal-500 rounded-2xl py-3 px-6 shadow-lg shadow-teal-500/30"
  >
    <Text className="text-white font-semibold text-center text-base">Start Practice</Text>
  </Pressable>
  ```

---

## 3. High-Performance Micro-Interactions (Reanimated 3)

In high-frame-rate camera environments, state updates must **never** block the JS thread.

1. **Rule of Worklets:** Run all visual transformations using `react-native-reanimated` shared values on the UI thread:
   ```tsx
   import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

   export const AccuracyGauge = ({ score }: { score: number }) => {
     const progress = useSharedValue(score);

     React.useEffect(() => {
       progress.value = withSpring(score, { damping: 15, stiffness: 90 });
     }, [score]);

     const animatedStyle = useAnimatedStyle(() => ({
       width: `${progress.value}%`,
       backgroundColor: progress.value >= 85 ? '#10B981' : '#F59E0B',
     }));

     return (
       <View className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
         <Animated.View style={animatedStyle} className="h-full rounded-full" />
       </View>
     );
   };
   ```

2. **Skeleton Loaders over Spinners:** For video lessons and gesture cards, use shimmer skeletons (`SkeletonView`) to give an instantaneous, native feel.

---

## 4. Split-Screen & Camera HUD Patterns

When implementing the Split-Screen Practice Room:
- **Upper Half (Reference View):** Clean 16:9 or 1:1 aspect video container with slow-motion toggle button floating at top-right.
- **Lower Half (Live Camera):**
  - Edge-to-edge camera preview with translucent bounding box indicator (Scanning Zone).
  - Landmark Keypoints Overlay: Render 21 skeleton joints using lightweight SVG paths (`react-native-svg`), colored neon green when accuracy $\ge 85\%$ and cyan during tracking.
- **Bottom Drawer / Subtitle Bar:** Sticky bottom sheet with auto-scrolling translation tokens and instant TTS speaker icon.
