import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";

export default function UpgradeAnalyticsScreen() {
  const router = useRouter();
  const { getUpgradeAnalytics, upgradePromptEvents } = useAppState();
  const analytics = getUpgradeAnalytics();

  // Group events by screen
  const byScreen: Record<string, number> = {};
  for (const e of upgradePromptEvents) {
    byScreen[e.screen] = (byScreen[e.screen] || 0) + 1;
  }
  const screenBreakdown = Object.entries(byScreen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Recent events
  const recentEvents = [...upgradePromptEvents].reverse().slice(0, 20);

  return (
    <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Upgrade Analytics</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Overview Stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={["rgba(255,215,0,0.12)", "rgba(255,215,0,0.04)"]} style={styles.statBox}>
            <Text style={styles.statNum}>{analytics.totalPrompts}</Text>
            <Text style={styles.statLabel}>Total Prompts</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(129,199,132,0.12)", "rgba(129,199,132,0.04)"]} style={styles.statBox}>
            <Text style={[styles.statNum, { color: "#81C784" }]}>{analytics.conversions}</Text>
            <Text style={styles.statLabel}>Conversions</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(79,195,247,0.12)", "rgba(79,195,247,0.04)"]} style={styles.statBox}>
            <Text style={[styles.statNum, { color: "#4FC3F7" }]}>{analytics.conversionRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </LinearGradient>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
          {/* Top Features Triggering Upgrades */}
          {analytics.topFeatures.length > 0 && (
            <GoldenCard>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="trending-up" size={18} color="#FFD700" />
                <Text style={styles.sectionTitle}>Top Features Triggering Prompts</Text>
              </View>
              {analytics.topFeatures.map((f, i) => {
                const maxCount = analytics.topFeatures[0]?.count || 1;
                return (
                  <View key={f.feature} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>{f.feature.replace(/_/g, " ")}</Text>
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={["#FFD700", "#FFA500"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.bar, { width: `${Math.max((f.count / maxCount) * 100, 8)}%` as any }]}
                      />
                    </View>
                    <Text style={styles.barCount}>{f.count}</Text>
                  </View>
                );
              })}
            </GoldenCard>
          )}

          {/* Screen Breakdown */}
          {screenBreakdown.length > 0 && (
            <GoldenCard>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="screen-search-desktop" size={18} color="#4FC3F7" />
                <Text style={styles.sectionTitle}>Prompts by Screen</Text>
              </View>
              {screenBreakdown.map(([screen, count]) => (
                <View key={screen} style={styles.screenRow}>
                  <View style={styles.screenDot} />
                  <Text style={styles.screenName}>{screen}</Text>
                  <Text style={styles.screenCount}>{count}</Text>
                </View>
              ))}
            </GoldenCard>
          )}

          {/* Recent Events */}
          {recentEvents.length > 0 && (
            <GoldenCard>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="history" size={18} color="#FFA500" />
                <Text style={styles.sectionTitle}>Recent Events</Text>
              </View>
              {recentEvents.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <MaterialIcons
                    name={event.converted ? "check-circle" : "radio-button-unchecked"}
                    size={14}
                    color={event.converted ? "#81C784" : "rgba(255,255,255,0.2)"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventFeature}>{event.feature.replace(/_/g, " ")}</Text>
                    <Text style={styles.eventMeta}>{event.screen} · {new Date(event.timestamp).toLocaleDateString()}</Text>
                  </View>
                  {event.converted && (
                    <View style={styles.convertedBadge}>
                      <Text style={styles.convertedText}>Converted</Text>
                    </View>
                  )}
                </View>
              ))}
            </GoldenCard>
          )}

          {/* Empty State */}
          {upgradePromptEvents.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="analytics" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyTitle}>No upgrade prompt data yet</Text>
              <Text style={styles.emptyText}>Analytics will appear here as users encounter upgrade prompts throughout the app.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 16 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.1)" },
  statNum: { fontSize: 24, fontWeight: "800", color: "#FFD700" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  barLabel: { width: 100, fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" },
  barContainer: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.05)", overflow: "hidden" },
  bar: { height: "100%", borderRadius: 4 },
  barCount: { width: 30, fontSize: 13, fontWeight: "700", color: "#FFD700", textAlign: "right" },
  screenRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.05)" },
  screenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4FC3F7" },
  screenName: { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" },
  screenCount: { fontSize: 14, fontWeight: "700", color: "#4FC3F7" },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.05)" },
  eventFeature: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", textTransform: "capitalize" },
  eventMeta: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  convertedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "rgba(129,199,132,0.12)" },
  convertedText: { fontSize: 11, fontWeight: "700", color: "#81C784" },
  emptyState: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", paddingHorizontal: 20 },
});
