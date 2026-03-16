import { View, Text, Pressable, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";

export function DailyDigestWidget() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { getLatestDigest, dailyDigestEnabled, canUseFeature } = useAppState();

  const digest = getLatestDigest();
  const cardBg = isDark ? "rgba(20,35,28,0.55)" : "rgba(255,255,255,0.45)";
  const cardBorder = isDark ? "rgba(212,160,23,0.2)" : "rgba(212,160,23,0.25)";

  // Show sample digest if none exists yet
  const displayDigest = digest || {
    date: new Date().toISOString(),
    topMemory: null,
    insight: "Start capturing memories and your Daily Digest will appear here each morning with personalized insights.",
    focusTopic: "Getting Started",
    memoriesCount: 0,
    generated: false,
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBg, { backgroundColor: "#D4A017" + "18" }]}>
          <IconSymbol name="sun.max.fill" size={18} color="#D4A017" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: "#D4A017" }]}>Daily Digest</Text>
          <Text style={[styles.date, { color: colors.muted }]}>
            {new Date(displayDigest.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </View>
        {!canUseFeature("daily_digest") && (
          <View style={[styles.proBadge, { backgroundColor: "#D4A017" + "15" }]}>
            <IconSymbol name="crown.fill" size={10} color="#D4A017" />
            <Text style={{ color: "#D4A017", fontSize: 10, fontWeight: "700" }}>PRO</Text>
          </View>
        )}
      </View>

      {/* Focus topic */}
      <View style={[styles.focusRow, { backgroundColor: "#00C9A7" + "10" }]}>
        <IconSymbol name="scope" size={14} color="#00C9A7" />
        <Text style={[styles.focusText, { color: "#00C9A7" }]}>Focus: {displayDigest.focusTopic}</Text>
      </View>

      {/* Insight */}
      <Text style={[styles.insight, { color: colors.foreground }]} numberOfLines={3}>
        {displayDigest.insight}
      </Text>

      {/* Top memory preview */}
      {displayDigest.topMemory && (
        <Pressable
          onPress={() => router.push(`/memory/${displayDigest.topMemory!.id}` as any)}
          style={({ pressed }) => [styles.memoryPreview, { backgroundColor: isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.04)" }, pressed && { opacity: 0.7 }]}
        >
          <IconSymbol name="star.fill" size={14} color="#D4A017" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.memoryTitle, { color: colors.foreground }]} numberOfLines={1}>{displayDigest.topMemory.title}</Text>
            <Text style={[styles.memorySummary, { color: colors.muted }]} numberOfLines={1}>{displayDigest.topMemory.summary}</Text>
          </View>
          <IconSymbol name="chevron.right" size={14} color={colors.muted} />
        </Pressable>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#00C9A7" }]}>{displayDigest.memoriesCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>new today</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: cardBorder }]} />
        <Pressable
          onPress={() => router.push("/insights" as any)}
          style={({ pressed }) => [styles.viewMore, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.viewMoreText, { color: "#D4A017" }]}>View Insights</Text>
          <IconSymbol name="arrow.right" size={12} color="#D4A017" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 12 },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  focusText: { fontSize: 13, fontWeight: "600" },
  insight: { fontSize: 14, lineHeight: 20 },
  memoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  memoryTitle: { fontSize: 13, fontWeight: "600" },
  memorySummary: { fontSize: 12, marginTop: 1 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  statNumber: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  divider: { width: 1, height: 16, marginHorizontal: 12 },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  viewMoreText: { fontSize: 13, fontWeight: "600" },
});
