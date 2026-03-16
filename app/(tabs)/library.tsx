import { useState, useCallback } from "react";
import { Text, View, TextInput, Pressable, ActivityIndicator, FlatList, RefreshControl, StyleSheet, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  text: { icon: "text.alignleft", color: "#00C9A7" },
  image: { icon: "photo.fill", color: "#D4A017" },
  voice: { icon: "mic.fill", color: "#E74C3C" },
  document: { icon: "doc.fill", color: "#3498DB" },
  link: { icon: "globe", color: "#1ABC9C" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "favorites", label: "Favorites", icon: "star.fill" as const },
  { key: "text", label: "Notes" },
  { key: "image", label: "Images" },
  { key: "voice", label: "Voice" },
  { key: "document", label: "Docs" },
  { key: "link", label: "Links" },
];

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest, favorites, tags, memoryTags, getMemoriesByTag } = useAppState();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = isAuthenticated || isGuest;

  const memoriesQuery = trpc.memories.list.useQuery(
    {
      type: activeFilter !== "all" && activeFilter !== "favorites" ? activeFilter : undefined,
      search: search.trim() || undefined,
      limit: 50,
    },
    { enabled: isAuthenticated }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await memoriesQuery.refetch();
    setRefreshing(false);
  }, [memoriesQuery]);

  if (!isLoggedIn) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="book.fill" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to view your library</Text>
      </ScreenContainer>
    );
  }

  let memories = memoriesQuery.data || [];
  if (activeFilter === "favorites") {
    memories = memories.filter((m) => favorites.includes(m.id));
  }
  // Tag filter
  if (activeTagId) {
    const tagMemIds = getMemoriesByTag(activeTagId);
    memories = memories.filter((m) => tagMemIds.includes(m.id));
  }

  const renderItem = useCallback(({ item }: { item: any }) => {
    const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.text;
    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const fav = favorites.includes(item.id);
    const itemTagIds = memoryTags[item.id] || [];
    const itemTags = tags.filter((t) => itemTagIds.includes(t.id));

    return (
      <Pressable
        onPress={() => router.push(`/memory/${item.id}` as any)}
        style={({ pressed }) => [
          styles.memoryCard,
          { backgroundColor: colors.surface, borderColor: fav ? colors.accent + "40" : colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + "15" }]}>
          <IconSymbol name={typeInfo.icon} size={20} color={typeInfo.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              {fav && <IconSymbol name="star.fill" size={12} color={colors.accent} />}
              <Text style={[styles.cardDate, { color: colors.muted }]}>{dateStr}</Text>
            </View>
          </View>
          <Text style={[styles.cardSummary, { color: colors.muted }]} numberOfLines={2}>
            {item.aiSummary || item.content || "Processing..."}
          </Text>
          <View style={styles.tagRow}>
            {item.aiTopics && item.aiTopics.slice(0, 2).map((topic: string) => (
              <View key={topic} style={[styles.tag, { backgroundColor: colors.primary + "12" }]}>
                <Text style={{ fontSize: 11, color: colors.primary }}>{topic}</Text>
              </View>
            ))}
            {itemTags.slice(0, 2).map((tag) => (
              <View key={tag.id} style={[styles.tag, { backgroundColor: tag.color + "15" }]}>
                <View style={[styles.tagDotSmall, { backgroundColor: tag.color }]} />
                <Text style={{ fontSize: 11, color: tag.color }}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
        {!item.processed && <ActivityIndicator size="small" color={colors.primary} />}
      </Pressable>
    );
  }, [colors, router, favorites, memoryTags, tags]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/tags" as any)}
            style={({ pressed }) => [styles.headerBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="tag.fill" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/folders" as any)}
            style={({ pressed }) => [styles.headerBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="folder.fill" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <TutorialTip
        tipKey="library_search"
        icon="magnifyingglass"
        iconColor={colors.primary}
        title="Search Your Knowledge"
        message="Use the search bar to find memories by title, content, or AI-extracted topics. Filter by type, tags, or view your favorites."
      />

      {/* Search Bar */}
      <View style={{ marginHorizontal: 20, marginTop: 4 }}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your memories..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => { setActiveFilter(f.key); setActiveTagId(null); }}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.key && !activeTagId ? colors.primary : colors.surface,
                borderColor: activeFilter === f.key && !activeTagId ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            {"icon" in f && f.icon && (
              <IconSymbol name={f.icon} size={12} color={activeFilter === f.key && !activeTagId ? "#fff" : colors.accent} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: activeFilter === f.key && !activeTagId ? "#fff" : colors.muted,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tag Filter Chips */}
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={styles.tagFilterRow}>
            {tags.map((tag) => (
              <Pressable
                key={tag.id}
                onPress={() => {
                  setActiveTagId(activeTagId === tag.id ? null : tag.id);
                  setActiveFilter("all");
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: activeTagId === tag.id ? tag.color : colors.surface,
                    borderColor: activeTagId === tag.id ? tag.color : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.tagDotSmall, { backgroundColor: activeTagId === tag.id ? "#fff" : tag.color }]} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: activeTagId === tag.id ? "#fff" : tag.color,
                  }}
                >
                  {tag.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Memory List */}
      {memoriesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol
                name={activeFilter === "favorites" ? "star" : activeTagId ? "tag.fill" : "magnifyingglass"}
                size={40}
                color={colors.muted}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeFilter === "favorites" ? "No favorites yet" : activeTagId ? "No memories with this tag" : search ? "No results found" : "No memories yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {activeFilter === "favorites"
                  ? "Star memories to find them quickly here"
                  : activeTagId
                  ? "Tag some memories to see them here"
                  : search
                  ? "Try different keywords or filters"
                  : "Start capturing notes, images, and links"}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  tagFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  memoryCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { fontSize: 12 },
  cardSummary: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  tagDotSmall: { width: 6, height: 6, borderRadius: 3 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});
