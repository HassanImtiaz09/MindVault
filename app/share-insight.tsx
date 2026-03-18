import { useState, useRef, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, StyleSheet, Share, Platform } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppState } from "@/lib/app-state";

const CARD_THEMES = [
  { id: "gold", name: "Gold", bg: ["#1A1400", "#0A0E1A"], accent: "#FFD700", textColor: "#FFFFFF" },
  { id: "ocean", name: "Ocean", bg: ["#001A2C", "#0A0E1A"], accent: "#4FC3F7", textColor: "#FFFFFF" },
  { id: "sunset", name: "Sunset", bg: ["#2A0A00", "#0A0E1A"], accent: "#FF6B6B", textColor: "#FFFFFF" },
  { id: "forest", name: "Forest", bg: ["#001A0A", "#0A0E1A"], accent: "#81C784", textColor: "#FFFFFF" },
  { id: "purple", name: "Violet", bg: ["#1A0028", "#0A0E1A"], accent: "#BB86FC", textColor: "#FFFFFF" },
];

export default function ShareInsightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; insight?: string; topic?: string }>();
  const { subscription, canUseFeature, trackUpgradePrompt } = useAppState();

  const [title, setTitle] = useState(params.title || "My Insight");
  const [insightText, setInsightText] = useState(params.insight || "");
  const [topic, setTopic] = useState(params.topic || "");
  const [selectedTheme, setSelectedTheme] = useState("gold");
  const [showBranding, setShowBranding] = useState(true);

  const theme = CARD_THEMES.find((t) => t.id === selectedTheme) || CARD_THEMES[0];

  const handleShare = useCallback(async () => {
    const cardText = `${title}\n\n"${insightText}"\n\n${topic ? `Topic: ${topic}\n` : ""}${showBranding ? "\nShared via MindVault" : ""}`;

    try {
      if (Platform.OS === "web") {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(cardText);
          Alert.alert("Copied!", "Insight card text copied to clipboard.");
        }
      } else {
        await Share.share({
          message: cardText,
          title: title,
        });
      }
    } catch {
      Alert.alert("Error", "Could not share the insight card.");
    }
  }, [title, insightText, topic, showBranding]);

  return (
    <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Share Insight</Text>
        <Pressable onPress={handleShare} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="share" size={22} color="#FFD700" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Card Preview */}
        <View style={styles.previewContainer}>
          <LinearGradient
            colors={theme.bg as [string, string]}
            style={styles.cardPreview}
          >
            <View style={[styles.cardAccentLine, { backgroundColor: theme.accent }]} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.accent }]}>{title || "Untitled"}</Text>
              <Text style={[styles.cardInsight, { color: theme.textColor }]}>
                {insightText ? `"${insightText}"` : "Enter your insight text below..."}
              </Text>
              {topic ? (
                <View style={[styles.cardTopic, { borderColor: `${theme.accent}30` }]}>
                  <MaterialIcons name="lightbulb" size={12} color={theme.accent} />
                  <Text style={[styles.cardTopicText, { color: `${theme.accent}CC` }]}>{topic}</Text>
                </View>
              ) : null}
              {showBranding && (
                <View style={styles.cardBranding}>
                  <MaterialIcons name="auto-awesome" size={10} color="rgba(255,255,255,0.25)" />
                  <Text style={styles.cardBrandingText}>MindVault</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Edit Fields */}
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <GoldenCard>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Give your insight a title"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.input}
            />
          </GoldenCard>

          <GoldenCard>
            <Text style={styles.fieldLabel}>Insight</Text>
            <TextInput
              value={insightText}
              onChangeText={setInsightText}
              placeholder="The key insight or quote to share..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />
          </GoldenCard>

          <GoldenCard>
            <Text style={styles.fieldLabel}>Topic (optional)</Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g., Marketing, AI, Leadership"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.input}
            />
          </GoldenCard>

          {/* Theme Selector */}
          <GoldenCard>
            <Text style={styles.fieldLabel}>Card Theme</Text>
            <View style={styles.themeRow}>
              {CARD_THEMES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedTheme(t.id)}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <LinearGradient
                    colors={t.bg as [string, string]}
                    style={[
                      styles.themeChip,
                      { borderColor: selectedTheme === t.id ? t.accent : "rgba(255,255,255,0.1)" },
                    ]}
                  >
                    <View style={[styles.themeDot, { backgroundColor: t.accent }]} />
                    <Text style={{ fontSize: 12, color: selectedTheme === t.id ? t.accent : "rgba(255,255,255,0.4)" }}>{t.name}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </GoldenCard>

          {/* Branding Toggle */}
          <GoldenCard>
            <Pressable
              onPress={() => setShowBranding(!showBranding)}
              style={({ pressed }) => [styles.brandingToggle, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name={showBranding ? "check-box" : "check-box-outline-blank"} size={22} color="#FFD700" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandingLabel}>Show MindVault Branding</Text>
                <Text style={styles.brandingDesc}>Include "Shared via MindVault" on the card</Text>
              </View>
            </Pressable>
          </GoldenCard>

          {/* Share Button */}
          <GoldenButton
            title="SHARE INSIGHT CARD"
            onPress={handleShare}
            icon="share"
            variant="primary"
          />
        </View>
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  previewContainer: { padding: 20, alignItems: "center" },
  cardPreview: {
    width: "100%", maxWidth: 340, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.15)",
  },
  cardAccentLine: { height: 3, width: "100%" },
  cardContent: { padding: 24, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  cardInsight: { fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  cardTopic: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start" },
  cardTopicText: { fontSize: 12, fontWeight: "600" },
  cardBranding: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardBrandingText: { fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "600", letterSpacing: 0.5 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)", backgroundColor: "rgba(8,12,28,0.88)",
    fontSize: 15, color: "#FFFFFF",
  },
  themeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  themeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, gap: 6 },
  themeDot: { width: 10, height: 10, borderRadius: 5 },
  brandingToggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandingLabel: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  brandingDesc: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 },
});
