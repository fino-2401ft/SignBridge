# SIGNBRIDGE — AI-Driven Mobile App for Real-Time Sign Language Recognition

> **Mission:** Bridging the communication gap between the deaf/hard-of-hearing community and hearing individuals through real-time American Sign Language (ASL) recognition and accessible learning.

---

## 📱 Technology Stack Overview

| Layer | Standard Technology |
| :--- | :--- |
| **Mobile Runtime** | React Native (Expo SDK 51+ / Native Android API 26+) |
| **Language** | TypeScript (Strict mode, zero `any`) |
| **Edge AI & Vision** | MediaPipe Hands (21 3D Landmarks) + TensorFlow Lite (100% On-Device Inference) |
| **Camera Feed** | `react-native-vision-camera` (v4.x) with Frame Processor Worklets |
| **State Management** | Zustand (Slices pattern & Selector subscriptions) |
| **Backend & Cloud** | Firebase (Authentication, Cloud Firestore, Cloud Storage) |
| **Styling & UI** | NativeWind / Tailwind CSS + React Native Reanimated 3 |

---

## 📚 Project Documentation (Spec-Driven Development)

All technical designs and specifications follow the **Spec-Driven AI Development** methodology:

| Document | Description |
| :--- | :--- |
| [AGENTS.md](file:///d:/VKU_SEMESTER_7/Ai%20product/AGENTS.md) | AI Agent operational principles, strict coding rules, directory layout & constraints. |
| [docs/PRD.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/PRD.md) | Canonical Product Requirements Document (Core value proposition, personas, functional & non-functional requirements). |
| [docs/ARCHITECTURE.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/ARCHITECTURE.md) | High-level system architecture, on-device AI pipeline, coordinate normalization math, Firestore schema, Zustand stores & security rules. |
| [docs/ROADMAP.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/ROADMAP.md) | Phased implementation roadmap (Steps 1–6) with acceptance checklists and spec-driven prompts A–Z. |
| [docs/1-product-discovery/](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/1-product-discovery) | Product discovery artifacts, project brief, and context. |
| [docs/2-prd/3.2-prd.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/2-prd/3.2-prd.md) | Comprehensive line-by-line PRD specification. |
| [docs/3-requirement-analysis/3.3-requirement-analysis.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/3-requirement-analysis/3.3-requirement-analysis.md) | Functional & non-functional requirements breakdown. |
| [docs/4-user-stories-acceptance/3.4-user-stories-acceptance.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/4-user-stories-acceptance/3.4-user-stories-acceptance.md) | Detailed user stories with Given-When-Then acceptance criteria. |
| [docs/5-feature-specification/3.5-feature-specification.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/5-feature-specification/3.5-feature-specification.md) | Feature behavior contracts, error codes, and persistence flows. |

---

## 🧠 Custom Agent Skills (`.agents/skills`)

- **`mobile-ui-animation`**: Guidelines for accessible, high-performance visual-first UI components and Reanimated 3 worklets.
- **`clean-architecture-modular`**: Enforcement of 4-tier clean architecture, Zustand store isolation, and Zod validation.

---

## 🚀 Getting Started

Refer to [docs/ROADMAP.md](file:///d:/VKU_SEMESTER_7/Ai%20product/docs/ROADMAP.md) for milestone tracking and prompt sequences to build each feature step-by-step.
