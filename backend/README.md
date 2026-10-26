# SignBridge Backend (Firebase)

Firebase BaaS for Auth, Cloud Firestore, Cloud Storage, and Cloud Functions.

## Layout

```text
backend/
├── firebase.json
├── .firebaserc.example
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── functions/          # TypeScript Cloud Functions
└── scripts/            # Seed / maintenance scripts
```

## Setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. `firebase login`
3. Copy `.firebaserc.example` → `.firebaserc` and set your project id
4. `cd functions && npm install && npm run build`
5. Deploy rules: `firebase deploy --only firestore:rules,storage`
6. Deploy functions: `firebase deploy --only functions`

## Learning Home + Lesson backend (FR-004 / FR-006 / FR-007 / FR-008)

| Piece | Purpose |
| :--- | :--- |
| `learning_paths` | Published curriculum ordered by `order` |
| `lessons` | Path lessons (video metadata, XP, gestures) |
| `users/{uid}/path_progress/{pathId}` | Per-path completion % for Home |
| `user_progress/{uid_lessonId}` | Per-lesson completion record |
| Callable `getHomeLearningCatalog` | Auth-gated catalog + progress |
| Callable `getLessonsForPath` | Lessons for Path Detail screen |
| Callable `completeLesson` | Award XP + sync path/lesson progress |
| Callable `syncPathProgress` | Client fallback path progress upsert |

### Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes,functions
```

### Seed demo data

```bash
npx tsx scripts/seed-demo-data.ts
npx tsx scripts/seed-demo-data.ts --write
npx tsx scripts/seed-demo-data.ts --write --uid=<FIREBASE_UID>
```

`--uid` also seeds demo `path_progress` so Home/Lesson show real completion state.
