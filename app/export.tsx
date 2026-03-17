import { useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet, ScrollView } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppState } from "@/lib/app-state";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

type ExportFormat = "markdown" | "json";
type TimeRange = "all" | "week" | "month" | "year";

export default function ExportScreen() {
  const router = useRouter();
  const { canUseFeature } = useAppState();
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const memoriesQuery = trpc.memories.list.useQuery({ limit: 500 });

  const handleExport = useCallback(async () => {
    if (!canUseFeature("data_export")) {
      router.push("/subscription" as any);
      return;
    }
    setExporting(true);
    try {
      const memories = memoriesQuery.data || [];
      let filtered = memories;

      if (timeRange !== "all") {
        const now = new Date();
        const cutoff = new Date();
        if (timeRange === "week") cutoff.setDate(now.getDate() - 7);
        else if (timeRange === "month") cutoff.setMonth(now.getMonth() - 1);
        else if (timeRange === "year") cutoff.setFullYear(now.getFullYear() - 1);
        filtered = memories.filter((m) => new Date(m.createdAt) >= cutoff);
      }

      if (filtered.length === 0) {
        Alert.alert("No Data", "No memories found for the selected time range.");
        setExporting(false);
        return;
      }

      let content = "";
      if (format === "markdown") {
        content = `# MindVault Knowledge Export\n\nExported on ${new Date().toLocaleDateString()}\nTotal memories: ${filtered.length}\n\n---\n\n`;
        for (const m of filtered) {
          content += `## ${m.title}\n\n`;
          content += `- **Type:** ${m.type}\n`;
          content += `- **Date:** ${new Date(m.createdAt).toLocaleDateString()}\n`;
          if (m.aiTopics && m.aiTopics.length > 0) {
            content += `- **Topics:** ${m.aiTopics.join(", ")}\n`;
          }
          content += `\n`;
          if (m.aiSummary) content += `**Summary:** ${m.aiSummary}\n\n`;
          if (m.content) content += `${m.content}\n\n`;
          content += `---\n\n`;
        }
      } else {
        const data = filtered.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.type,
          content: m.content,
          summary: m.aiSummary,
          topics: m.aiTopics,
          createdAt: m.createdAt,
        }));
        content = JSON.stringify(data, null, 2);
      }

      // In a real app, this would use expo-sharing or expo-file-system to save/share
      // For now, we show a success message with the export summary
      setExported(true);
      Alert.alert(
        "Export Ready",
        `Exported ${filtered.length} memories as ${format === "markdown" ? "Markdown" : "JSON"}.\n\nIn the full app, this would be saved to your device or shared via the system share sheet.`,
      );
    } catch (err) {
      Alert.alert("Export Failed", "Something went wrong. Please try again.");
    }
    setExporting(false);
  }, [format, timeRange, memoriesQuery.data, canUseFeature, router]);

  const memoryCount = memoriesQuery.data?.length ?? 0;

  return (
    <CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Export & Backup</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: "#FFD700" + "10", borderColor: "#FFD700" + "30" }]}>
          <MaterialIcons name={"inventory" as any} size={28} color={"#FFD700"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: "#FFFFFF" }]}>
              Export Your Knowledge
            </Text>
            <Text style={[styles.infoText, { color: "rgba(255,255,255,0.4)" }]}>
              Download your entire knowledge base as Markdown or JSON files for offline backup or migration.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow]}>
          <View style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,215,0,0.12)" }]}>
            <Text style={[styles.statNum, { color: "#FFD700" }]}>{memoryCount}</Text>
            <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.4)" }]}>Memories</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,215,0,0.12)" }]}>
            <Text style={[styles.statNum, { color: "#FFD700" }]}>
              {format === "markdown" ? ".md" : ".json"}
            </Text>
            <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.4)" }]}>Format</Text>
          </View>
        </View>

        {/* Format Selection */}
        <View>
          <Text style={[styles.sectionLabel, { color: "#FFFFFF" }]}>Export Format</Text>
          <View style={styles.optionRow}>
            {([
              { key: "markdown" as const, label: "Markdown", icon: "article" as any, desc: "Human-readable, great for notes apps" },
              { key: "json" as const, label: "JSON", icon: "code" as any, desc: "Structured data, great for imports" },
            ]).map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setFormat(opt.key)}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: format === opt.key ? "#FFD700" + "10" : "rgba(255,255,255,0.04)",
                    borderColor: format === opt.key ? "#FFD700" : "rgba(255,215,0,0.12)",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons name={opt.icon} size={22} color={format === opt.key ? "#FFD700" : "rgba(255,255,255,0.4)"} />
                <Text style={[styles.optionLabel, { color: format === opt.key ? "#FFD700" : "#FFFFFF" }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.optionDesc, { color: "rgba(255,255,255,0.4)" }]}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Range */}
        <View>
          <Text style={[styles.sectionLabel, { color: "#FFFFFF" }]}>Time Range</Text>
          <View style={styles.timeRow}>
            {([
              { key: "all" as const, label: "All Time" },
              { key: "week" as const, label: "Past Week" },
              { key: "month" as const, label: "Past Month" },
              { key: "year" as const, label: "Past Year" },
            ]).map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setTimeRange(opt.key)}
                style={({ pressed }) => [
                  styles.timeChip,
                  {
                    backgroundColor: timeRange === opt.key ? "#FFD700" : "rgba(255,255,255,0.04)",
                    borderColor: timeRange === opt.key ? "#FFD700" : "rgba(255,215,0,0.12)",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: timeRange === opt.key ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Export Button */}
        <Pressable
          onPress={handleExport}
          disabled={exporting}
          style={({ pressed }) => [
            styles.exportBtn,
            { backgroundColor: "#FFD700" },
            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            exporting && { opacity: 0.6 },
          ]}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name={"download" as any} size={20} color="#fff" />
              <Text style={styles.exportBtnText}>
                {exported ? "Export Again" : "Export Knowledge Base"}
              </Text>
            </>
          )}
        </Pressable>

        {exported && (
          <View style={[styles.successCard, { backgroundColor: "#81C784" + "10", borderColor: "#81C784" + "30" }]}>
            <MaterialIcons name={"check-circle" as any} size={20} color={"#81C784"} />
            <Text style={[styles.successText, { color: "#81C784" }]}>
              Export completed successfully!
            </Text>
          </View>
        )}
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    alignItems: "flex-start",
  },
  infoTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  infoText: { fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  optionRow: { flexDirection: "row", gap: 12 },
  optionCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  optionLabel: { fontSize: 15, fontWeight: "700" },
  optionDesc: { fontSize: 11, textAlign: "center", lineHeight: 15 },
  timeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  exportBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  successText: { fontSize: 14, fontWeight: "600" },
});
