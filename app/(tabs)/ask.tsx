import { useState, useCallback, useRef } from "react";
import { Text, View, TextInput, Pressable, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { StyleSheet } from "react-native";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";

type Tab = "ask" | "ideas";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface IdeaItem {
  title: string;
  description: string;
  relatedTopics: string[];
}

const SUGGESTED_QUESTIONS = [
  "What did I learn about marketing?",
  "Summarize my notes on investing.",
  "What are recurring themes in my notes?",
  "What knowledge gaps do I have?",
];

export default function AskScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("ask");
  const [question, setQuestion] = useState("");
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const queryMutation = trpc.ai.query.useMutation();
  const ideaMutation = trpc.ai.generateIdeas.useMutation();

  const handleAsk = useCallback(async (q?: string) => {
    const text = (q || question).trim();
    if (!text || loading) return;
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    try {
      const result = await queryMutation.mutateAsync({ question: text });
      const aiMsg: ChatMsg = { id: `a-${Date.now()}`, role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMsg = { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [question, loading, queryMutation]);

  const handleGenerateIdeas = useCallback(async () => {
    const text = ideaPrompt.trim();
    if (!text || loading) return;
    setLoading(true);
    try {
      const result = await ideaMutation.mutateAsync({ prompt: text });
      setIdeas(result.ideas);
    } catch {
      setIdeas([{ title: "Error", description: "Failed to generate ideas. Please try again.", relatedTopics: [] }]);
    } finally {
      setLoading(false);
    }
  }, [ideaPrompt, loading, ideaMutation]);

  const { isGuest } = useAppState();
  const isLoggedIn = isAuthenticated || isGuest;

  if (!isLoggedIn) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="sparkles" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to use AI features</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">AI Assistant</Text>
      </View>

      {/* Tutorial Tip */}
      <TutorialTip
        tipKey="ask_ai_intro"
        icon="sparkles"
        iconColor="#6C5CE7"
        title="Your AI Knowledge Assistant"
        message="Ask questions like 'What did I learn about marketing?' or 'Summarize my investing notes.' Generate ideas from your stored knowledge too!"
      />

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab("ask")}
          style={({ pressed }) => [
            styles.tabBtn,
            { borderBottomColor: tab === "ask" ? colors.primary : "transparent" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="sparkles" size={18} color={tab === "ask" ? colors.primary : colors.muted} />
          <Text style={{ color: tab === "ask" ? colors.primary : colors.muted, fontWeight: "600", fontSize: 15 }}>
            Ask AI
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("ideas")}
          style={({ pressed }) => [
            styles.tabBtn,
            { borderBottomColor: tab === "ideas" ? colors.primary : "transparent" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="lightbulb.fill" size={18} color={tab === "ideas" ? colors.primary : colors.muted} />
          <Text style={{ color: tab === "ideas" ? colors.primary : colors.muted, fontWeight: "600", fontSize: 15 }}>
            Ideas
          </Text>
        </Pressable>
      </View>

      {tab === "ask" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.msgBubble,
                  item.role === "user"
                    ? { backgroundColor: colors.primary, alignSelf: "flex-end" }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, alignSelf: "flex-start" },
                ]}
              >
                <Text
                  style={{
                    color: item.role === "user" ? "#fff" : colors.foreground,
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                >
                  {item.content}
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <IconSymbol name="sparkles" size={48} color={colors.primary + "40"} />
                <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>
                  Ask your knowledge base
                </Text>
                <Text style={[styles.emptyChatSubtitle, { color: colors.muted }]}>
                  Ask questions about your saved memories and I'll find relevant answers.
                </Text>
                <View style={styles.suggestedList}>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => handleAsk(q)}
                      style={({ pressed }) => [
                        styles.suggestedChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={{ color: colors.primary, fontSize: 14 }}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          />

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 13, marginLeft: 8 }}>Thinking...</Text>
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask about your memories..."
              placeholderTextColor={colors.muted}
              style={[styles.chatInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleAsk()}
            />
            <Pressable
              onPress={() => handleAsk()}
              disabled={!question.trim() || loading}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: question.trim() ? colors.primary : colors.muted + "40" },
                pressed && { opacity: 0.8 },
              ]}
            >
              <IconSymbol name="arrow.up.circle.fill" size={22} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Ideas Tab */
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Text style={[styles.ideaLabel, { color: colors.foreground }]}>
              Generate ideas based on your knowledge
            </Text>
            <View style={[styles.ideaInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                value={ideaPrompt}
                onChangeText={setIdeaPrompt}
                placeholder="e.g., Generate startup ideas based on my notes..."
                placeholderTextColor={colors.muted}
                style={[styles.ideaInput, { color: colors.foreground }]}
                multiline
                returnKeyType="done"
              />
              <Pressable
                onPress={handleGenerateIdeas}
                disabled={!ideaPrompt.trim() || loading}
                style={({ pressed }) => [
                  styles.generateBtn,
                  { backgroundColor: ideaPrompt.trim() ? colors.primary : colors.muted + "40" },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="lightbulb.fill" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>

          <FlatList
            data={ideas}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => (
              <View style={[styles.ideaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.ideaHeader}>
                  <View style={[styles.ideaNumber, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{item.title}</Text>
                </View>
                <Text style={[styles.ideaDesc, { color: colors.muted }]}>{item.description}</Text>
                {item.relatedTopics?.length > 0 && (
                  <View style={styles.ideaTopics}>
                    {item.relatedTopics.map((t) => (
                      <View key={t} style={[styles.ideaTag, { backgroundColor: colors.accent + "20" }]}>
                        <Text style={{ fontSize: 11, color: colors.accent }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyIdeas}>
                  <IconSymbol name="lightbulb.fill" size={40} color={colors.muted + "60"} />
                  <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center", marginTop: 8 }}>
                    Enter a prompt above and AI will generate ideas based on your stored knowledge.
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
  },
  msgBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyChatTitle: { fontSize: 18, fontWeight: "600" },
  emptyChatSubtitle: { fontSize: 14, textAlign: "center" },
  suggestedList: { gap: 8, marginTop: 16, width: "100%" },
  suggestedChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ideaLabel: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  ideaInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  ideaInput: { flex: 1, fontSize: 15, paddingVertical: 8, maxHeight: 80 },
  generateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  ideaCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  ideaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  ideaNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ideaTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  ideaDesc: { fontSize: 14, lineHeight: 20 },
  ideaTopics: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  ideaTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  emptyIdeas: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
});
