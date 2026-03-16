import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { StyleSheet } from "react-native";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  text: { icon: "text.alignleft", color: "#6C5CE7" },
  image: { icon: "photo.fill", color: "#00D2D3" },
  voice: { icon: "mic.fill", color: "#FF6B6B" },
  document: { icon: "doc.fill", color: "#FDCB6E" },
  link: { icon: "globe", color: "#00B894" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const recentQuery = trpc.memories.recent.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );
  const statsQuery = trpc.memories.stats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([recentQuery.refetch(), statsQuery.refetch()]);
    setRefreshing(false);
  }, [recentQuery, statsQuery]);

  if (authLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <View className="items-center gap-4">
          <IconSymbol name="brain" size={64} color={colors.primary} />
          <Text className="text-3xl font-bold text-foreground">MindVault</Text>
          <Text className="text-base text-muted text-center">
            Your AI-powered second brain. Sign in to start capturing and organizing your knowledge.
          </Text>
          <Pressable
            onPress={() => {
              const { startOAuthLogin } = require("@/lib/_core/auth");
              startOAuthLogin();
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.primaryBtnText}>Sign In to Get Started</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const stats = statsQuery.data;
  const recentMemories = recentQuery.data || [];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View className="px-5 pt-4 pb-2">
          <Text className="text-sm text-muted">{getGreeting()}</Text>
          <Text className="text-2xl font-bold text-foreground mt-1">
            {user?.name || "Knowledge Explorer"}
          </Text>
        </View>

        {/* Quick Capture */}
        <Pressable
          onPress={() => router.push("/(tabs)/capture")}
          style={({ pressed }) => [
            styles.quickCapture,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.8 },
          ]}
        >
          <IconSymbol name="plus.circle.fill" size={22} color={colors.primary} />
          <Text style={[styles.quickCaptureText, { color: colors.muted }]}>
            Capture a thought, link, or file...
          </Text>
        </Pressable>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats?.total ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Memories</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: "#00D2D3" }]}>
              {stats?.topTopics?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Topics</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: "#00B894" }]}>
              {Object.keys(stats?.byType ?? {}).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Types</Text>
          </View>
        </View>

        {/* Top Topics */}
        {stats?.topTopics && stats.topTopics.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Trending Topics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.topicRow}>
                {stats.topTopics.slice(0, 8).map((t) => (
                  <View
                    key={t.topic}
                    style={[styles.topicChip, { backgroundColor: colors.primary + "18" }]}
                  >
                    <Text style={[styles.topicChipText, { color: colors.primary }]}>
                      {t.topic} ({t.count})
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recent Memories */}
        <View className="px-5 mt-6">
          <View style={styles.sectionHeader}>
            <Text className="text-lg font-semibold text-foreground">Recent Memories</Text>
            <Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>See All</Text>
            </Pressable>
          </View>

          {recentQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : recentMemories.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="sparkles" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Tap "Capture" to save your first thought, note, or file.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {recentMemories.map((memory) => {
                const typeInfo = TYPE_ICONS[memory.type] || TYPE_ICONS.text;
                return (
                  <Pressable
                    key={memory.id}
                    onPress={() => router.push(`/memory/${memory.id}` as any)}
                    style={({ pressed }) => [
                      styles.memoryCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={[styles.memoryIcon, { backgroundColor: typeInfo.color + "20" }]}>
                      <IconSymbol name={typeInfo.icon} size={18} color={typeInfo.color} />
                    </View>
                    <View style={styles.memoryContent}>
                      <Text style={[styles.memoryTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {memory.title}
                      </Text>
                      <Text style={[styles.memorySummary, { color: colors.muted }]} numberOfLines={2}>
                        {memory.aiSummary || memory.content || "Processing..."}
                      </Text>
                      {memory.aiTopics && memory.aiTopics.length > 0 && (
                        <View style={styles.memoryTags}>
                          {memory.aiTopics.slice(0, 3).map((topic) => (
                            <View key={topic} style={[styles.miniTag, { backgroundColor: colors.primary + "15" }]}>
                              <Text style={{ fontSize: 11, color: colors.primary }}>{topic}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    {!memory.processed && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable
              onPress={() => router.push("/(tabs)/ask")}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: "#6C5CE7" + "15" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="sparkles" size={24} color="#6C5CE7" />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Ask AI</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/insights")}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: "#00D2D3" + "15" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="chart.bar.fill" size={24} color="#00D2D3" />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Insights</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/ask")}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: "#FDCB6E" + "15" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="lightbulb.fill" size={24} color="#FDCB6E" />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Ideas</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/library")}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: "#00B894" + "15" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="magnifyingglass" size={24} color="#00B894" />
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>Search</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  quickCapture: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  quickCaptureText: { fontSize: 15, flex: 1 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statNumber: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  topicRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  topicChipText: { fontSize: 13, fontWeight: "600" },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryContent: { flex: 1 },
  memoryTitle: { fontSize: 15, fontWeight: "600" },
  memorySummary: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  memoryTags: { flexDirection: "row", gap: 6, marginTop: 6 },
  miniTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 14,
    gap: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: "600" },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
