# SIGNBRIDGE Project Context

> **Status:** Approved
> **Version:** 1.0
> **Date:** 2026-09-08
> **Project:** AI-Driven Mobile App for Sign Language Recognition

---

## 1. Project Background

### 1.1 Origin Story

SIGNBRIDGE was conceived after recognizing a critical gap in assistive technology for the deaf community. While hearing aid technology has advanced significantly, communication tools for deaf individuals remain limited. The founding team, which includes members of the deaf community, identified three key pain points:

1. **Communication Barriers** - Deaf individuals cannot communicate with hearing people without an interpreter
2. **Learning Accessibility** - Most ASL learning resources are designed for hearing people, using text to teach a visual language
3. **Privacy Concerns** - Existing translation apps send video data to cloud servers, raising privacy issues

The project name "SIGNBRIDGE" represents the mission: creating a bridge between the deaf and hearing communities through technology.

### 1.2 Market Context

The deaf and hard-of-hearing community represents a significant underserved market:

- **Global:** 430+ million people with disabling hearing loss (WHO)
- **United States:** 11 million deaf or hard-of-hearing individuals
- **ASL Users:** Approximately 1 million native ASL users; 500,000+ regular users
- **Market Gap:** Limited mobile apps focused specifically on ASL with AI capabilities

### 1.3 Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| ** ASL Dictionary (MDIC) | Large gesture database | No AI, no real-time translation |
| ** SignSchool (MotionSavvy) | Learning focus | AI requires Leap Motion hardware |
| ** Google Sign Language Live | Real-time translation | Cloud-based, privacy concerns |
| ** Microsoft ASL Translator | AI-powered | Web-based, not mobile-first |
| ** Hands Land (Various) | Video lessons | No translation, limited AI |

SIGNBRIDGE differentiates by combining learning + real-time translation + on-device AI in a mobile-first, privacy-focused application.

---

## 2. Product Vision

### 2.1 Vision Statement

*"To empower deaf and hard-of-hearing individuals to communicate freely with the world through AI-powered sign language recognition, while making ASL learning accessible to everyone."*

### 2.2 Core Values

| Value | Description | User Impact |
|-------|-------------|--------------|
| **Accessibility First** | Every feature designed with deaf users as primary audience | UI optimized for visual learning |
| **Privacy by Design** | No data collection; all processing on-device | Users trust the app with their communication |
| **Inclusive Learning** | Learning paths designed by deaf educators | Authentic, culturally appropriate content |
| **Continuous Improvement** | AI model updated based on user feedback | Accuracy improves over time |
| **Community Driven** | Regular updates based on user needs | Feature roadmap aligned with community |

### 2.3 Design Philosophy

The app follows a "Visual-First" design philosophy:

- **Video over Text** - Gesture demonstrations are primary; text is secondary
- **Icons over Words** - Icon-based navigation reduces reading requirement
- **Feedback over Instructions** - AI provides immediate visual feedback
- **Progress over Perfection** - Gamification encourages practice without fear of failure

---

## 3. User Research Insights

### 3.1 Primary User Research Findings

Based on interviews with 25 deaf and hard-of-hearing individuals:

| Finding | Percentage | Implication |
|---------|------------|-------------|
| "I wish I could communicate without an interpreter" | 84% | Real-time translation is critical |
| "Existing translation apps feel creepy (privacy)" | 76% | On-device processing is essential |
| "I want to learn ASL but text-based lessons don't work" | 72% | Video-first learning required |
| "I practice ASL but don't know if I'm doing it right" | 68% | AI feedback is highly desired |
| "I learn better with gamification and progress tracking" | 64% | XP and streaks increase engagement |

### 3.2 User Journey Pain Points

```
Current Journey (Without SIGNBRIDGE):

Deaf User → Needs to communicate with hearing person
    ↓
Options: [1] Sign and hope they understand | [2] Write it down | [3] Find interpreter
    ↓
Challenge: All options are slow, awkward, or expensive
    ↓
Result: Reduced communication, frustration, isolation

Desired Journey (With SIGNBRIDGE):

Deaf User → Needs to communicate with hearing person
    ↓
Opens SIGNBRIDGE → Points camera at themselves → Signs
    ↓
SIGNBRIDGE translates to text/speech in real-time
    ↓
Hearing person reads/hears the message
    ↓
Result: Natural, instant communication
```

### 3.3 Accessibility Requirements

| Requirement | Source | Implementation |
|-------------|--------|----------------|
| WCAG 2.1 AA Compliance | Legal | High contrast, screen reader support |
| Visual Notifications | User Research | Flash/colors for alerts (not sound) |
| Minimal Reading | User Research | Icons, videos, visual cues |
| Touch-Friendly | User Research | 44pt minimum touch targets |
| Offline Capability | User Research | Translation works without internet |

---

## 4. Technical Context

### 4.1 AI/ML Architecture

#### Hand Gesture Recognition Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    ON-DEVICE AI STACK                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Camera    │───▶│  MediaPipe  │───▶│  TFLite      │   │
│  │   (30 FPS)  │    │  Hand       │    │  Classifier  │   │
│  └─────────────┘    │  Landmarks   │    │  (ASL Model) │   │
│         │           └─────────────┘    └─────────────┘     │
│         │                  │                   │           │
│         ▼                  ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              POST-PROCESSING LAYER                   │   │
│  │  • Smoothing (temporal filtering)                   │   │
│  │  • Gesture classification                           │   │
│  │  • Confidence scoring                               │   │
│  │  • Word formation                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OUTPUT                                  │   │
│  │  • Text buffer (for translation)                    │   │
│  │  • Score overlay (for practice)                      │   │
│  │  • TTS playback (optional)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### MediaPipe Hand Landmarks

21-point hand model used for gesture recognition:

```
Point mapping:
0: Wrist
1-4: Thumb (CMC, MCP, IP, TIP)
5-8: Index finger (MCP, PIP, DIP, TIP)
9-12: Middle finger
13-16: Ring finger
17-20: Pinky finger

Coordinate system:
- x, y: Normalized [0, 1] relative to image dimensions
- z: Depth relative to wrist (orthogonal to palm plane)
```

#### TensorFlow Lite Model

| Property | Value | Notes |
|----------|-------|-------|
| Model Size | < 50MB | Compressed, quantized |
| Input Shape | (1, 63) | 21 landmarks × 3 coordinates |
| Output | (1, N) | N = number of gesture classes |
| Latency | < 50ms | Per inference |
| Framework | TFLite 2.14+ | GPU delegate for acceleration |

### 4.2 Data Architecture

#### Firestore Collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── avatarUrl: string
│       ├── role: "user" | "admin"
│       ├── xp: number
│       ├── streak: number
│       ├── createdAt: timestamp
│       └── progress/
│           ├── completedLessons: string[]
│           ├── completedPaths: string[]
│           ├── flashcardProgress: map
│           └── practiceHistory: array
│
├── learningPaths/
│   └── {pathId}/
│       ├── title: string
│       ├── description: string
│       ├── thumbnailUrl: string
│       ├── order: number
│       ├── unlockType: "none" | "path_complete" | "xp_threshold"
│       ├── unlockValue: number (for xp_threshold)
│       └── lessons: subcollection
│
├── lessons/
│   └── {lessonId}/
│       ├── pathId: string
│       ├── title: string
│       ├── description: string
│       ├── videoUrl: string
│       ├── thumbnailUrl: string
│       ├── duration: number (seconds)
│       ├── xpReward: number
│       ├── gestures: string[]
│       └── order: number
│
├── dictionary/
│   └── {gestureId}/
│       ├── word: string
│       ├── alternatives: string[]
│       ├── category: string
│       ├── videoUrl: string
│       ├── thumbnailUrl: string
│       ├── description: string
│       ├── difficulty: "beginner" | "intermediate" | "advanced"
│       └── tags: string[]
│
└── practiceSessions/
    └── {sessionId}/
        ├── userId: string
        ├── startTime: timestamp
        ├── endTime: timestamp
        ├── gestures: array
        ├── avgScore: number
        └── bestScore: number
```

#### Cloud Storage Structure

```
firebase-storage/
├── videos/
│   ├── lessons/
│   │   └── {lessonId}.mp4
│   ├── gestures/
│   │   └── {gestureId}.mp4
│   └── samples/
│       └── {gestureId}_sample.mp4
│
├── thumbnails/
│   ├── lessons/
│   │   └── {lessonId}.jpg
│   └── gestures/
│       └── {gestureId}.jpg
│
└── avatars/
    └── {userId}.jpg
```

### 4.3 Security Architecture

#### Privacy Model

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIVACY ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  USER'S DEVICE                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Camera → Frame Buffer → MediaPipe → TFLite        │   │
│  │              ↓                                       │   │
│  │  RAM (frame pixels) - DISPOSED AFTER PROCESSING     │   │
│  │              ↓                                       │   │
│  │  No frame saved to disk                             │   │
│  │  No frame sent to network                           │   │
│  │              ↓                                       │   │
│  │  Only prediction result (text/score) sent to UI     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  CLOUD (Firebase)                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ User account data (email, name, XP)              │   │
│  │  ✓ Learning progress (completed lessons)            │   │
│  │  ✓ Practice statistics (scores, session counts)     │   │
│  │  ✗ Video recordings of user signing                 │   │
│  │  ✗ Camera frames                                    │   │
│  │  ✗ Real-time translation content                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User                    App                    Firebase    │
│    │                      │                         │        │
│    │──── Register ───────▶│                         │        │
│    │                      │──── Create User ───────▶│        │
│    │                      │◀─── User Created ───────│        │
│    │◀─ Success ──────────│                         │        │
│    │                      │                         │        │
│    │──── Login ──────────▶│                         │        │
│    │                      │──── Verify ─────────────▶│        │
│    │                      │◀─── Token ──────────────│        │
│    │                      │                         │        │
│    │◀─ Home Screen ──────│                         │        │
│    │                      │                         │        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Content Context

### 5.1 Initial ASL Dataset

For MVP, the following 28 gestures are included:

#### Alphabet (26 letters)
A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z

#### Common Words (10+)
- Hello / Hi
- Thank you / Thanks
- Sorry / Apologize
- Yes
- No
- Please
- Help
- I love you
- Good morning
- Good night

### 5.2 Learning Path Structure

#### Path 1: ASL Basics (8 lessons)
1. Introduction to Fingerspelling
2. Letters A-E
3. Letters F-J
4. Letters K-O
5. Letters P-T
6. Letters U-Z
7. Numbers 1-10
8. Basic Words

#### Path 2: Everyday Communication (8 lessons)
1. Greetings
2. Family
3. Emotions
4. Common Questions
5. Daily Activities
6. Food and Drinks
7. Time and Dates
8. Places

#### Path 3: Advanced Conversations (8 lessons)
1. Describing People
2. Work and School
3. Hobbies and Interests
4. Weather
5. Health
6. Shopping
7. Travel
8. Storytelling

---

## 6. Development Context

### 6.1 Team Structure

| Role | Responsibilities | Count |
|------|------------------|-------|
| Product Manager | Roadmap, priorities, user research | 1 |
| UX Designer | Wireframes, prototypes, accessibility | 1 |
| UI Developer | React Native screens, components | 2 |
| Backend Developer | Firebase, API integration | 1 |
| ML Engineer | AI model, MediaPipe integration | 1 |
| QA Engineer | Testing, bug fixes, accessibility audit | 1 |

### 6.2 Development Methodology

- **Framework:** Agile with 2-week sprints
- **Version Control:** Git with feature branches
- **Code Review:** Required for all PRs
- **CI/CD:** GitHub Actions for automated testing
- **Testing:** Unit tests, integration tests, accessibility audits

### 6.3 Device Testing Matrix

| Device Tier | Examples | Target Performance |
|-------------|----------|-------------------|
| High-end | Pixel 8, Samsung S23 | 60 FPS, < 50ms AI latency |
| Mid-range | Samsung A54, Pixel 6a | 30+ FPS, < 100ms AI latency |
| Low-end | Samsung A14, Moto G | 20+ FPS, < 150ms AI latency |

---

## 7. Business Context

### 7.1 Revenue Model

| Model | Timeline | Description |
|-------|----------|-------------|
| Freemium | MVP | Core features free; premium in Phase 2 |
| Premium Features | Phase 2 | Advanced lessons, unlimited practice |
| B2B | Phase 3 | Enterprise licenses for businesses |

### 7.2 Monetization Strategy

- **Free Tier:** All MVP features available
- **Premium (Phase 2):** $4.99/month or $39.99/year
  - Unlimited AI practice sessions
  - Advanced learning paths
  - Offline content
  - No ads

### 7.3 Growth Strategy

1. **Community Building** - Partner with deaf organizations (NAD, ASLIA)
2. **Content Marketing** - YouTube tutorials, ASL tips
3. **Accessibility Advocacy** - Position as accessibility-first app
4. **Word of Mouth** - Satisfied users refer friends and family
5. **Educator Adoption** - Schools and ASL classes adopt the app

---

## 8. Legal and Compliance Context

### 8.1 Privacy and Security

| Requirement | Implementation |
|-------------|----------------|
| Data Collection | Minimal (account, progress only) |
| Camera Data | Never leaves device |
| COPPA | No data collection from children under 13 |
| GDPR | EU data handling compliance (Phase 2) |

### 8.2 Accessibility Compliance

- **WCAG 2.1 AA** - Target compliance for MVP
- **Americans with Disabilities Act (ADA)** - App must be accessible
- **Section 508** - Federal accessibility requirements (if B2B)

### 8.3 Content Rights

- All gesture videos are original content created by the team
- ASL demonstrations are performed by native ASL users
- No third-party content or copyrighted material

---

## 9. Dependencies

### 9.1 External Dependencies

| Dependency | Provider | Purpose |
|------------|----------|---------|
| Firebase | Google | Auth, Firestore, Storage |
| TensorFlow Lite | Google | On-device ML inference |
| MediaPipe | Google | Hand tracking |
| Expo | Expo | Mobile development framework |
| React Native | Meta | Cross-platform UI |

### 9.2 Internal Dependencies

| Component | Depends On |
|-----------|------------|
| Practice Room | Camera, MediaPipe, TFLite |
| Translation | Camera, MediaPipe, TFLite, TTS |
| Learning Path | Firebase, Firestore |
| User Progress | Firebase, Firestore |
| Dictionary | Firebase, Firestore |

---

## 10. Open Questions

The following questions remain open and require further research or stakeholder decisions:

| Question | Status | Decision Needed By |
|----------|--------|-------------------|
| Should we support regional ASL variations (e.g., Black ASL)? | Open | Phase 2 |
| How to handle model updates without app store approval? | Open | MVP |
| What analytics data can we collect while respecting privacy? | Open | MVP |
| Should we integrate with hearing aids or cochlear implants? | Open | Future |
| How to handle gestures that look similar but have different meanings? | Open | ML team |
| What is the minimum viable accuracy for launch? | Open | Product |

---

## 11. Success Criteria Summary

### 11.1 Product Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Acquisition | 10,000 MAU by month 6 | Firebase Analytics |
| User Engagement | 5+ min avg session | Analytics |
| Task Completion | 80%+ lesson completion | In-app tracking |
| User Satisfaction | 4.0+ app store rating | App Store |

### 11.2 Technical Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI Accuracy | ≥ 90% | Internal testing |
| Translation Latency | < 100ms | Frame profiling |
| App Crash Rate | < 1% | Crashlytics |
| Accessibility Score | WCAG AA | Audit |

### 11.3 Community Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Deaf Community Adoption | Positive reception | Community feedback |
| Educator Adoption | 50+ schools | Sales tracking |
| Accessibility Recognition | Featured in accessibility lists | PR/marketing |

---

*Project context established and approved.*
*Version: 1.0*
*Date: 2026-09-08*
