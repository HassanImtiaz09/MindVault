import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { StyleSheet } from "react-native";
import { KnowledgeGraphView } from "@/components/knowledge-graph";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";

type InsightTab = "summary" | "graph";

export default function InsightsScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<InsightTab>("summary");
  const [refreshing, setRefreshing] = useState(false);

  const summaryQuery = trpc.ai.weeklySummary.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.memories.stats.useQuery(undefined, { enabled: isAuthenticated });
  const graphQuery = trpc.knowledge.graph.useQuery(undefined, { enabled: isAuthenticated });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), statsQuery.refetch(), graphQuery.refetch()]);
    setRefreshing(false);
  }, [summaryQuery, statsQuery, graphQuery]);

  const { isGuest } = useAppState();
  const isLoggedIn = isAuthenticated || isGuest;

  if (!isLoggedIn) {
    return (
      <GlassScreen screenName="insights" className="flex-1 items-center justify-center p-6">
        <IconSymbol name="chart.bar.fill" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to view insights</Text>
      </GlassScreen>
    );
  }

  const summary = summaryQuery.data;
  const stats = statsQuery.data;
  const graph = graphQuery.data;

  return (
    <GlassScreen screenName="insights">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Insights</Text>
      </View>

      {/* Tutorial Tip */}
      <TutorialTip
        tipKey="insights_intro"
        icon="chart.bar.fill"
        iconColor="#00D2D3"
        title="Weekly Knowledge Insights"
        message="Get AI-generated weekly summaries of your knowledge, discover recurring themes, and visualize connections between topics in the knowledge graph."
      />

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab("summary")}
          style={({ pressed }) => [
            styles.tabBtn,
            { borderBottomColor: tab === "summary" ? colors.primary : "transparent" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="sparkles" size={18} color={tab === "summary" ? colors.primary : colors.muted} />
          <Text style={{ color: tab === "summary" ? colors.primary : colors.muted, fontWeight: "600", fontSize: 15 }}>
            Weekly Summary
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("graph")}
          style={({ pressed }) => [
            styles.tabBtn,
            { borderBottomColor: tab === "graph" ? colors.primary : "transparent" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="chart.bar.fill" size={18} color={tab === "graph" ? colors.primary : colors.muted} />
          <Text style={{ color: tab === "graph" ? colors.primary : colors.muted, fontWeight: "600", fontSize: 15 }}>
            Knowledge Graph
          </Text>
        </Pressable>
      </View>

      {tab === "summary" ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {summaryQuery.isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.muted, marginTop: 12 }}>Generating weekly summary...</Text>
            </View>
          ) : (
            <View className="px-5 mt-4" style={{ gap: 16 }}>
              {/* Summary Card */}
              <View style={[styles.summaryCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <View style={styles.summaryHeader}>
                  <IconSymbol name="sparkles" size={20} color={colors.primary} />
                  <Text style={[styles.summaryTitle, { color: colors.foreground }]}>This Week</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                      {summary?.memoryCount ?? 0} new
                    </Text>
                  </View>
                </View>
                <Text style={[styles.summaryText, { color: colors.foreground }]}>
                  {summary?.summary || "No summary available yet."}
                </Text>
              </View>

              {/* New Insights */}
              {summary?.newInsights && summary.newInsights.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconSymbol name="lightbulb.fill" size={18} color="#FDCB6E" />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New Insights</Text>
                  </View>
                  {summary.newInsights.map((insight: string, i: number) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={[styles.insightDot, { backgroundColor: "#FDCB6E" }]} />
                      <Text style={[styles.insightText, { color: colors.foreground }]}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recurring Themes */}
              {summary?.recurringThemes && summary.recurringThemes.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconSymbol name="tag.fill" size={18} color="#6C5CE7" />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recurring Themes</Text>
                  </View>
                  <View style={styles.themeChips}>
                    {summary.recurringThemes.map((theme: string, i: number) => (
                      <View key={i} style={[styles.themeChip, { backgroundColor: "#6C5CE7" + "18" }]}>
                        <Text style={{ color: "#6C5CE7", fontSize: 13, fontWeight: "600" }}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Knowledge Gaps */}
              {summary?.knowledgeGaps && summary.knowledgeGaps.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Knowledge Gaps</Text>
                  </View>
                  {summary.knowledgeGaps.map((gap: string, i: number) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={[styles.insightDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.insightText, { color: colors.foreground }]}>{gap}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Topic Stats */}
              {stats?.topTopics && stats.topTopics.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconSymbol name="chart.bar.fill" size={18} color="#00D2D3" />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Topics</Text>
                  </View>
                  {stats.topTopics.slice(0, 8).map((t) => (
                    <View key={t.topic} style={styles.topicBarRow}>
                      <Text style={[styles.topicLabel, { color: colors.foreground }]} numberOfLines={1}>
                        {t.topic}
                      </Text>
                      <View style={styles.topicBarContainer}>
                        <View
                          style={[
                            styles.topicBar,
                            {
                              backgroundColor: colors.primary,
                              width: `${Math.min((t.count / (stats.topTopics[0]?.count || 1)) * 100, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.topicCount, { color: colors.muted }]}>{t.count}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Memory Type Breakdown */}
              {stats?.byType && Object.keys(stats.byType).length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <IconSymbol name="book.fill" size={18} color="#00B894" />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Memory Types</Text>
                  </View>
                  <View style={styles.typeGrid}>
                    {Object.entries(stats.byType).map(([type, count]) => {
                      const typeColors: Record<string, string> = {
                        text: "#6C5CE7",
                        image: "#00D2D3",
                        voice: "#FF6B6B",
                        document: "#FDCB6E",
                        link: "#00B894",
                      };
                      return (
                        <View key={type} style={[styles.typeItem, { backgroundColor: (typeColors[type] || colors.primary) + "15" }]}>
                          <Text style={{ fontSize: 22, fontWeight: "700", color: typeColors[type] || colors.primary }}>
                            {count}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted, textTransform: "capitalize" }}>
                            {type}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        /* Knowledge Graph Tab */
        <View style={{ flex: 1 }}>
          {graphQuery.isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.muted, marginTop: 12 }}>Loading knowledge graph...</Text>
            </View>
          ) : graph && graph.nodes && graph.nodes.length > 0 ? (
            <KnowledgeGraphView nodes={graph.nodes} edges={graph.edges} />
          ) : (
            <View style={styles.emptyGraph}>
              <IconSymbol name="chart.bar.fill" size={48} color={colors.muted + "60"} />
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "600", marginTop: 12 }}>
                No connections yet
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 4, paddingHorizontal: 32 }}>
                Save more memories with different topics to see how your knowledge connects.
              </Text>
            </View>
          )}
        </View>
      )}
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
  },
  loadingCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  summaryTitle: { fontSize: 17, fontWeight: "700", flex: 1 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryText: { fontSize: 15, lineHeight: 22 },
  sectionCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: { fontSize: 14, lineHeight: 20, flex: 1 },
  themeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  topicBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  topicLabel: { width: 90, fontSize: 13 },
  topicBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB20",
    overflow: "hidden",
  },
  topicBar: {
    height: "100%",
    borderRadius: 4,
  },
  topicCount: { width: 24, fontSize: 12, textAlign: "right" },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeItem: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    flexGrow: 1,
  },
  emptyGraph: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
