import type { JSX } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../../utils/theme";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "streak" | "review" | "achievement";
  read: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Keep your 7-day streak alive!",
    message: "You haven't practiced your ASL signs today. Complete 1 lesson before midnight.",
    time: "2 hours ago",
    type: "streak",
    read: false,
  },
  {
    id: "n-2",
    title: "Spaced Review Ready",
    message: "4 vocabulary signs are ready for SM-2 interval review.",
    time: "Today, 09:00 AM",
    type: "review",
    read: true,
  },
  {
    id: "n-3",
    title: "Achievement Unlocked: Week Warrior",
    message: "You earned the Silver Week Warrior trophy for 7 consecutive days of practice!",
    time: "Yesterday",
    type: "achievement",
    read: true,
  },
];

export function NotificationsScreen(): JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.sub}>Daily reminders & streak alerts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {NOTIFICATIONS.map((item) => {
          const icon =
            item.type === "streak"
              ? "🔥"
              : item.type === "review"
                ? "📖"
                : "🏆";

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                !item.read && styles.cardUnread,
              ]}
            >
              <Text style={styles.icon}>{icon}</Text>
              <View style={styles.meta}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  header: {
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  icon: {
    fontSize: 24,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cardTime: {
    fontSize: 11,
    color: colors.placeholder,
    marginTop: 2,
  },
});
