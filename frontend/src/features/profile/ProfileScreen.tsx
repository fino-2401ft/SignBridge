import type { JSX } from "react";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LeaderboardView } from "../../components/gamification/LeaderboardView";
import { AchievementBadgesGrid } from "../../components/profile/AchievementBadgesGrid";
import { UserStatsOverview } from "../../components/profile/UserStatsOverview";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { FlashCardReviewScreen } from "../gamification/FlashCardReviewScreen";
import { useAppNavStore } from "../../stores/useAppNavStore";
import { useAuthStore } from "../../stores/useAuthStore";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";

type ProfileTab = "overview" | "leaderboard" | "badges";

export function ProfileScreen(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setTab = useAppNavStore((s) => s.setTab);

  const [activeSubTab, setActiveSubTab] = useState<ProfileTab>("overview");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const avatarLetter = (user?.displayName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const handleLogout = async (): Promise<void> => {
    setLogoutModalOpen(false);
    await logout();
  };

  return (
    <View style={styles.root}>
      {/* Header Profile Info */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.name}>{user?.displayName || "ASL Learner"}</Text>
          <Text style={styles.email}>{user?.email || "student@signbridge.app"}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || "STUDENT"}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setLogoutModalOpen(true)}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutIcon}>⎋</Text>
        </Pressable>
      </View>

      {/* Segmented Sub Tabs */}
      <View style={styles.subTabs}>
        <Pressable
          onPress={() => setActiveSubTab("overview")}
          style={[styles.subTabBtn, activeSubTab === "overview" && styles.subTabActive]}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "overview" && styles.subTabTextActive,
            ]}
          >
            Stats & Habits
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveSubTab("leaderboard")}
          style={[styles.subTabBtn, activeSubTab === "leaderboard" && styles.subTabActive]}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "leaderboard" && styles.subTabTextActive,
            ]}
          >
            Leaderboard
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveSubTab("badges")}
          style={[styles.subTabBtn, activeSubTab === "badges" && styles.subTabActive]}
        >
          <Text
            style={[
              styles.subTabText,
              activeSubTab === "badges" && styles.subTabTextActive,
            ]}
          >
            Badges
          </Text>
        </Pressable>
      </View>

      {/* Body Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === "overview" && (
          <View style={styles.sectionWrap}>
            {user ? <UserStatsOverview user={user} /> : null}

            {/* Spaced Review CTA Card */}
            <View style={styles.ctaCard}>
              <View style={styles.ctaInfo}>
                <Text style={styles.ctaTitle}>Daily Spaced Review</Text>
                <Text style={styles.ctaSub}>
                  Reinforce your sign memory with SM-2 flashcard intervals.
                </Text>
              </View>
              <Pressable
                onPress={() => setReviewOpen(true)}
                style={({ pressed }) => [
                  styles.startReviewBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.startReviewText}>Start Review</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeSubTab === "leaderboard" && (
          <View style={styles.sectionWrap}>
            <LeaderboardView />
          </View>
        )}

        {activeSubTab === "badges" && (
          <View style={styles.sectionWrap}>
            <AchievementBadgesGrid />
          </View>
        )}
      </ScrollView>

      {/* Main Tab Navigation */}
      <MainTabBar
        activeTab="Profile"
        onChange={(tab: MainTab) => setTab(tab)}
      />

      {/* Spaced Review Full Modal */}
      <Modal visible={reviewOpen} animationType="slide">
        <FlashCardReviewScreen onBack={() => setReviewOpen(false)} />
      </Modal>

      {/* Logout Confirmation Sheet */}
      <Modal
        visible={logoutModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLogoutModalOpen(false)}
        >
          <View style={styles.logoutSheet}>
            <Text style={styles.sheetTitle}>Log Out of SignBridge?</Text>
            <Text style={styles.sheetSub}>
              You will need to sign in again to sync your lesson progress and streak.
            </Text>
            <PrimaryButton
              label="Log Out"
              onPress={() => void handleLogout()}
            />
            <Pressable
              onPress={() => setLogoutModalOpen(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  email: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  roleTag: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  subTabs: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: radii.md - 4,
  },
  subTabActive: {
    backgroundColor: colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  sectionWrap: {
    gap: 14,
    paddingTop: 6,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: 16,
    gap: 12,
  },
  ctaInfo: {
    gap: 4,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  ctaSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  startReviewBtn: {
    backgroundColor: colors.primary,
    minHeight: touchMin,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.88,
  },
  startReviewText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  logoutSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  sheetSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 4,
  },
  cancelBtn: {
    minHeight: touchMin,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
