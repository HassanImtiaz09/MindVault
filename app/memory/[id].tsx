import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert, Share, StyleSheet } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";
import { loadFolders, saveFolders, Folder } from "../folders";

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  text: { icon: "text.alignleft", color: "#00C9A7", label: "Text Note" },
  image: { icon: "photo.fill", color: "#D4A017", label: "Image" },
  voice: { icon: "mic.fill", color: "#E74C3C", label: "Voice Recording" },
  document: { icon: "doc.fill", color: "#3498DB", label: "Document" },
  link: { icon: "globe", color: "#1ABC9C", label: "Web Link" },
};

export default function MemoryDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memoryId = parseInt(id || "0", 10);
  const [deleting, setDeleting] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const {
    isFavorite, toggleFavorite, canUseFeature,
    tags, getMemoryTags, addTagToMemory, removeTagFromMemory,
  } = useAppState();

  const memoryQuery = trpc.memories.get.useQuery({ id: memoryId }, { enabled: memoryId > 0 });
  const deleteMutation = trpc.memories.delete.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    loadFolders().then(setFolders);
  }, []);

  const fav = isFavorite(memoryId);
  const memTags = getMemoryTags(memoryId);

  const handleDelete = () => {
    Alert.alert("Delete Memory", "Are you sure you want to delete this memory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteMutation.mutateAsync({ id: memoryId });
            utils.memories.list.invalidate();
            utils.memories.recent.invalidate();
            utils.memories.stats.invalidate();
            router.back();
          } catch {
            Alert.alert("Error", "Failed to delete memory.");
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleShare = useCallback(async () => {
    const memory = memoryQuery.data;
    if (!memory) return;
    const shareContent = [
      memory.title,
      "",
      memory.aiSummary ? `Summary: ${memory.aiSummary}` : "",
      memory.content ? `\nContent:\n${memory.content}` : "",
      memory.aiKeyInsights?.length ? `\nKey Insights:\n${memory.aiKeyInsights.map((i) => `• ${i}`).join("\n")}` : "",
      memory.sourceUrl ? `\nSource: ${memory.sourceUrl}` : "",
      "\n— Shared from MindVault",
    ].filter(Boolean).join("\n");
    try {
      await Share.share({ message: shareContent, title: memory.title });
    } catch {}
  }, [memoryQuery.data]);

  const handleAddToFolder = useCallback(async () => {
    if (folders.length === 0) {
      Alert.alert("No Folders", "Create a folder first to organize your memories.", [
        { text: "Cancel", style: "cancel" },
        { text: "Create Folder", onPress: () => router.push("/folders" as any) },
      ]);
      return;
    }
    const buttons = folders.map((f) => ({
      text: f.name,
      onPress: async () => {
        const allFolders = await loadFolders();
        const idx = allFolders.findIndex((fo) => fo.id === f.id);
        if (idx >= 0) {
          if (!allFolders[idx].memoryIds.includes(memoryId)) {
            allFolders[idx].memoryIds.push(memoryId);
            await saveFolders(allFolders);
            setFolders(allFolders);
            Alert.alert("Added", `Memory added to "${f.name}"`);
          } else {
            Alert.alert("Already in Folder", `This memory is already in "${f.name}"`);
          }
        }
      },
    }));
    buttons.push({ text: "Cancel", onPress: async () => {} });
    Alert.alert("Add to Folder", "Select a folder:", buttons);
  }, [folders, memoryId, router]);

  const handleTagToggle = useCallback(() => {
    if (tags.length === 0) {
      Alert.alert("No Tags", "Create tags first to organize your memories.", [
        { text: "Cancel", style: "cancel" },
        { text: "Create Tag", onPress: () => router.push("/tags" as any) },
      ]);
      return;
    }
    const memTagIds = memTags.map((t) => t.id);
    const buttons = tags.map((t) => ({
      text: `${memTagIds.includes(t.id) ? "✓ " : ""}${t.name}`,
      onPress: () => {
        if (memTagIds.includes(t.id)) {
          removeTagFromMemory(memoryId, t.id);
        } else {
          addTagToMemory(memoryId, t.id);
        }
      },
    }));
    buttons.push({ text: "Done", onPress: () => {} });
    Alert.alert("Toggle Tags", "Tap a tag to add/remove:", buttons);
  }, [tags, memTags, memoryId, addTagToMemory, removeTagFromMemory, router]);

  if (memoryQuery.isLoading) {
    return (
      <GlassScreen screenName="detail" edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </GlassScreen>
    );
  }

  const memory = memoryQuery.data;
  if (!memory) {
    return (
      <GlassScreen screenName="detail" edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted">Memory not found</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Text style={{ color: colors.primary, marginTop: 12, fontWeight: "600" }}>Go Back</Text>
        </Pressable>
      </GlassScreen>
    );
  }

  const typeMeta = TYPE_META[memory.type] || TYPE_META.text;
  const dateStr = new Date(memory.createdAt).toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <GlassScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={styles.headerActions}>
          <Pressable onPress={() => toggleFavorite(memoryId)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name={fav ? "star.fill" : "star"} size={22} color={fav ? colors.accent : colors.muted} />
          </Pressable>
          <Pressable onPress={handleTagToggle} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="tag.fill" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleAddToFolder} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="folder.badge.plus" size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => router.push(`/analyze?memoryId=${memoryId}` as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="doc.text.magnifyingglass" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleShare} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            {deleting ? <ActivityIndicator size="small" color={colors.error} /> : <IconSymbol name="trash.fill" size={20} color={colors.error} />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-4">
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + "15" }]}>
              <IconSymbol name={typeMeta.icon} size={14} color={typeMeta.color} />
              <Text style={{ color: typeMeta.color, fontSize: 12, fontWeight: "600" }}>{typeMeta.label}</Text>
            </View>
            {fav && (
              <View style={[styles.typeBadge, { backgroundColor: colors.accent + "15" }]}>
                <IconSymbol name="star.fill" size={12} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>Favorite</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{memory.title}</Text>
          <Text style={[styles.date, { color: colors.muted }]}>{dateStr}</Text>
        </View>

        {/* Tags */}
        {memTags.length > 0 && (
          <View className="px-5 mt-3">
            <View style={styles.tagRow}>
              {memTags.map((tag) => (
                <View key={tag.id} style={[styles.tagChip, { backgroundColor: tag.color + "15" }]}>
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={{ color: tag.color, fontSize: 12, fontWeight: "600" }}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!memory.processed && (
          <View style={[styles.processingBanner, { backgroundColor: colors.primary + "10" }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 8 }}>AI is processing this memory...</Text>
          </View>
        )}

        {memory.aiSummary && (
          <View className="px-5 mt-5">
            <View style={[styles.aiCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "25" }]}>
              <View style={styles.aiCardHeader}>
                <IconSymbol name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.aiCardTitle, { color: colors.primary }]}>AI Summary</Text>
              </View>
              <Text style={[styles.aiCardText, { color: colors.foreground }]}>{memory.aiSummary}</Text>
            </View>
          </View>
        )}

        {memory.aiTopics && memory.aiTopics.length > 0 && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Topics</Text>
            <View style={styles.topicRow}>
              {memory.aiTopics.map((topic: string) => (
                <View key={topic} style={[styles.topicChip, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {memory.aiKeyInsights && memory.aiKeyInsights.length > 0 && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Key Insights</Text>
            {memory.aiKeyInsights.map((insight: string, i: number) => (
              <View key={i} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.insightText, { color: colors.foreground }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {memory.aiTranscription && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Transcription</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.aiTranscription}</Text>
            </View>
          </View>
        )}

        {memory.aiExtractedText && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Extracted Text</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.aiExtractedText}</Text>
            </View>
          </View>
        )}

        {memory.content && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Original Content</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.content}</Text>
            </View>
          </View>
        )}

        {memory.sourceUrl && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Source</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.primary, fontSize: 14 }}>{memory.sourceUrl}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  title: { fontSize: 24, fontWeight: "700", lineHeight: 30 },
  date: { fontSize: 13, marginTop: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  processingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
  },
  aiCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aiCardTitle: { fontSize: 14, fontWeight: "700" },
  aiCardText: { fontSize: 15, lineHeight: 22 },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  topicRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightText: { fontSize: 14, lineHeight: 20, flex: 1 },
  contentBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
  contentText: { fontSize: 14, lineHeight: 21 },
});
