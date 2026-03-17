import { useState, useCallback } from "react";
import { Text, View, TextInput, Pressable, ActivityIndicator, FlatList, RefreshControl, StyleSheet, ScrollView } from "react-native";
import { CinematicScreen, GoldenCard, useParallax } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { TooltipBubble } from "@/components/tooltip-bubble";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";
import { useTransition } from "@/lib/transition-context";

const TYPE_META: Record<string, { icon: string; color: string }> = {
  text: { icon: "edit-note", color: "#FFD700" },
  image: { icon: "image", color: "#FFA500" },
  voice: { icon: "mic", color: "#FF6B6B" },
  document: { icon: "description", color: "#4FC3F7" },
  link: { icon: "link", color: "#81C784" },
};

const FILTERS = [
  { key: "all", label: "All", icon: null },
  { key: "favorites", label: "Favorites", icon: "star" },
  { key: "text", label: "Notes", icon: null },
  { key: "image", label: "Images", icon: null },
  { key: "voice", label: "Voice", icon: null },
  { key: "document", label: "Docs", icon: null },
  { key: "link", label: "Links", icon: null },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest, favorites, tags, memoryTags, getMemoriesByTag } = useAppState();
  const { triggerTransition } = useTransition();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const parallax = useParallax();
  const isLoggedIn = isAuthenticated || isGuest;

  const memoriesQuery = trpc.memories.list.useQuery(
    { type: activeFilter !== "all" && activeFilter !== "favorites" ? activeFilter : undefined, search: search.trim() || undefined, limit: 50 },
    { enabled: isAuthenticated }
  );

  const onRefresh = useCallback(async () => { setRefreshing(true); await memoriesQuery.refetch(); setRefreshing(false); }, [memoriesQuery]);

  if (!isLoggedIn) {
    return (
      <CinematicScreen screenName="library">
        <View style={styles.centerFull}>
          <MaterialIcons name="library-books" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.loginText}>Sign in to view your library</Text>
        </View>
      </CinematicScreen>
    );
  }

  let memories = memoriesQuery.data || [];
  if (activeFilter === "favorites") memories = memories.filter((m) => favorites.includes(m.id));
  if (activeTagId) { const tagMemIds = getMemoriesByTag(activeTagId); memories = memories.filter((m) => tagMemIds.includes(m.id)); }

  const renderItem = useCallback(({ item }: { item: any }) => {
    const typeInfo = TYPE_META[item.type] || TYPE_META.text;
    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const fav = favorites.includes(item.id);
    const itemTagIds = memoryTags[item.id] || [];
    const itemTags = tags.filter((t) => itemTagIds.includes(t.id));

    return (
      <Pressable
        onPress={() => router.push(`/memory/${item.id}` as any)}
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      >
        <GoldenCard style={fav ? { borderColor: "rgba(255,215,0,0.3)" } : undefined}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <LinearGradient colors={[`${typeInfo.color}20`, `${typeInfo.color}10`]} style={styles.typeIcon}>
              <MaterialIcons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardMeta}>
                  {fav && <MaterialIcons name="star" size={12} color="#FFD700" />}
                  <Text style={styles.cardDate}>{dateStr}</Text>
                </View>
              </View>
              <Text style={styles.cardSummary} numberOfLines={2}>{item.aiSummary || item.content || "Processing..."}</Text>
              <View style={styles.tagRow}>
                {item.aiTopics?.slice(0, 2).map((topic: string) => (
                  <View key={topic} style={styles.aiTag}>
                    <Text style={styles.aiTagText}>{topic}</Text>
                  </View>
                ))}
                {itemTags.slice(0, 2).map((tag) => (
                  <View key={tag.id} style={[styles.aiTag, { backgroundColor: `${tag.color}15` }]}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.aiTagText, { color: tag.color }]}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
            {!item.processed && <ActivityIndicator size="small" color="#FFD700" />}
          </View>
        </GoldenCard>
      </Pressable>
    );
  }, [router, favorites, memoryTags, tags]);

  return (
    <CinematicScreen screenName="library">
      {/* Header */}
      <View style={styles.headerRow}>
        <GoldenText variant="title" style={{ textAlign: "left" }}>Library</GoldenText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => { triggerTransition("sparkle"); router.push("/tags" as any); }} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
            <MaterialIcons name="label" size={18} color="#FFD700" />
          </Pressable>
          <Pressable onPress={() => { triggerTransition("sparkle"); router.push("/folders" as any); }} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
            <MaterialIcons name="folder" size={18} color="#FFD700" />
          </Pressable>
        </View>
      </View>

      <TooltipBubble tipId="library_search" text="Search memories by title, content, or AI-extracted topics. Filter by type, tags, or favorites." position="bottom" arrowSide="center" />

      {/* Search Bar */}
      <View style={{ marginHorizontal: 20, marginTop: 4 }}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.3)" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search your memories..." placeholderTextColor="rgba(255,255,255,0.25)" style={styles.searchInput} returnKeyType="search" />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.3)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.key && !activeTagId;
            return (
              <Pressable key={f.key} onPress={() => { setActiveFilter(f.key); setActiveTagId(null); }} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
                <LinearGradient
                  colors={active ? ["#FFD700", "#FFA500"] : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
                  style={[styles.filterChip, { borderColor: active ? "#FFD700" : "rgba(255,255,255,0.1)" }]}
                >
                  {f.icon && <MaterialIcons name={f.icon as any} size={12} color={active ? "#0A0E1A" : "#FFD700"} />}
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#0A0E1A" : "rgba(255,255,255,0.5)" }}>{f.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Tag Filters */}
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={styles.filterRow}>
            {tags.map((tag) => {
              const active = activeTagId === tag.id;
              return (
                <Pressable key={tag.id} onPress={() => { setActiveTagId(active ? null : tag.id); setActiveFilter("all"); }} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
                  <View style={[styles.filterChip, { borderColor: active ? tag.color : "rgba(255,255,255,0.1)", backgroundColor: active ? `${tag.color}20` : "rgba(255,255,255,0.03)" }]}>
                    <View style={[styles.tagDot, { backgroundColor: active ? tag.color : `${tag.color}80` }]} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: active ? tag.color : "rgba(255,255,255,0.5)" }}>{tag.name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Memory List */}
      {memoriesQuery.isLoading ? (
        <View style={styles.centerFull}><ActivityIndicator size="large" color="#FFD700" /></View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name={activeFilter === "favorites" ? "star-outline" : activeTagId ? "label-off" : "search-off"} size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>
                {activeFilter === "favorites" ? "No favorites yet" : activeTagId ? "No memories with this tag" : search ? "No results found" : "No memories yet"}
              </Text>
              <Text style={styles.emptySub}>
                {activeFilter === "favorites" ? "Star memories to find them quickly" : activeTagId ? "Tag some memories to see them here" : search ? "Try different keywords" : "Start capturing notes, images, and links"}
              </Text>
            </View>
          }
        />
      )}
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  loginText: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(15,20,40,0.88)", borderWidth: 1, borderColor: "rgba(255,215,0,0.25)", alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#FFFFFF" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 4 },
  typeIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "600", flex: 1, marginRight: 8, color: "#FFFFFF" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  cardSummary: { fontSize: 13, marginTop: 3, lineHeight: 18, color: "rgba(255,255,255,0.75)" },
  tagRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  aiTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "rgba(255,215,0,0.1)", gap: 4 },
  aiTagText: { fontSize: 11, color: "#FFD700" },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  emptySub: { fontSize: 14, textAlign: "center", color: "rgba(255,255,255,0.7)" },
});
