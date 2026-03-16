import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";
import { DailyDigestWidget } from "@/components/daily-digest";

const TYPE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  text: { icon: "text.alignleft", color: "#00C9A7", label: "Notes" },
  image: { icon: "photo.fill", color: "#D4A017", label: "Images" },
  voice: { icon: "mic.fill", color: "#E74C3C", label: "Voice" },
  document: { icon: "doc.fill", color: "#3498DB", label: "Docs" },
  link: { icon: "globe", color: "#1ABC9C", label: "Links" },
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    isGuest, hasCompletedOnboarding, subscription, favorites,
    loaded: appStateLoaded, setGuest, tags, activeFocusSession,
    getPendingReminders,
  } = useAppState();
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = isAuthenticated || isGuest;
  const pendingReminders = getPendingReminders();

  useEffect(() => {
    if (appStateLoaded && !hasCompletedOnboarding && !authLoading) {
      router.replace("/onboarding" as any);
    }
  }, [appStateLoaded, hasCompletedOnboarding, authLoading, router]);

  const recentQuery = trpc.memories.recent.useQuery({ limit: 8 }, { enabled: isAuthenticated });
  const statsQuery = trpc.memories.stats.useQuery(undefined, { enabled: isAuthenticated });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([recentQuery.refetch(), statsQuery.refetch()]);
    setRefreshing(false);
  }, [recentQuery, statsQuery]);

  const cardBg = isDark ? "rgba(20,35,28,0.55)" : "rgba(255,255,255,0.45)";
  const cardBorder = isDark ? "rgba(0,201,167,0.15)" : "rgba(0,201,167,0.2)";

  if (authLoading || !appStateLoaded) {
    return (
      <GlassScreen screenName="home">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#00C9A7" />
        </View>
      </GlassScreen>
    );
  }

  if (!isLoggedIn) {
    return (
      <GlassScreen screenName="onboarding" blurIntensity={30} overlayOpacity={0.5}>
        <View style={styles.loginContainer}>
          <View style={[styles.logoCircle, { backgroundColor: "#00C9A7" + "18" }]}>
            <IconSymbol name="brain" size={56} color="#00C9A7" />
          </View>
          <Text style={[styles.loginTitle, { color: colors.foreground }]}>MindVault</Text>
          <Text style={[styles.loginSubtitle, { color: colors.muted }]}>
            Your AI-powered second brain. Capture, organize, and query your knowledge effortlessly.
          </Text>
          <Pressable
            onPress={() => {
              const { startOAuthLogin } = require("@/lib/_core/auth");
              startOAuthLogin();
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: "#00C9A7" },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.primaryBtnText}>Sign In to Get Started</Text>
          </Pressable>
          <Pressable
            onPress={() => setGuest(true)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>Continue as Guest</Text>
          </Pressable>
        </View>
      </GlassScreen>
    );
  }

  const stats = statsQuery.data;
  const recentMemories = recentQuery.data || [];
  const favoriteMemories = recentMemories.filter((m) => favorites.includes(m.id));
  const totalMemories = stats?.total ?? 0;
  const byType = stats?.byType ?? {};
  const topTopics = stats?.topTopics ?? [];

  return (
    <GlassScreen screenName="home">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C9A7" />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateText, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }]}>{getDateRange()}</Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {getGreeting()}, {user?.name || "Explorer"}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push("/guide" as any)}
              style={({ pressed }) => [styles.glassIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }, pressed && { opacity: 0.7 }]}
            >
              <IconSymbol name="questionmark.circle.fill" size={18} color="#00C9A7" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/subscription" as any)}
              style={({ pressed }) => [styles.glassIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }, pressed && { opacity: 0.7 }]}
            >
              <IconSymbol name={subscription === "pro" ? "crown.fill" : "person.fill"} size={18} color={subscription === "pro" ? "#D4A017" : colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Guest Banner */}
        {isGuest && (
          <Pressable
            onPress={() => {
              const { startOAuthLogin } = require("@/lib/_core/auth");
              startOAuthLogin();
            }}
            style={({ pressed }) => [
              styles.guestBanner,
              { backgroundColor: "#D4A017" + "12", borderColor: "#D4A017" + "30" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={18} color="#D4A017" />
            <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>
              Guest mode — sign in to sync and unlock all features.
            </Text>
            <IconSymbol name="arrow.right" size={14} color="#00C9A7" />
          </Pressable>
        )}

        {/* Active Focus Session Banner */}
        {activeFocusSession && (
          <Pressable
            onPress={() => router.push({ pathname: "/focus" as any, params: { folderId: activeFocusSession.folderId, folderName: activeFocusSession.folderName } })}
            style={({ pressed }) => [
              styles.focusBanner,
              { backgroundColor: "#00C9A7" + "12", borderColor: "#00C9A7" + "30" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <IconSymbol name="scope" size={20} color="#00C9A7" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>Focus Mode Active</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {activeFocusSession.folderName} · {activeFocusSession.capturedMemoryIds.length} captured
              </Text>
            </View>
            <IconSymbol name="arrow.right" size={14} color="#00C9A7" />
          </Pressable>
        )}

        {/* Tutorial Tips */}
        <TutorialTip
          tipKey="home_welcome"
          icon="hand.wave.fill"
          iconColor="#00C9A7"
          title="Welcome to MindVault!"
          message="Start by capturing your first memory — a note, image, or link. Tap the Capture tab below to begin."
          actionLabel="Start Capturing"
          onAction={() => router.push("/(tabs)/capture")}
        />

        {/* Quick Capture */}
        <Pressable
          onPress={() => router.push("/(tabs)/capture")}
          style={({ pressed }) => [
            styles.quickCapture,
            { backgroundColor: cardBg, borderColor: cardBorder },
            pressed && { opacity: 0.8 },
          ]}
        >
          <IconSymbol name="plus.circle.fill" size={22} color="#00C9A7" />
          <Text style={[styles.quickCaptureText, { color: colors.muted }]}>
            Capture a thought, link, or file...
          </Text>
          <IconSymbol name="mic.fill" size={18} color={colors.muted} />
        </Pressable>

        {/* Daily Digest Widget */}
        <View style={styles.section}>
          <DailyDigestWidget />
        </View>

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <IconSymbol name="bell.fill" size={16} color="#D4A017" />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reminders</Text>
              </View>
              <Pressable onPress={() => router.push("/reminders" as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={{ color: "#00C9A7", fontSize: 14, fontWeight: "600" }}>See All</Text>
              </Pressable>
            </View>
            {pendingReminders.slice(0, 2).map((r) => (
              <View key={r.id} style={[styles.reminderCard, { backgroundColor: cardBg, borderColor: "#D4A017" + "20" }]}>
                <View style={[styles.reminderDot, { backgroundColor: "#D4A017" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: "600", color: colors.foreground }]}>{r.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{new Date(r.dueDate).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Dashboard Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dashboard</Text>
          <View style={styles.statsGrid}>
            {[
              { value: totalMemories, label: "Memories", color: "#00C9A7" },
              { value: topTopics.length, label: "Topics", color: "#D4A017" },
              { value: favorites.length, label: "Favorites", color: "#E67E22" },
              { value: tags.length, label: "Tags", color: "#9B59B6" },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.color + "10", borderColor: stat.color + "18" }]}>
                <Text style={[styles.statNumber, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Type Breakdown */}
        {Object.keys(byType).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Type</Text>
            <View style={styles.typeRow}>
              {Object.entries(byType).map(([type, count]) => {
                const info = TYPE_ICONS[type] || TYPE_ICONS.text;
                return (
                  <View key={type} style={[styles.typeCard, { backgroundColor: info.color + "10", borderColor: info.color + "15" }]}>
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
                  <View key={t.topic} style={[styles.topicChip, { backgroundColor: "#00C9A7" + "12", borderColor: "#00C9A7" + "20" }]}>
                    <Text style={[styles.topicChipText, { color: "#00C9A7" }]}>
                      {t.topic} ({t.count})
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* User Tags */}
        {tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Tags</Text>
              <Pressable onPress={() => router.push("/tags" as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={{ color: "#00C9A7", fontSize: 14, fontWeight: "600" }}>Manage</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.topicRow}>
                {tags.map((tag) => (
                  <View key={tag.id} style={[styles.topicChip, { backgroundColor: tag.color + "15", borderColor: tag.color + "25" }]}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.topicChipText, { color: tag.color }]}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Favorites */}
        {favoriteMemories.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IconSymbol name="star.fill" size={18} color="#D4A017" />
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Favorites</Text>
            </View>
            {favoriteMemories.slice(0, 3).map((memory) => {
              const typeInfo = TYPE_ICONS[memory.type] || TYPE_ICONS.text;
              return (
                <Pressable
                  key={memory.id}
                  onPress={() => router.push(`/memory/${memory.id}` as any)}
                  style={({ pressed }) => [
                    styles.memoryCard,
                    { backgroundColor: cardBg, borderColor: "#D4A017" + "25" },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.memoryIcon, { backgroundColor: typeInfo.color + "15" }]}>
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
                  <IconSymbol name="star.fill" size={14} color="#D4A017" />
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
              <Text style={{ color: "#00C9A7", fontSize: 14, fontWeight: "600" }}>See All</Text>
            </Pressable>
          </View>

          {recentQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#00C9A7" />
          ) : recentMemories.length === 0 ? (
            <GlassCard>
              <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                <IconSymbol name="sparkles" size={40} color="#00C9A7" />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Tap "Capture" to save your first thought, note, or file.
                </Text>
              </View>
            </GlassCard>
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
                      { backgroundColor: cardBg, borderColor: cardBorder },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={[styles.memoryIcon, { backgroundColor: typeInfo.color + "15" }]}>
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
                            <View key={topic} style={[styles.miniTag, { backgroundColor: "#00C9A7" + "12" }]}>
                              <Text style={{ fontSize: 11, color: "#00C9A7" }}>{topic}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    {isFav && <IconSymbol name="star.fill" size={14} color="#D4A017" />}
                    {!memory.processed && <ActivityIndicator size="small" color="#00C9A7" />}
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
              { label: "Ask AI", icon: "sparkles" as const, color: "#00C9A7", route: "/(tabs)/ask" },
              { label: "Focus", icon: "scope" as const, color: "#D4A017", route: "/focus" },
              { label: "Folders", icon: "folder.fill" as const, color: "#3498DB", route: "/folders" },
              { label: "Tags", icon: "tag.fill" as const, color: "#9B59B6", route: "/tags" },
              { label: "Reminders", icon: "bell.fill" as const, color: "#E67E22", route: "/reminders" },
              { label: "Export", icon: "square.and.arrow.down" as const, color: "#1ABC9C", route: "/export" },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: action.color + "10", borderColor: action.color + "15" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name={action.icon} size={24} color={action.color} />
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upgrade CTA */}
        {subscription === "basic" && (
          <Pressable
            onPress={() => router.push("/subscription" as any)}
            style={({ pressed }) => [
              styles.upgradeBanner,
              { backgroundColor: "#D4A017" + "10", borderColor: "#D4A017" + "25" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.upgradeContent}>
              <IconSymbol name="crown.fill" size={24} color="#D4A017" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>Upgrade to Pro</Text>
                <Text style={[styles.upgradeSubtitle, { color: colors.muted }]}>
                  Unlimited memories, smart reminders, collaboration & more
                </Text>
              </View>
              <IconSymbol name="arrow.right" size={16} color="#00C9A7" />
            </View>
          </Pressable>
        )}
      </ScrollView>
    </GlassScreen>
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
  glassIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
  focusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  loginContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  loginTitle: { fontSize: 32, fontWeight: "800" },
  loginSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
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
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  statNumber: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  typeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  typeCard: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minWidth: 70,
  },
  typeCount: { fontSize: 18, fontWeight: "700" },
  typeLabel: { fontSize: 11 },
  topicRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  topicChipText: { fontSize: 13, fontWeight: "600" },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 2,
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
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: "600" },
  upgradeBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  upgradeContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeTitle: { fontSize: 15, fontWeight: "700" },
  upgradeSubtitle: { fontSize: 12, marginTop: 2 },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 6,
  },
  reminderDot: { width: 8, height: 8, borderRadius: 4 },
});
