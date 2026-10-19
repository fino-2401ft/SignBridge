import { z } from "zod";

export const UserRoleSchema = z.enum(["learner", "admin"]);

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRoleSchema.default("learner"),
  totalXp: z.number().int().nonnegative().default(0),
  currentLevel: z.number().int().positive().default(1),
  currentStreak: z.number().int().nonnegative().default(0),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export function parseUserProfile(payload: unknown): UserProfile {
  return UserProfileSchema.parse(payload);
}
