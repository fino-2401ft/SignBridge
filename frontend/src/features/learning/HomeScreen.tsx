import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LearningPathCard } from "../../components/learning/LearningPathCard";
import { ProgressCard } from "../../components/learning/ProgressCard";
import { QuickActions } from "../../components/learning/QuickActions";
import { AuthBanner } from "../../components/ui/AuthBanner";
import { MainTabBar } from "../../components/ui/MainTabBar";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLearningNavStore } from "../../stores/useLearningNavStore";
import { useLearningStore } from "../../stores/useLearningStore";
import type { LearningPathViewModel } from "../../types/learning";
import type { MainTab } from "../../utils/constants";
import { colors, radii, touchMin } from "../../utils/theme";

export function HomeScreen(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);

  const loadState = useLearningStore((s) => s.loadState);
  const errorMessage = useLearningStore((s) => s.errorMessage);
  const paths = useLearningStore((s) => s.paths);
  const progressByPathId = useLearningStore((s) => s.progressByPathId);
  const loadCatalog = useLearningStore((s) => s.loadCatalog);
  const getPathViewModels = useLearningStore((s) => s.getPathViewModels);
  const getAggregateStats = useLearningStore((s) => s.getAggregateStats);
  const openPath = useLearningNavStore((s) => s.openPath);

  const [activeTab, setActiveTab] = useState<MainTab>("Learn");
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string): void => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const totalXp = user?.totalXp ?? 0;

  const pathItems = useMemo(
    () => getPathViewModels(totalXp),
    [getPathViewModels, totalXp, paths, progressByPathId],
  );

  const stats = useMemo(
    () => getAggregateStats(),
    [getAggregateStats, paths, progressByPathId],
  );

  const firstName = useMemo(() => {
    if (!user?.displayName) {
      return "there";
    }
    return user.displayName.split(" ")[0] ?? user.displayName;
  }, [user?.displayName]);

  const avatarLetter = (user?.displayName ?? "U").charAt(0).toUpperCase();

  const onPathPress = (item: LearningPathViewModel): void => {
    if (item.locked) {
      showToast(item.unlockHint || "Complete available paths to unlock more");
      return;
    }
    openPath(item.path.id);
  };

  const onTabChange = (tab: MainTab): void => {
    setActiveTab(tab);
    if (tab === "Profile") {
      setProfileOpen(true);
      return;
    }
    if (tab !== "Learn") {
      showToast(`${tab} — coming in next milestone`);
    }
  };

  const closeProfile = (): void => {
    setProfileOpen(false);
    setActiveTab("Learn");
  };

  const onLogout = async (): Promise<void> => {
    setLogoutError(null);
    try {
      await logout();
      setProfileOpen(false);
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : "Could not log out.");
    }
  };

  if (!user) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {toast ? (
        <View style={styles.toast} accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.hi}>Hi, {firstName}</Text>
            <Text style={styles.sub}>Continue your ASL journey</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => {
              setActiveTab("Profile");
              setProfileOpen(true);
            }}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </Pressable>
        </View>

        <ProgressCard
          user={user}
          completedLessons={stats.completedLessons}
          totalLessons={stats.totalLessons}
          completedPaths={stats.completedPaths}
          totalPaths={stats.totalPaths}
          overallPercent={stats.overallPercent}
        />

        <View style={styles.sectionGap}>
          <QuickActions
            onSelect={(tab) => {
              setActiveTab(tab);
              showToast(`${tab} — coming in next milestone`);
            }}
          />
        </View>

        <Text style={styles.sectionTitle}>Learning paths</Text>

        {loadState === "loading" || loadState === "idle" ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading learning paths…</Text>
          </View>
        ) : null}

        {loadState === "empty" ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>📭</Text>
            <Text style={styles.stateTitle}>Learning paths coming soon!</Text>
            <Text style={styles.stateText}>
              No learning paths available yet. Check back after content is published.
            </Text>
          </View>
        ) : null}

        {loadState === "error" ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateTitle}>Unable to load learning paths</Text>
            <Text style={styles.stateText}>
              {errorMessage ?? "Connection timed out. Check your network and try again."}
            </Text>
            <View style={styles.retryWrap}>
              <PrimaryButton label="Retry" onPress={() => void loadCatalog()} />
            </View>
          </View>
        ) : null}

        {loadState === "ready"
          ? pathItems.map((item) => (
              <View key={item.path.id} style={styles.pathWrap}>
                <LearningPathCard item={item} onPress={onPathPress} />
              </View>
            ))
          : null}
      </ScrollView>

      <MainTabBar activeTab={activeTab} onChange={onTabChange} />

      <Modal
        visible={profileOpen}
        transparent
        animationType="slide"
        onRequestClose={closeProfile}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeProfile}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetName}>{user.displayName}</Text>
            <Text style={styles.sheetEmail}>{user.email}</Text>
            <AuthBanner message={logoutError} tone="error" />
            <PrimaryButton
              label="Log out"
              onPress={() => void onLogout()}
              loading={isSubmitting}
            />
            <Pressable
              accessibilityRole="button"
              onPress={closeProfile}
              style={styles.sheetCancel}
            >
              <Text style={styles.sheetCancelText}>Close</Text>
            </Pressable>
          </Pressable>
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
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
  },
  hi: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
  },
  sub: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  sectionGap: {
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  pathWrap: {
    marginBottom: 12,
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
    gap: 8,
  },
  stateEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryWrap: {
    marginTop: 8,
    width: "100%",
    maxWidth: 220,
  },
  toast: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    zIndex: 20,
    backgroundColor: "#2C3E50",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 80, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sheetName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sheetEmail: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sheetCancel: {
    marginTop: 12,
    minHeight: touchMin,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
