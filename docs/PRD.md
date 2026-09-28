# SIGNBRIDGE — Product Requirement Document (PRD)

> **Document Status:** Canonical Baseline (`Accepted`)  
> **Product Name:** SIGNBRIDGE — AI-Driven Mobile App for Sign Language Recognition  
> **Primary Platform:** Mobile Android (API 26+, Android 8.0+) | Secondary: iOS (Phase 2)  
> **Target Release:** MVP Q4 2026  
> **Source Documents:** [3.2-prd.md](2-prd/3.2-prd.md) | [3.3-requirement-analysis.md](3-requirement-analysis/3.3-requirement-analysis.md) | [3.4-user-stories-acceptance.md](4-user-stories-acceptance/3.4-user-stories-acceptance.md) | [3.5-feature-specification.md](5-feature-specification/3.5-feature-specification.md)

---

## 1. Product Summary & Strategic Intent

### 1.1 Problem Statement
Over 430 million people worldwide experience disabling hearing loss. The deaf and hard-of-hearing community faces severe daily communication friction with hearing individuals who do not know sign language. Traditional human interpreters are expensive ($60–$120/hr) and unavailable on demand. Existing digital tools either require specialized hardware, rely on intrusive cloud video uploads, or lack real-time conversational feedback.

### 1.2 Core Value Proposition
SIGNBRIDGE bridges this gap through a mobile-first, privacy-by-design application providing:
1. **On-Device Real-Time ASL Translation:** Instant translation from ASL gestures to on-screen text and synthetic speech with $< 100\text{ ms}$ latency and $0\%$ video data transmission.
2. **Interactive Practice Room:** Split-screen visual learning combining professional demonstration videos with real-time pose matching and similarity feedback.
3. **Structured & Gamified Curricula:** Micro-learning units, flashcards with spaced repetition, XP points, and streak tracking.

---

## 2. Target Personas & Key Use Cases

| Persona | Role | Primary Goal | Critical Pain Point |
| :--- | :--- | :--- | :--- |
| **Alex (24)** | Deaf University Student | Communicate casually at coffee shops and service counters. | Cloud apps invade privacy; typing on notes is slow and awkward. |
| **Sarah (31)** | Hearing Mother of Deaf Child | Learn ASL systematically at home and practice with instant feedback. | Doesn't know if hand gestures are formed correctly without a tutor. |
| **Marcus (45)** | High School ASL Educator | Recommend reliable practice tools to students outside classroom hours. | Students forget finger spelling positions and lack continuous motivation. |

---

## 3. Core Functional Requirements (FR Summary)

### FR-01: Authentication & User Profile
- Email/Password registration & login via Firebase Auth with Zod validation.
- Profile customization: Dominant hand selection (Left/Right), TTS voice toggles, speech rate.
- Persistent session state synced via Zustand `useAuthStore`.

### FR-02: Searchable ASL Dictionary
- Comprehensive gesture repository categorised by Alphabet, Numbers, Common Greetings, and Emergency Phrases.
- High-definition demonstration video clips with slow-motion playback ($0.5\times, 0.75\times$).
- Bookmark favorite signs for offline quick access.

### FR-03: Split-Screen Practice Room
- Split-viewport layout: Top half displays reference demo; bottom half activates front-facing camera.
- Overlay hand skeleton landmarks in real-time ($30\text{ FPS}$).
- Real-time gesture similarity scoring ($0–100\%$) based on Euclidean distance between normalized user landmarks and baseline gesture keypoints.
- Haptic and visual celebratory feedback upon passing score ($\ge 85\%$).

### FR-04: Real-Time Live Translation HUD
- Full-screen or picture-in-picture camera view for conversations.
- Continuous gesture classification into text characters/words with debounce filtering.
- Audio synthesis readout (TTS) with a single tap for hearing interlocutors.

### FR-05: Learning Paths & Spaced Repetition Flashcards
- Hierarchical course structure: Learning Path $\rightarrow$ Units $\rightarrow$ Lessons.
- Spaced repetition algorithm for vocabulary retention.
- Progress auto-saving to local SQLite/AsyncStorage and delta sync to Firestore.

### FR-06: Gamification (XP, Levels, Streaks)
- Earn XP upon lesson completion ($\text{XP} = \text{Base} \times \text{Accuracy Multiplier}$).
- Daily streak counters with freeze protection alerts.
- Level progression badges displayed on user profile.

---

## 4. Non-Functional Requirements (NFR Summary)

| Category | Requirement | Target Metric / Acceptance Criteria |
| :--- | :--- | :--- |
| **Inference Latency** | On-device model execution time | $< 35\text{ ms}$ per frame; end-to-end feedback $< 100\text{ ms}$. |
| **Frame Rate** | Camera preview and landmark rendering | Stable $\ge 25–30\text{ FPS}$ on mid-tier Android devices (e.g. Snapdragon 680+). |
| **Accuracy** | Static alphabet gesture recognition | $\ge 90\%$ Precision/Recall under standard lighting ($> 150\text{ lux}$). |
| **Privacy** | Zero remote image transmission | $0\text{ bytes}$ of camera pixel data transmitted to servers. Verified via network inspector. |
| **Offline Resilience**| Core learning & dictionary availability | Model and core dictionary playable offline without network connection. |
| **Battery & Thermal** | Sustained camera usage | $< 12\%$ battery consumption per 30 minutes of continuous practice. |

---

## 5. Edge Cases & Exception Handling

1. **Poor Lighting / Low Illumination:** App triggers a non-blocking HUD indicator: *"Lighting is too dim for accurate hand tracking"* when landmark confidence drops below $0.5$.
2. **Partial Hand Occlusion / Hand Out of Frame:** System pauses prediction and displays a visual guide box guiding the user to reposition their hand within the active scanner zone.
3. **Rapid Uncontrolled Hand Shaking:** Debounce buffer drops unstable landmark fluctuations, preventing bogus translation spam.
4. **Offline Mode Transitions:** All earned XP, completed lessons, and practice sessions are queued in local persistent store and synced via idempotency keys when connection is restored.
