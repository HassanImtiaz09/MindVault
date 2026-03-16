import { useState, useCallback } from "react";
import { Text, View, TextInput, Pressable, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  text: { icon: "text.alignleft", color: "#6C5CE7" },
  image: { icon: "photo.fill", color: "#00D2D3" },
  voice: { icon: "mic.fill", color: "#FF6B6B" },
  document: { icon: "doc.fill", color: "#FDCB6E" },
  link: { icon: "globe", color: "#00B894" },
};

const FILTERS = [
  { key: "all", label: "All" },
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
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const memoriesQuery = trpc.memories.list.useQuery(
    {
      type: activeFilter !== "all" ? activeFilter : undefined,
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

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="book.fill" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to view your library</Text>
      </ScreenContainer>
    );
  }

  const memories = memoriesQuery.data || [];

  const renderItem = useCallback(({ item }: { item: any }) => {
    const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.text;
    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return (
      <Pressable
        onPress={() => router.push(`/memory/${item.id}` as any)}
        style={({ pressed }) => [
          styles.memoryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + "20" }]}>
          <IconSymbol name={typeInfo.icon} size={20} color={typeInfo.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardDate, { color: colors.muted }]}>{dateStr}</Text>
          </View>
          <Text style={[styles.cardSummary, { color: colors.muted }]} numberOfLines={2}>
            {item.aiSummary || item.content || "Processing..."}
          </Text>
          {item.aiTopics && item.aiTopics.length > 0 && (
            <View style={styles.tagRow}>
              {item.aiTopics.slice(0, 3).map((topic: string) => (
                <View key={topic} style={[styles.tag, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ fontSize: 11, color: colors.primary }}>{topic}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {!item.processed && <ActivityIndicator size="small" color={colors.primary} />}
      </Pressable>
    );
  }, [colors, router]);

  return (
    <ScreenContainer>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Library</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { marginHorizontal: 20 }]}>
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

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.key ? colors.primary : colors.surface,
                borderColor: activeFilter === f.key ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: activeFilter === f.key ? "#fff" : colors.muted,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="magnifyingglass" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No results found" : "No memories yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {search
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
  searchContainer: { marginTop: 8 },
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
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
  cardDate: { fontSize: 12 },
  cardSummary: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});
