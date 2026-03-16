import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { useState } from "react";

type GuideSection = {
  icon: any;
  iconColor: string;
  title: string;
  content: string[];
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: "rocket.fill",
    iconColor: "#6C5CE7",
    title: "Getting Started",
    content: [
      "Welcome to MindVault! Here's how to make the most of your AI-powered second brain.",
      "1. Capture: Tap the Capture tab to save text notes, images, voice memos, PDFs, or web links.",
      "2. Library: Browse all your saved memories, search by keyword, and filter by type.",
      "3. Ask AI: Ask natural language questions about your stored knowledge.",
      "4. Insights: View weekly summaries, knowledge graphs, and topic analytics.",
    ],
  },
  {
    icon: "plus.circle.fill",
    iconColor: "#00D2D3",
    title: "Capturing Memories",
    content: [
      "Text Notes: Quickly jot down ideas, meeting notes, or thoughts.",
      "Images & Screenshots: Upload photos or screenshots — AI extracts text and key info automatically.",
      "Voice Recordings: Record voice memos that AI transcribes into searchable text.",
      "Documents: Upload PDFs and DOCX files for AI summarization and analysis.",
      "Web Links: Save article URLs with notes — AI extracts key information.",
      "Tip: Use the quick capture bar on the Home screen for fastest access.",
    ],
  },
  {
    icon: "scanner.fill",
    iconColor: "#FF6B6B",
    title: "Document Analysis",
    content: [
      "Upload contracts, prescriptions, blood reports, or any document for AI analysis.",
      "The AI reads the document and generates a plain-language summary.",
      "Key terms, dates, amounts, and important details are highlighted.",
      "Use this for: Legal contracts, medical reports, financial statements, academic papers.",
      "Pro tip: Upload multiple related documents to a folder for comprehensive analysis.",
    ],
  },
  {
    icon: "sparkles",
    iconColor: "#FDCB6E",
    title: "Asking AI Questions",
    content: [
      "Go to the Ask AI tab and type any question about your stored knowledge.",
      "Example questions:",
      '• "What did I learn about marketing last month?"',
      '• "Summarize my notes on investing."',
      '• "What are the key terms in my rental contract?"',
      '• "Compare the insights from my last 3 uploaded reports."',
      "The AI searches your entire knowledge base and generates structured answers with citations.",
    ],
  },
  {
    icon: "doc.text.fill",
    iconColor: "#00B894",
    title: "Generating Reports",
    content: [
      "Ask the AI to generate reports based on your uploaded documents.",
      "Supported report types:",
      "• Summary reports of all documents in a folder",
      "• Market research analysis from attached industry documents",
      "• Comparison reports between multiple documents",
      "• Trend analysis from your knowledge over time",
      "Export any report as PDF for sharing with colleagues.",
    ],
  },
  {
    icon: "folder.fill",
    iconColor: "#6C5CE7",
    title: "Using Folders",
    content: [
      "Create folders to organize memories by project, topic, or category.",
      "Assign memories to folders when capturing or from the Library.",
      "Use folder-specific analysis to focus AI on a particular topic.",
      "Example: Create a 'Health' folder for medical reports, a 'Work' folder for meeting notes.",
      "AI can analyze all contents of a folder to identify patterns and insights.",
    ],
  },
  {
    icon: "star.fill",
    iconColor: "#FDCB6E",
    title: "Favorites & Organization",
    content: [
      "Star important memories to mark them as favorites.",
      "Favorites appear prominently on your Home screen.",
      "AI gives extra weight to favorited memories when answering questions.",
      "Use favorites to highlight your most valuable insights and references.",
    ],
  },
  {
    icon: "chart.bar.fill",
    iconColor: "#00D2D3",
    title: "Weekly Summaries & Insights",
    content: [
      "Every week, MindVault generates an AI summary of your new knowledge.",
      "The summary includes: new insights, recurring themes, and knowledge gaps.",
      "The Knowledge Graph shows visual connections between your topics.",
      "Use the Insights tab to track your learning progress over time.",
      "Enable push notifications to receive your weekly summary automatically.",
    ],
  },
  {
    icon: "square.and.arrow.up",
    iconColor: "#FF6B6B",
    title: "Sharing & Export",
    content: [
      "Export individual memories or weekly summaries as PDF documents.",
      "Share memories via the system share sheet (email, messages, etc.).",
      "Use the share button on any memory detail screen.",
      "Pro users can generate formatted reports for professional sharing.",
    ],
  },
  {
    icon: "bell.fill",
    iconColor: "#D4A017",
    title: "Smart Reminders",
    content: [
      "AI automatically detects action items in your notes (e.g., 'follow up with John on Tuesday').",
      "Smart reminders are created from your content — no manual setup needed.",
      "View and manage all reminders from the Reminders screen.",
      "Get push notifications so you never miss a follow-up.",
      "Pro feature: Unlimited smart reminders with priority levels.",
    ],
  },
  {
    icon: "person.2.fill",
    iconColor: "#3498DB",
    title: "Collaborative Folders",
    content: [
      "Share folders with team members for collaborative knowledge bases.",
      "Set role-based access: Viewer (read-only) or Editor (full access).",
      "Invite collaborators by email to join your shared folders.",
      "All collaborators can search and query the shared knowledge.",
      "Pro feature: Unlimited collaborators and shared folders.",
    ],
  },
  {
    icon: "sun.max.fill",
    iconColor: "#E67E22",
    title: "Daily Digest",
    content: [
      "Every morning, MindVault surfaces the most relevant memory or insight.",
      "The Daily Digest is based on what you've been focusing on recently.",
      "Find it on your Home screen — a quick way to revisit key knowledge.",
      "Tap the digest to explore related memories and dive deeper.",
    ],
  },
  {
    icon: "scope",
    iconColor: "#00C9A7",
    title: "Focus Mode",
    content: [
      "Pair a timer with a specific folder for deep-work sessions.",
      "Everything you capture during Focus Mode is automatically tagged.",
      "Track how many memories you captured per session.",
      "Great for research sprints, study sessions, or brainstorming.",
      "Access Focus Mode from the Home screen Quick Actions.",
    ],
  },
];

export default function GuideScreen() {
  const colors = useColors();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <GlassScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>User Guide</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.intro}>
          <IconSymbol name="questionmark.circle.fill" size={36} color={colors.primary} />
          <Text style={[styles.introTitle, { color: colors.foreground }]}>How to Use MindVault</Text>
          <Text style={[styles.introSubtitle, { color: colors.muted }]}>
            Tap any section below to learn more about each feature
          </Text>
        </View>

        {GUIDE_SECTIONS.map((section, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={index} style={{ marginHorizontal: 20, marginBottom: 8 }}>
              <Pressable
                onPress={() => setExpandedIndex(isExpanded ? null : index)}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isExpanded ? colors.primary : colors.border,
                    borderWidth: isExpanded ? 1.5 : 1,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.sectionIcon, { backgroundColor: section.iconColor + "18" }]}>
                  <IconSymbol name={section.icon} size={20} color={section.iconColor} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
                <IconSymbol
                  name={isExpanded ? "chevron.right" : "chevron.right"}
                  size={16}
                  color={colors.muted}
                  style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
                />
              </Pressable>
              {isExpanded && (
                <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {section.content.map((line, i) => (
                    <Text key={i} style={[styles.contentLine, { color: colors.foreground }]}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </GlassScreen>
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
  intro: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  introTitle: { fontSize: 22, fontWeight: "700" },
  introSubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  sectionContent: {
    padding: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 8,
  },
  contentLine: {
    fontSize: 14,
    lineHeight: 21,
  },
});
