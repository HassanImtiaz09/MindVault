import { useState, useCallback, useRef } from "react";
import { Text, View, TextInput, Pressable, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import { TooltipBubble } from "@/components/tooltip-bubble";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useAppState } from "@/lib/app-state";

type Tab = "ask" | "ideas";
interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }
interface IdeaItem { title: string; description: string; relatedTopics: string[]; }

const SUGGESTED = [
  "What did I learn about marketing?",
  "Summarize my notes on investing.",
  "What are recurring themes in my notes?",
  "What knowledge gaps do I have?",
];

export default function AskScreen() {
  const { isAuthenticated } = useAuth();
  const { isGuest } = useAppState();
  const [tab, setTab] = useState<Tab>("ask");
  const [question, setQuestion] = useState("");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const queryMutation = trpc.ai.query.useMutation();
  const ideaMutation = trpc.ai.generateIdeas.useMutation();
  const isLoggedIn = isAuthenticated || isGuest;

  const handleAsk = useCallback(async (q?: string) => {
    const text = (q || question).trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setQuestion("");
    setLoading(true);
    try {
      const result = await queryMutation.mutateAsync({ question: text });
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: result.answer }]);
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally { setLoading(false); }
  }, [question, loading, queryMutation]);

  const handleGenerateIdeas = useCallback(async () => {
    const text = ideaPrompt.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const result = await ideaMutation.mutateAsync({ prompt: text });
      setIdeas(result.ideas);
    } catch {
      setIdeas([{ title: "Error", description: "Failed to generate ideas.", relatedTopics: [] }]);
    } finally { setLoading(false); }
  }, [ideaPrompt, loading, ideaMutation]);

  if (!isLoggedIn) {
    return (
      <CinematicScreen screenName="ask">
        <View style={styles.centerFull}>
          <MaterialIcons name="auto-awesome" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.loginText}>Sign in to use AI features</Text>
        </View>
      </CinematicScreen>
    );
  }

  return (
    <CinematicScreen screenName="ask">
      <View style={styles.header}>
        <GoldenText variant="title" style={{ textAlign: "left" }}>AI Assistant</GoldenText>
      </View>

      <TooltipBubble tipId="ask_question" text="Ask questions like 'What did I learn about marketing?' or generate ideas from your stored knowledge!" position="bottom" arrowSide="center" />

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {[
          { key: "ask" as Tab, label: "Ask AI", icon: "auto-awesome" },
          { key: "ideas" as Tab, label: "Ideas", icon: "lightbulb" },
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

      {tab === "ask" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.msgBubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
                {item.role === "assistant" && <MaterialIcons name="auto-awesome" size={14} color="#FFD700" style={{ marginBottom: 4 }} />}
                <Text style={{ color: item.role === "user" ? "#0A0E1A" : "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <MaterialIcons name="auto-awesome" size={48} color="rgba(255,215,0,0.2)" />
                <Text style={styles.emptyChatTitle}>Ask your knowledge base</Text>
                <Text style={styles.emptyChatSub}>Ask questions about your saved memories and I'll find relevant answers.</Text>
                <View style={styles.suggestedList}>
                  {SUGGESTED.map((q) => (
                    <Pressable key={q} onPress={() => handleAsk(q)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                      <GoldenCard style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                        <Text style={{ color: "#FFD700", fontSize: 14 }}>{q}</Text>
                      </GoldenCard>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginLeft: 8 }}>Thinking...</Text>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about your memories..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.chatInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleAsk()}
            />
            <Pressable
              onPress={() => handleAsk()}
              disabled={!question.trim() || loading}
              style={({ pressed }) => [pressed && { opacity: 0.8 }]}
            >
              <LinearGradient
                colors={question.trim() ? ["#FFD700", "#FFA500"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                style={styles.sendBtn}
              >
                <MaterialIcons name="arrow-upward" size={20} color={question.trim() ? "#0A0E1A" : "rgba(255,255,255,0.3)"} />
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Text style={styles.ideaLabel}>Generate ideas based on your knowledge</Text>
            <View style={styles.ideaInputRow}>
              <TextInput
                value={ideaPrompt}
                onChangeText={setIdeaPrompt}
                placeholder="e.g., Generate startup ideas based on my notes..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.ideaInput}
                multiline
                returnKeyType="done"
              />
              <Pressable onPress={handleGenerateIdeas} disabled={!ideaPrompt.trim() || loading} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
                <LinearGradient
                  colors={ideaPrompt.trim() ? ["#FFD700", "#FFA500"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.generateBtn}
                >
                  {loading ? <ActivityIndicator size="small" color="#0A0E1A" /> : <MaterialIcons name="lightbulb" size={20} color={ideaPrompt.trim() ? "#0A0E1A" : "rgba(255,255,255,0.3)"} />}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <FlatList
            data={ideas}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => (
              <GoldenCard>
                <View style={styles.ideaHeader}>
                  <LinearGradient colors={["rgba(255,215,0,0.15)", "rgba(255,165,0,0.08)"]} style={styles.ideaNumber}>
                    <Text style={styles.ideaNumberText}>{index + 1}</Text>
                  </LinearGradient>
                  <Text style={styles.ideaTitle}>{item.title}</Text>
                </View>
                <Text style={styles.ideaDesc}>{item.description}</Text>
                {item.relatedTopics?.length > 0 && (
                  <View style={styles.ideaTopics}>
                    {item.relatedTopics.map((t) => (
                      <View key={t} style={styles.ideaTag}>
                        <Text style={{ fontSize: 11, color: "#FFD700" }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </GoldenCard>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyIdeas}>
                  <MaterialIcons name="lightbulb-outline" size={40} color="rgba(255,215,0,0.2)" />
                  <Text style={styles.emptyIdeasText}>Enter a prompt above and AI will generate ideas based on your stored knowledge.</Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  loginText: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,215,0,0.08)" },
  tabBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 6, borderBottomWidth: 2 },
  msgBubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#FFD700" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "rgba(15,20,40,0.90)", borderWidth: 1, borderColor: "rgba(255,215,0,0.22)" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, gap: 8 },
  emptyChatTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  emptyChatSub: { fontSize: 14, textAlign: "center", color: "rgba(255,255,255,0.7)" },
  suggestedList: { gap: 8, marginTop: 16, width: "100%" },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: "rgba(255,215,0,0.08)", gap: 8 },
  chatInput: { flex: 1, fontSize: 15, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", color: "#FFFFFF", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  ideaLabel: { fontSize: 15, fontWeight: "600", marginBottom: 10, color: "rgba(255,255,255,0.8)" },
  ideaInputRow: { flexDirection: "row", alignItems: "flex-end", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", paddingLeft: 14, paddingRight: 6, paddingVertical: 6, gap: 8 },
  ideaInput: { flex: 1, fontSize: 15, paddingVertical: 8, maxHeight: 80, color: "#FFFFFF" },
  generateBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  ideaHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  ideaNumber: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ideaNumberText: { fontSize: 14, fontWeight: "800", color: "#FFD700" },
  ideaTitle: { fontSize: 16, fontWeight: "600", flex: 1, color: "#FFFFFF" },
  ideaDesc: { fontSize: 14, lineHeight: 20, marginTop: 8, color: "rgba(255,255,255,0.75)" },
  ideaTopics: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  ideaTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "rgba(255,215,0,0.1)" },
  emptyIdeas: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIdeasText: { color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center", marginTop: 8 },
});
