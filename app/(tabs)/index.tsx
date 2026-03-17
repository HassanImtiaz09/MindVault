import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet, Platform } from "react-native";
import { CinematicScreen, GoldenCard, useParallax } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import { TooltipBubble } from "@/components/tooltip-bubble";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useAppState } from "@/lib/app-state";
import { LinearGradient } from "expo-linear-gradient";
import { useTransition } from "@/lib/transition-context";
import { startOAuthLogin } from "@/constants/oauth";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  text: { icon: "edit-note", color: "#FFD700", label: "Notes" },
  image: { icon: "image", color: "#FFA500", label: "Images" },
  voice: { icon: "mic", color: "#FF6B6B", label: "Voice" },
  document: { icon: "description", color: "#4FC3F7", label: "Docs" },
  link: { icon: "link", color: "#81C784", label: "Links" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    isGuest, hasCompletedOnboarding, subscription, favorites,
    loaded: appStateLoaded, setGuest, tags, activeFocusSession,
    getPendingReminders, getLatestDigest,
  } = useAppState();
  const { triggerTransition } = useTransition();
  const parallax = useParallax();
  const [refreshing, setRefreshing] = useState(false);

  const isLoggedIn = isAuthenticated || isGuest;
  const pendingReminders = getPendingReminders();
  const digest = getLatestDigest();

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

  if (authLoading || !appStateLoaded) {
    return (
      <CinematicScreen screenName="home">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </CinematicScreen>
    );
  }

  if (!isLoggedIn) {
    return (
      <CinematicScreen screenName="onboarding" overlayOpacity={0.6} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.loginContainer}>
          <View style={styles.loginIcon}>
            <MaterialIcons name="psychology" size={56} color="#FFD700" />
          </View>
          <GoldenText variant="hero">MINDVAULT</GoldenText>
          <Text style={styles.loginSubtitle}>
            Your AI-powered second brain.{"\n"}Capture, organize, and query your knowledge.
          </Text>
          <View style={{ width: "100%", paddingHorizontal: 24, gap: 12, marginTop: 16 }}>
            <GoldenButton title="SIGN IN" onPress={() => startOAuthLogin()} icon="login" variant="primary" />
            <GoldenButton title="EXPLORE AS GUEST" onPress={() => setGuest(true)} icon="explore" variant="outline" />
          </View>
        </View>
      </CinematicScreen>
    );
  }

  const stats = statsQuery.data;
  const recentMemories = recentQuery.data || [];
  const favoriteMemories = recentMemories.filter((m) => favorites.includes(m.id));
  const totalMemories = stats?.total ?? 0;
  const byType = stats?.byType ?? {};
  const topTopics = stats?.topTopics ?? [];

  const displayDigest = digest || {
    date: new Date().toISOString(),
    insight: "Start capturing memories and your Daily Digest will appear here.",
    focusTopic: "Getting Started",
    memoriesCount: 0,
    topMemory: null,
  };

  return (
    <CinematicScreen screenName="home">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
        onScroll={parallax?.onScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name || "Explorer"}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => { triggerTransition("sparkle"); router.push("/guide" as any); }}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="menu-book" size={18} color="#FFD700" />
            </Pressable>
            <Pressable
              onPress={() => { triggerTransition("sparkle"); router.push("/subscription" as any); }}
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons
                name={subscription === "pro" ? "workspace-premium" : "person"}
                size={18}
                color={subscription === "pro" ? "#FFD700" : "rgba(255,255,255,0.5)"}
              />
            </Pressable>
          </View>
        </View>

        {/* Guest Banner */}
        {isGuest && (
          <Pressable
            onPress={() => startOAuthLogin()}
            style={({ pressed }) => [styles.guestBanner, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="info-outline" size={18} color="#FFD700" />
            <Text style={styles.guestText}>Guest mode — sign in to sync & unlock all features</Text>
            <MaterialIcons name="chevron-right" size={16} color="#FFD700" />
          </Pressable>
        )}

        {/* Active Focus */}
        {activeFocusSession && (
          <Pressable
            onPress={() => router.push({ pathname: "/focus" as any, params: { folderId: activeFocusSession.folderId, folderName: activeFocusSession.folderName } })}
            style={({ pressed }) => [styles.focusBanner, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="center-focus-strong" size={20} color="#81C784" />
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>Focus Mode Active</Text>
              <Text style={styles.focusSub}>{activeFocusSession.folderName} · {activeFocusSession.capturedMemoryIds.length} captured</Text>
            </View>
            <MaterialIcons name="chevron-right" size={16} color="#81C784" />
          </Pressable>
        )}

        {/* Tooltip for first-time users */}
        <TooltipBubble tipId="home_quick_capture" text="Tap the bar below to quickly capture a thought, link, or file!" position="bottom" arrowSide="left" />

        {/* Quick Capture Bar */}
        <Pressable
          onPress={() => { triggerTransition("sparkle"); router.push("/(tabs)/capture"); }}
          style={({ pressed }) => [styles.captureBar, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="add-circle" size={22} color="#FFD700" />
          <Text style={styles.captureBarText}>Capture a thought, link, or file...</Text>
          <MaterialIcons name="mic" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>

        {/* Daily Digest */}
        <View style={styles.section}>
          <TooltipBubble tipId="home_daily_digest" text="Your Daily Digest surfaces the most relevant memory and insight each morning." position="bottom" arrowSide="center" />
          <GoldenCard>
            <View style={styles.digestHeader}>
              <View style={styles.digestIconBg}>
                <MaterialIcons name="wb-sunny" size={18} color="#FFD700" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.digestTitle}>Daily Digest</Text>
                <Text style={styles.digestDate}>
                  {new Date(displayDigest.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </Text>
              </View>
            </View>
            <View style={styles.digestFocus}>
              <MaterialIcons name="center-focus-strong" size={14} color="#81C784" />
              <Text style={styles.digestFocusText}>Focus: {displayDigest.focusTopic}</Text>
            </View>
            <Text style={styles.digestInsight} numberOfLines={3}>{displayDigest.insight}</Text>
            {displayDigest.topMemory && (
              <Pressable
                onPress={() => router.push(`/memory/${displayDigest.topMemory!.id}` as any)}
                style={({ pressed }) => [styles.digestMemory, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="star" size={14} color="#FFD700" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.digestMemTitle} numberOfLines={1}>{displayDigest.topMemory.title}</Text>
                  <Text style={styles.digestMemSummary} numberOfLines={1}>{displayDigest.topMemory.summary}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.3)" />
              </Pressable>
            )}
          </GoldenCard>
        </View>

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialIcons name="notifications-active" size={16} color="#FFA500" />
                <Text style={styles.sectionTitle}>Reminders</Text>
              </View>
              <Pressable onPress={() => router.push("/reminders" as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            {pendingReminders.slice(0, 2).map((r) => (
              <GoldenCard key={r.id} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.reminderDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>{r.title}</Text>
                    <Text style={styles.reminderDate}>{new Date(r.dueDate).toLocaleDateString()}</Text>
                  </View>
                </View>
              </GoldenCard>
            ))}
          </View>
        )}

        {/* Dashboard Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.statsGrid}>
            {[
              { value: totalMemories, label: "Memories", icon: "psychology", color: "#FFD700" },
              { value: topTopics.length, label: "Topics", icon: "hub", color: "#FFA500" },
              { value: favorites.length, label: "Favorites", icon: "star", color: "#FF6B6B" },
              { value: tags.length, label: "Tags", icon: "label", color: "#81C784" },
            ].map((s) => (
              <LinearGradient
                key={s.label}
                colors={[`${s.color}15`, `${s.color}08`]}
                style={styles.statCard}
              >
                <MaterialIcons name={s.icon as any} size={20} color={s.color} />
                <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Type Breakdown */}
        {Object.keys(byType).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Type</Text>
            <View style={styles.typeRow}>
              {Object.entries(byType).map(([type, count]) => {
                const info = TYPE_META[type] || TYPE_META.text;
                return (
                  <LinearGradient key={type} colors={[`${info.color}15`, `${info.color}08`]} style={styles.typeCard}>
                    <MaterialIcons name={info.icon as any} size={20} color={info.color} />
                    <Text style={[styles.typeCount, { color: info.color }]}>{count as number}</Text>
                    <Text style={styles.typeLabel}>{info.label}</Text>
                  </LinearGradient>
                );
              })}
            </View>
          </View>
        )}

        {/* Trending Topics */}
        {topTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Topics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, paddingRight: 20 }}>
                {topTopics.slice(0, 10).map((t) => (
                  <View key={t.topic} style={styles.topicChip}>
                    <Text style={styles.topicText}>{t.topic} ({t.count})</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Your Tags</Text>
              <Pressable onPress={() => router.push("/tags" as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={styles.seeAll}>Manage</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, paddingRight: 20 }}>
                {tags.map((tag) => (
                  <View key={tag.id} style={[styles.topicChip, { borderColor: `${tag.color}40` }]}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.topicText, { color: tag.color }]}>{tag.name}</Text>
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
              <MaterialIcons name="star" size={18} color="#FFD700" />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Favorites</Text>
            </View>
            {favoriteMemories.slice(0, 3).map((memory) => {
              const meta = TYPE_META[memory.type] || TYPE_META.text;
              return (
                <Pressable
                  key={memory.id}
                  onPress={() => router.push(`/memory/${memory.id}` as any)}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <GoldenCard style={{ marginBottom: 8, borderColor: "rgba(255,215,0,0.2)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={[styles.memIcon, { backgroundColor: `${meta.color}20` }]}>
                        <MaterialIcons name={meta.icon as any} size={18} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memTitle} numberOfLines={1}>{memory.title}</Text>
                        <Text style={styles.memSummary} numberOfLines={1}>{memory.aiSummary || memory.content || "Processing..."}</Text>
                      </View>
                      <MaterialIcons name="star" size={14} color="#FFD700" />
                    </View>
                  </GoldenCard>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent Memories */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Memories</Text>
            <Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {recentQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#FFD700" />
          ) : recentMemories.length === 0 ? (
            <GoldenCard>
              <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                <MaterialIcons name="auto-awesome" size={40} color="#FFD700" />
                <Text style={styles.emptyTitle}>No memories yet</Text>
                <Text style={styles.emptySub}>Tap "Capture" to save your first thought, note, or file.</Text>
              </View>
            </GoldenCard>
          ) : (
            <View style={{ gap: 8 }}>
              {recentMemories.slice(0, 5).map((memory) => {
                const meta = TYPE_META[memory.type] || TYPE_META.text;
                const isFav = favorites.includes(memory.id);
                return (
                  <Pressable
                    key={memory.id}
                    onPress={() => router.push(`/memory/${memory.id}` as any)}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <GoldenCard>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={[styles.memIcon, { backgroundColor: `${meta.color}20` }]}>
                          <MaterialIcons name={meta.icon as any} size={18} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memTitle} numberOfLines={1}>{memory.title}</Text>
                          <Text style={styles.memSummary} numberOfLines={2}>{memory.aiSummary || memory.content || "Processing..."}</Text>
                          {memory.aiTopics && memory.aiTopics.length > 0 && (
                            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                              {memory.aiTopics.slice(0, 3).map((topic) => (
                                <View key={topic} style={styles.miniTag}>
                                  <Text style={styles.miniTagText}>{topic}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        {isFav && <MaterialIcons name="star" size={14} color="#FFD700" />}
                        {!memory.processed && <ActivityIndicator size="small" color="#FFD700" />}
                      </View>
                    </GoldenCard>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TooltipBubble tipId="home_ask_ai" text="Use Ask AI to query your knowledge base in natural language!" position="bottom" arrowSide="left" />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: "Ask AI", icon: "auto-awesome", color: "#FFD700", route: "/(tabs)/ask" },
              { label: "Focus", icon: "center-focus-strong", color: "#81C784", route: "/focus" },
              { label: "Folders", icon: "folder", color: "#4FC3F7", route: "/folders" },
              { label: "Tags", icon: "label", color: "#CE93D8", route: "/tags" },
              { label: "Reminders", icon: "notifications", color: "#FFA500", route: "/reminders" },
              { label: "Export", icon: "cloud-download", color: "#80CBC4", route: "/export" },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={() => { triggerTransition("sparkle"); router.push(action.route as any); }}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <LinearGradient colors={[`${action.color}15`, `${action.color}08`]} style={styles.actionCard}>
                  <MaterialIcons name={action.icon as any} size={24} color={action.color} />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upgrade CTA */}
        {subscription === "basic" && (
          <Pressable
            onPress={() => { triggerTransition("burst"); router.push("/subscription" as any); }}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <LinearGradient colors={["rgba(255,215,0,0.12)", "rgba(255,165,0,0.06)"]} style={styles.upgradeBanner}>
              <MaterialIcons name="workspace-premium" size={24} color="#FFD700" />
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeSub}>Unlimited memories, smart reminders, collaboration & more</Text>
              </View>
              <MaterialIcons name="chevron-right" size={16} color="#FFD700" />
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  loginIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(15,20,40,0.88)", borderWidth: 1.5, borderColor: "rgba(255,215,0,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  loginSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 15, textAlign: "center", lineHeight: 22 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  dateText: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.7)" },
  greeting: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  topActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(15,20,40,0.88)", borderWidth: 1, borderColor: "rgba(255,215,0,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  guestBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
    backgroundColor: "rgba(15,20,40,0.90)", borderColor: "rgba(255,215,0,0.25)", gap: 10,
  },
  guestText: { color: "rgba(255,255,255,0.8)", fontSize: 13, flex: 1 },
  focusBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
    backgroundColor: "rgba(129,199,132,0.08)", borderColor: "rgba(129,199,132,0.2)", gap: 10,
  },
  focusTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  focusSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  captureBar: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
    backgroundColor: "rgba(15,20,40,0.90)", borderColor: "rgba(255,215,0,0.22)", gap: 10,
  },
  captureBarText: { fontSize: 15, flex: 1, color: "rgba(255,255,255,0.35)" },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", marginBottom: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  seeAll: { color: "#FFD700", fontSize: 14, fontWeight: "600" },
  digestHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  digestIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,215,0,0.1)", alignItems: "center", justifyContent: "center" },
  digestTitle: { fontSize: 16, fontWeight: "700", color: "#FFD700" },
  digestDate: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  digestFocus: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(129,199,132,0.1)", marginTop: 8 },
  digestFocusText: { fontSize: 13, fontWeight: "600", color: "#81C784" },
  digestInsight: { fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.7)", marginTop: 8 },
  digestMemory: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.15)", marginTop: 8 },
  digestMemTitle: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  digestMemSummary: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%" as any, flexGrow: 1, alignItems: "center", paddingVertical: 18, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.1)" },
  statNumber: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2, color: "rgba(255,255,255,0.7)" },
  typeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  typeCard: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.08)", gap: 4, minWidth: 70 },
  typeCount: { fontSize: 18, fontWeight: "700" },
  typeLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  topicChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,215,0,0.2)", gap: 6 },
  topicText: { fontSize: 13, fontWeight: "600", color: "#FFD700" },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  memIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  memTitle: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  memSummary: { fontSize: 13, marginTop: 2, lineHeight: 18, color: "rgba(255,255,255,0.75)" },
  miniTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "rgba(255,215,0,0.1)" },
  miniTagText: { fontSize: 11, color: "#FFD700" },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  emptySub: { fontSize: 14, textAlign: "center", paddingHorizontal: 32, color: "rgba(255,255,255,0.7)" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { width: 105, alignItems: "center", paddingVertical: 18, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.08)", gap: 6 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  upgradeBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.2)", gap: 12 },
  upgradeTitle: { fontSize: 15, fontWeight: "700", color: "#FFD700" },
  upgradeSub: { fontSize: 12, marginTop: 2, color: "rgba(255,255,255,0.7)" },
  reminderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFA500" },
  reminderTitle: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  reminderDate: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
});
