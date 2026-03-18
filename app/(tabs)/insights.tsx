import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard, useParallax } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { TooltipBubble } from "@/components/tooltip-bubble";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { KnowledgeGraphView } from "@/components/knowledge-graph";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";

type InsightTab = "summary" | "graph";

export default function InsightsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest } = useAppState();
  const [tab, setTab] = useState<InsightTab>("summary");
  const [refreshing, setRefreshing] = useState(false);
  const parallax = useParallax();
  const isLoggedIn = isAuthenticated || isGuest;

  const summaryQuery = trpc.ai.weeklySummary.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.memories.stats.useQuery(undefined, { enabled: isAuthenticated });
  const graphQuery = trpc.knowledge.graph.useQuery(undefined, { enabled: isAuthenticated });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), statsQuery.refetch(), graphQuery.refetch()]);
    setRefreshing(false);
  }, [summaryQuery, statsQuery, graphQuery]);

  if (!isLoggedIn) {
    return (
      <CinematicScreen screenName="insights">
        <View style={styles.centerFull}>
          <MaterialIcons name="insights" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.loginText}>Sign in to view insights</Text>
        </View>
      </CinematicScreen>
    );
  }

  const summary = summaryQuery.data;
  const stats = statsQuery.data;
  const graph = graphQuery.data;

  return (
    <CinematicScreen screenName="insights">
      <View style={styles.header}>
        <GoldenText variant="title" style={{ textAlign: "left" }}>Insights</GoldenText>
        <Pressable
          onPress={() => router.push("/share-insight" as any)}
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="share" size={18} color="#FFD700" />
        </Pressable>
      </View>

      <TooltipBubble tipId="insights_summary" text="Get AI-generated weekly summaries, discover recurring themes, and visualize your knowledge graph." position="bottom" arrowSide="center" />

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {[
          { key: "summary" as InsightTab, label: "Weekly Summary", icon: "auto-awesome" },
          { key: "graph" as InsightTab, label: "Knowledge Graph", icon: "hub" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <View style={[styles.tabBtn, { borderBottomColor: active ? "#FFD700" : "transparent" }]}>
                <MaterialIcons name={t.icon as any} size={18} color={active ? "#FFD700" : "rgba(255,255,255,0.3)"} />
                <Text style={{ color: active ? "#FFD700" : "rgba(255,255,255,0.3)", fontWeight: "600", fontSize: 15 }}>{t.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === "summary" ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />} onScroll={parallax?.onScroll} scrollEventThrottle={16}>
          {summaryQuery.isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Generating weekly summary...</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
              {/* Summary Card */}
              <GoldenCard style={{ borderColor: "rgba(255,215,0,0.2)" }}>
                <View style={styles.summaryHeader}>
                  <MaterialIcons name="auto-awesome" size={20} color="#FFD700" />
                  <Text style={styles.summaryTitle}>This Week</Text>
                  <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.countBadge}>
                    <Text style={{ color: "#0A0E1A", fontSize: 12, fontWeight: "700" }}>{summary?.memoryCount ?? 0} new</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.summaryText}>{summary?.summary || "No summary available yet. Save some memories to get started!"}</Text>
              </GoldenCard>

              {/* New Insights */}
              {summary?.newInsights && summary.newInsights.length > 0 && (
                <GoldenCard>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="lightbulb" size={18} color="#FFD700" />
                    <Text style={styles.sectionTitle}>New Insights</Text>
                  </View>
                  {summary.newInsights.map((insight: string, i: number) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={[styles.insightDot, { backgroundColor: "#FFD700" }]} />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </GoldenCard>
              )}

              {/* Recurring Themes */}
              {summary?.recurringThemes && summary.recurringThemes.length > 0 && (
                <GoldenCard>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="label" size={18} color="#BB86FC" />
                    <Text style={styles.sectionTitle}>Recurring Themes</Text>
                  </View>
                  <View style={styles.themeChips}>
                    {summary.recurringThemes.map((theme: string, i: number) => (
                      <View key={i} style={styles.themeChip}>
                        <Text style={{ color: "#BB86FC", fontSize: 13, fontWeight: "600" }}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                </GoldenCard>
              )}

              {/* Knowledge Gaps */}
              {summary?.knowledgeGaps && summary.knowledgeGaps.length > 0 && (
                <GoldenCard>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="warning" size={18} color="#FFA500" />
                    <Text style={styles.sectionTitle}>Knowledge Gaps</Text>
                  </View>
                  {summary.knowledgeGaps.map((gap: string, i: number) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={[styles.insightDot, { backgroundColor: "#FFA500" }]} />
                      <Text style={styles.insightText}>{gap}</Text>
                    </View>
                  ))}
                </GoldenCard>
              )}

              {/* Top Topics */}
              {stats?.topTopics && stats.topTopics.length > 0 && (
                <GoldenCard>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="trending-up" size={18} color="#4FC3F7" />
                    <Text style={styles.sectionTitle}>Top Topics</Text>
                  </View>
                  {stats.topTopics.slice(0, 8).map((t) => (
                    <View key={t.topic} style={styles.topicBarRow}>
                      <Text style={styles.topicLabel} numberOfLines={1}>{t.topic}</Text>
                      <View style={styles.topicBarContainer}>
                        <LinearGradient
                          colors={["#FFD700", "#FFA500"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.topicBar, { width: `${Math.min((t.count / (stats.topTopics[0]?.count || 1)) * 100, 100)}%` as any }]}
                        />
                      </View>
                      <Text style={styles.topicCount}>{t.count}</Text>
                    </View>
                  ))}
                </GoldenCard>
              )}

              {/* Memory Type Breakdown */}
              {stats?.byType && Object.keys(stats.byType).length > 0 && (
                <GoldenCard>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="category" size={18} color="#81C784" />
                    <Text style={styles.sectionTitle}>Memory Types</Text>
                  </View>
                  <View style={styles.typeGrid}>
                    {Object.entries(stats.byType).map(([type, count]) => {
                      const typeColors: Record<string, string> = { text: "#BB86FC", image: "#4FC3F7", voice: "#FF6B6B", document: "#FFD700", link: "#81C784" };
                      const c = typeColors[type] || "#FFD700";
                      return (
                        <LinearGradient key={type} colors={[`${c}15`, `${c}08`]} style={styles.typeItem}>
                          <Text style={{ fontSize: 22, fontWeight: "700", color: c }}>{count}</Text>
                          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>{type}</Text>
                        </LinearGradient>
                      );
                    })}
                  </View>
                </GoldenCard>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {graphQuery.isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading knowledge graph...</Text>
            </View>
          ) : graph && graph.nodes && graph.nodes.length > 0 ? (
            <KnowledgeGraphView nodes={graph.nodes} edges={graph.edges} />
          ) : (
            <View style={styles.emptyGraph}>
              <MaterialIcons name="hub" size={48} color="rgba(255,215,0,0.2)" />
              <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "600", marginTop: 12 }}>No connections yet</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center", marginTop: 4, paddingHorizontal: 32 }}>
                Save more memories with different topics to see how your knowledge connects.
              </Text>
            </View>
          )}
        </View>
      )}
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  loginText: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(15,20,40,0.88)", borderWidth: 1, borderColor: "rgba(255,215,0,0.25)", alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,215,0,0.08)" },
  tabBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 6, borderBottomWidth: 2 },
  loadingCenter: { alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: "rgba(255,255,255,0.7)", marginTop: 12 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  summaryTitle: { fontSize: 17, fontWeight: "700", flex: 1, color: "#FFFFFF" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  summaryText: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.7)" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightText: { fontSize: 14, lineHeight: 20, flex: 1, color: "rgba(255,255,255,0.8)" },
  themeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(187,134,252,0.12)" },
  topicBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  topicLabel: { width: 90, fontSize: 13, color: "rgba(255,255,255,0.8)" },
  topicBarContainer: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(8,12,28,0.88)", overflow: "hidden" },
  topicBar: { height: "100%" as any, borderRadius: 4 },
  topicCount: { width: 24, fontSize: 12, textAlign: "right", color: "rgba(255,255,255,0.35)" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeItem: { alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, minWidth: 80, flexGrow: 1 },
  emptyGraph: { flex: 1, alignItems: "center", justifyContent: "center" },
});
