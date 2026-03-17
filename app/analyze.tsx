import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert, Share, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";

const ANALYSIS_TYPES = [
  { key: "summary", label: "General Summary", icon: "article" as any, color: "#6C5CE7", description: "Comprehensive summary in simple terms" },
  { key: "contract", label: "Contract Review", icon: "description" as any, color: "#FF6B6B", description: "Key terms, obligations, and risks" },
  { key: "medical", label: "Medical Report", icon: "favorite" as any, color: "#00D2D3", description: "Lab results, prescriptions explained" },
  { key: "financial", label: "Financial Analysis", icon: "bar-chart" as any, color: "#00B894", description: "Key figures and what they mean" },
  { key: "research", label: "Research Analysis", icon: "menu-book" as any, color: "#FDCB6E", description: "Findings, methodology, conclusions" },
];

export default function AnalyzeScreen() {
  const router = useRouter();
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const id = parseInt(memoryId || "0", 10);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeMutation = trpc.ai.analyzeDocument.useMutation();

  const handleAnalyze = useCallback(async (type: string) => {
    setSelectedType(type);
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeMutation.mutateAsync({
        memoryId: id,
        analysisType: type as any,
      });
      setAnalysis(result.analysis);
    } catch {
      Alert.alert("Error", "Failed to analyze document. Please try again.");
    }
    setLoading(false);
  }, [id, analyzeMutation]);

  const handleShare = useCallback(async () => {
    if (!analysis) return;
    try {
      await Share.share({ message: analysis, title: "Document Analysis - MindVault" });
    } catch {}
  }, [analysis]);

  return (
    <CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Document Analysis</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Analysis Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#FFFFFF" }]}>Choose Analysis Type</Text>
          <Text style={[styles.sectionSubtitle, { color: "rgba(255,255,255,0.7)" }]}>
            Select how you want AI to analyze this document
          </Text>
          <View style={styles.typeGrid}>
            {ANALYSIS_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => handleAnalyze(type.key)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.typeCard,
                  {
                    backgroundColor: selectedType === type.key ? type.color + "15" : "rgba(255,255,255,0.04)",
                    borderColor: selectedType === type.key ? type.color + "40" : "rgba(255,215,0,0.12)",
                  },
                  pressed && { opacity: 0.7 },
                  loading && { opacity: 0.5 },
                ]}
              >
                <View style={[styles.typeIconBox, { backgroundColor: type.color + "20" }]}>
                  <MaterialIcons name={type.icon} size={22} color={type.color} />
                </View>
                <Text style={[styles.typeLabel, { color: "#FFFFFF" }]}>{type.label}</Text>
                <Text style={[styles.typeDesc, { color: "rgba(255,255,255,0.7)" }]}>{type.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={"#FFD700"} />
            <Text style={[styles.loadingText, { color: "rgba(255,255,255,0.7)" }]}>Analyzing document...</Text>
            <Text style={[styles.loadingHint, { color: "rgba(255,255,255,0.7)" }]}>
              AI is reading and interpreting your document. This may take a moment.
            </Text>
          </View>
        )}

        {/* Analysis Result */}
        {analysis && !loading && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleRow}>
                <MaterialIcons name={"auto-awesome" as any} size={18} color={"#FFD700"} />
                <Text style={[styles.resultTitle, { color: "#FFD700" }]}>Analysis Result</Text>
              </View>
              <Pressable onPress={handleShare} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <MaterialIcons name={"share" as any} size={18} color={"#FFD700"} />
              </Pressable>
            </View>
            <View style={[styles.resultCard, { backgroundColor: "rgba(8,12,28,0.88)", borderColor: "rgba(255,215,0,0.22)" }]}>
              <Text style={[styles.resultText, { color: "#FFFFFF" }]}>{analysis}</Text>
            </View>
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
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  typeGrid: { gap: 10 },
  typeCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { fontSize: 15, fontWeight: "600" },
  typeDesc: { fontSize: 12, flex: 1 },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  loadingText: { fontSize: 16, fontWeight: "600" },
  loadingHint: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultTitle: { fontSize: 16, fontWeight: "700" },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultText: { fontSize: 15, lineHeight: 23 },
});
