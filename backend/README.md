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

## Seed demo data

```bash
npx ts-node scripts/seed-demo-data.ts          # dry-run
npx ts-node scripts/seed-demo-data.ts --write  # requires Admin credentials
```
