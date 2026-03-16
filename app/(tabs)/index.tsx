import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";

const TYPE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  text: { icon: "text.alignleft", color: "#6C5CE7", label: "Notes" },
  image: { icon: "photo.fill", color: "#00D2D3", label: "Images" },
  voice: { icon: "mic.fill", color: "#FF6B6B", label: "Voice" },
  document: { icon: "doc.fill", color: "#FDCB6E", label: "Docs" },
  link: { icon: "globe", color: "#00B894", label: "Links" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateRange() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isGuest, hasCompletedOnboarding, subscription, favorites, loaded: appStateLoaded, setGuest } = useAppState();
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = isAuthenticated || isGuest;

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (appStateLoaded && !hasCompletedOnboarding && !authLoading) {
      router.replace("/onboarding" as any);
    }
  }, [appStateLoaded, hasCompletedOnboarding, authLoading, router]);

  const recentQuery = trpc.memories.recent.useQuery(
    { limit: 8 },
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

  if (authLoading || !appStateLoaded) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!isLoggedIn) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <View style={styles.loginContainer}>
          <IconSymbol name="brain" size={64} color={colors.primary} />
          <Text style={[styles.loginTitle, { color: colors.foreground }]}>MindVault</Text>
          <Text style={[styles.loginSubtitle, { color: colors.muted }]}>
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
          <Pressable
            onPress={() => {
              setGuest(true);
            }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>Continue as Guest</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const stats = statsQuery.data;
  const recentMemories = recentQuery.data || [];
  const favoriteMemories = recentMemories.filter((m) => favorites.includes(m.id));
  const totalMemories = stats?.total ?? 0;
  const byType = stats?.byType ?? {};
  const topTopics = stats?.topTopics ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header with Guide Button */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateText, { color: colors.muted }]}>{getDateRange()}</Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {getGreeting()}, {user?.name || "Explorer"}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push("/guide" as any)}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
            >
              <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/subscription" as any)}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
            >
              <IconSymbol name={subscription === "pro" ? "crown.fill" : "person.fill"} size={20} color={subscription === "pro" ? "#FDCB6E" : colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Guest Mode Banner */}
        {isGuest && (
          <Pressable
            onPress={() => {
              const { startOAuthLogin } = require("@/lib/_core/auth");
              startOAuthLogin();
            }}
            style={({ pressed }) => [
              styles.guestBanner,
              { backgroundColor: "#FDCB6E" + "15", borderColor: "#FDCB6E" + "40" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={18} color="#FDCB6E" />
            <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>
              You're in guest mode. Sign in to sync across devices and unlock all features.
            </Text>
            <IconSymbol name="arrow.right" size={14} color={colors.primary} />
          </Pressable>
        )}

        {/* Tutorial Tips */}
        <TutorialTip
          tipKey="home_welcome"
          icon="hand.wave.fill"
          iconColor="#6C5CE7"
          title="Welcome to MindVault!"
          message="Start by capturing your first memory — a note, image, or link. Tap the Capture tab below to begin."
          actionLabel="Start Capturing"
          onAction={() => router.push("/(tabs)/capture")}
        />

        <TutorialTip
          tipKey="home_ask_ai"
          icon="sparkles"
          iconColor="#00D2D3"
          title="Ask AI Anything"
          message="Once you've saved some memories, use the Ask AI tab to query your knowledge base with natural language questions."
        />

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
          <IconSymbol name="mic.fill" size={18} color={colors.muted} />
        </Pressable>

        {/* Dashboard Stats */}
        <View style={styles.dashboardSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dashboard</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.primary + "10" }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{totalMemories}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Total Memories</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#00D2D3" + "10" }]}>
              <Text style={[styles.statNumber, { color: "#00D2D3" }]}>{topTopics.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Topics</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#FDCB6E" + "10" }]}>
              <Text style={[styles.statNumber, { color: "#FDCB6E" }]}>{favorites.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Favorites</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#00B894" + "10" }]}>
              <Text style={[styles.statNumber, { color: "#00B894" }]}>
                {Object.keys(byType).length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Types</Text>
            </View>
          </View>
        </View>

        {/* Type Breakdown */}
        {Object.keys(byType).length > 0 && (
          <View style={styles.typeBreakdown}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Type</Text>
            <View style={styles.typeRow}>
              {Object.entries(byType).map(([type, count]) => {
                const info = TYPE_ICONS[type] || TYPE_ICONS.text;
                return (
                  <View key={type} style={[styles.typeCard, { backgroundColor: info.color + "10" }]}>
                    <IconSymbol name={info.icon} size={20} color={info.color} />
                    <Text style={[styles.typeCount, { color: info.color }]}>{count as number}</Text>
                    <Text style={[styles.typeLabel, { color: colors.muted }]}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Trending Topics */}
        {topTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending Topics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.topicRow}>
                {topTopics.slice(0, 10).map((t) => (
                  <View key={t.topic} style={[styles.topicChip, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.topicChipText, { color: colors.primary }]}>
                      {t.topic} ({t.count})
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Favorites */}
        {favoriteMemories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="star.fill" size={18} color="#FDCB6E" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
            </View>
            {favoriteMemories.slice(0, 3).map((memory) => {
              const typeInfo = TYPE_ICONS[memory.type] || TYPE_ICONS.text;
              return (
                <Pressable
                  key={memory.id}
                  onPress={() => router.push(`/memory/${memory.id}` as any)}
                  style={({ pressed }) => [
                    styles.memoryCard,
                    { backgroundColor: colors.surface, borderColor: "#FDCB6E" + "40" },
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
                    <Text style={[styles.memorySummary, { color: colors.muted }]} numberOfLines={1}>
                      {memory.aiSummary || memory.content || "Processing..."}
                    </Text>
                  </View>
                  <IconSymbol name="star.fill" size={14} color="#FDCB6E" />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent Memories */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Memories</Text>
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
            <View style={{ gap: 10 }}>
              {recentMemories.slice(0, 5).map((memory) => {
                const typeInfo = TYPE_ICONS[memory.type] || TYPE_ICONS.text;
                const isFav = favorites.includes(memory.id);
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
                    {isFav && <IconSymbol name="star.fill" size={14} color="#FDCB6E" />}
                    {!memory.processed && <ActivityIndicator size="small" color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: "Ask AI", icon: "sparkles" as const, color: "#6C5CE7", route: "/(tabs)/ask" },
              { label: "Insights", icon: "chart.bar.fill" as const, color: "#00D2D3", route: "/(tabs)/insights" },
              { label: "Folders", icon: "folder.fill" as const, color: "#FDCB6E", route: "/folders" },
              { label: "Search", icon: "magnifyingglass" as const, color: "#00B894", route: "/(tabs)/library" },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: action.color + "12" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name={action.icon} size={24} color={action.color} />
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subscription CTA for Basic users */}
        {subscription === "basic" && (
          <Pressable
            onPress={() => router.push("/subscription" as any)}
            style={({ pressed }) => [
              styles.upgradeBanner,
              { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.upgradeContent}>
              <IconSymbol name="crown.fill" size={24} color="#FDCB6E" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>Upgrade to Pro</Text>
                <Text style={[styles.upgradeSubtitle, { color: colors.muted }]}>
                  Unlimited memories, advanced AI analysis, export & more
                </Text>
              </View>
              <IconSymbol name="arrow.right" size={16} color={colors.primary} />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dateText: { fontSize: 12, fontWeight: "500" },
  greeting: { fontSize: 22, fontWeight: "700", marginTop: 2 },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  guestBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  loginContainer: { alignItems: "center", gap: 12 },
  loginTitle: { fontSize: 32, fontWeight: "800" },
  loginSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
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
  dashboardSection: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
  },
  statNumber: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  typeBreakdown: { paddingHorizontal: 20, marginTop: 20 },
  typeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  typeCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
    minWidth: 70,
  },
  typeCount: { fontSize: 18, fontWeight: "700" },
  typeLabel: { fontSize: 11 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  topicRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
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
  upgradeBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upgradeTitle: { fontSize: 15, fontWeight: "700" },
  upgradeSubtitle: { fontSize: 12, marginTop: 2 },
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
