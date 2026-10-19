import * as admin from "firebase-admin";
import { auth } from "firebase-functions/v1";

admin.initializeApp();

/**
 * Bootstrap a Firestore user profile when a Firebase Auth account is created.
 * Stub for ROADMAP Phase 2 — extend with role claims / welcome XP as needed.
 */
export const onUserCreate = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email ?? "";
  const displayName = user.displayName ?? (email ? email.split("@")[0] : "Learner");

  await admin.firestore().collection("users").doc(uid).set(
    {
      uid,
      email,
      displayName,
      role: "learner",
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});
