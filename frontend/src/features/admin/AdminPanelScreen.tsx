import type { JSX } from "react";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DEMO_SIGNS } from "../../types/dictionary";
import { colors, radii, touchMin } from "../../utils/theme";

export function AdminPanelScreen(): JSX.Element {
  const [signs, setSigns] = useState(DEMO_SIGNS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...new Set(signs.map((s) => s.category))];

  const filteredSigns = signs.filter((s) => {
    const matchCat =
      selectedCategory === "All" || s.category === selectedCategory;
    const matchQuery =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <View style={styles.root}>
      {/* Admin Header */}
      <View style={styles.header}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
        </View>
        <Text style={styles.title}>Gesture Catalog & Dataset</Text>
        <Text style={styles.sub}>
          Inspect published WLASL gestures, categories, and video URLs
        </Text>
      </View>

      {/* Dataset Statistics */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{signs.length}</Text>
          <Text style={styles.statLbl}>Total Signs</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{categories.length - 1}</Text>
          <Text style={styles.statLbl}>Categories</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>
            {signs.filter((s) => Boolean(s.videoUrl)).length}
          </Text>
          <Text style={styles.statLbl}>Videos Synced</Text>
        </View>
      </View>

      {/* Search & Category Filter */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter signs by keyword…"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.catChip,
              selectedCategory === cat && styles.catChipActive,
            ]}
          >
            <Text
              style={[
                styles.catText,
                selectedCategory === cat && styles.catTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Signs Table */}
      <FlatList
        data={filteredSigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.category} • {item.difficulty}</Text>
            </View>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.videoUrl ? colors.success : colors.warning },
              ]}
            />
          </View>
        )}
      />
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
    marginBottom: 14,
  },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  adminBadgeText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
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
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    fontSize: 14,
    color: colors.text,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  catTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  list: {
    paddingBottom: 24,
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
