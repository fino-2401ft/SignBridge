# SIGNBRIDGE — AI-Driven Mobile App for Real-Time Sign Language Recognition

> **Mission:** Bridging the communication gap between the deaf/hard-of-hearing community and hearing individuals through real-time American Sign Language (ASL) recognition and accessible learning.

---

## Monorepo layout

```text
SignBridge/
├── frontend/          # Expo React Native (Android-first)
├── backend/           # Firebase (Auth, Firestore, Storage, Functions)
├── docs/              # Spec-driven product & architecture docs
├── 6-ui-design/       # HTML UI prototypes
└── AGENTS.md          # AI coding rules & directory conventions
```

| Layer | Standard Technology |
| :--- | :--- |
| **Mobile Runtime** | React Native (Expo / Native Android API 26+) |
| **Language** | TypeScript (Strict mode, zero `any`) |
| **Edge AI & Vision** | MediaPipe Hands + TensorFlow Lite (on-device) |
| **State Management** | Zustand |
| **Backend & Cloud** | Firebase (Authentication, Cloud Firestore, Cloud Storage) |

---

## Frontend (Android)

```bash
cd frontend
cp .env.example .env   # fill EXPO_PUBLIC_FIREBASE_* from Firebase Console
npm install
npm start              # Expo Dev Tools
npm run android        # open on Android emulator / device
npm run typecheck      # tsc --noEmit
```

Source layout follows `AGENTS.md`:

```text
frontend/src/
├── app/           # navigation / screen shell
├── components/    # reusable UI
├── features/      # feature modules
├── ml/            # on-device AI pipeline
├── stores/        # Zustand stores
├── services/      # Firebase & hardware facades
├── types/         # Zod schemas & DTOs
└── utils/         # env, constants, helpers
```

---

## Backend (Firebase)

```bash
cd backend
cp .firebaserc.example .firebaserc   # set your Firebase project id
cd functions && npm install && npm run build
# from backend/
firebase login
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

Seed demo curriculum (dry-run by default):

```bash
cd backend
npx ts-node scripts/seed-demo-data.ts
```

See [backend/README.md](backend/README.md) for details.

---

## Documentation

| Document | Description |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | AI agent rules & coding principles |
| [docs/PRD.md](docs/PRD.md) | Product requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture & Firestore schema |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased implementation prompts |

UI prototypes live under [`6-ui-design/`](6-ui-design/).
