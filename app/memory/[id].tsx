import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert, Share, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";
import { loadFolders, saveFolders, Folder } from "../folders";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  text: { icon: "edit-note", color: "#FFD700", label: "Text Note" },
  image: { icon: "image", color: "#FFA500", label: "Image" },
  voice: { icon: "mic", color: "#FF6B6B", label: "Voice Recording" },
  document: { icon: "description", color: "#4FC3F7", label: "Document" },
  link: { icon: "link", color: "#81C784", label: "Web Link" },
};

export default function MemoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memoryId = parseInt(id || "0", 10);
  const [deleting, setDeleting] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const { isFavorite, toggleFavorite, tags, getMemoryTags, addTagToMemory, removeTagFromMemory } = useAppState();

  const memoryQuery = trpc.memories.get.useQuery({ id: memoryId }, { enabled: memoryId > 0 });
  const deleteMutation = trpc.memories.delete.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => { loadFolders().then(setFolders); }, []);

  const fav = isFavorite(memoryId);
  const memTags = getMemoryTags(memoryId);

  const handleDelete = () => {
    Alert.alert("Delete Memory", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setDeleting(true);
        try { await deleteMutation.mutateAsync({ id: memoryId }); utils.memories.list.invalidate(); utils.memories.recent.invalidate(); utils.memories.stats.invalidate(); router.back(); }
        catch { Alert.alert("Error", "Failed to delete."); setDeleting(false); }
      }},
    ]);
  };

  const handleShare = useCallback(async () => {
    const m = memoryQuery.data;
    if (!m) return;
    const text = [m.title, "", m.aiSummary ? `Summary: ${m.aiSummary}` : "", m.content ? `\nContent:\n${m.content}` : "", m.aiKeyInsights?.length ? `\nKey Insights:\n${m.aiKeyInsights.map((i) => `• ${i}`).join("\n")}` : "", m.sourceUrl ? `\nSource: ${m.sourceUrl}` : "", "\n— Shared from MindVault"].filter(Boolean).join("\n");
    try { await Share.share({ message: text, title: m.title }); } catch {}
  }, [memoryQuery.data]);

  const handleAddToFolder = useCallback(async () => {
    if (folders.length === 0) { Alert.alert("No Folders", "Create a folder first.", [{ text: "Cancel", style: "cancel" }, { text: "Create", onPress: () => router.push("/folders" as any) }]); return; }
    const buttons = folders.map((f) => ({ text: f.name, onPress: async () => {
      const all = await loadFolders(); const idx = all.findIndex((fo) => fo.id === f.id);
      if (idx >= 0) { if (!all[idx].memoryIds.includes(memoryId)) { all[idx].memoryIds.push(memoryId); await saveFolders(all); setFolders(all); Alert.alert("Added", `Added to "${f.name}"`); } else { Alert.alert("Already Added", `Already in "${f.name}"`); } }
    }}));
    buttons.push({ text: "Cancel", onPress: async () => {} });
    Alert.alert("Add to Folder", "Select a folder:", buttons);
  }, [folders, memoryId, router]);

  const handleTagToggle = useCallback(() => {
    if (tags.length === 0) { Alert.alert("No Tags", "Create tags first.", [{ text: "Cancel", style: "cancel" }, { text: "Create", onPress: () => router.push("/tags" as any) }]); return; }
    const memTagIds = memTags.map((t) => t.id);
    const buttons = tags.map((t) => ({ text: `${memTagIds.includes(t.id) ? "✓ " : ""}${t.name}`, onPress: () => { memTagIds.includes(t.id) ? removeTagFromMemory(memoryId, t.id) : addTagToMemory(memoryId, t.id); } }));
    buttons.push({ text: "Done", onPress: () => {} });
    Alert.alert("Toggle Tags", "Tap to add/remove:", buttons);
  }, [tags, memTags, memoryId, addTagToMemory, removeTagFromMemory, router]);

  if (memoryQuery.isLoading) {
    return (<CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}><View style={styles.centerFull}><ActivityIndicator size="large" color="#FFD700" /></View></CinematicScreen>);
  }

  const memory = memoryQuery.data;
  if (!memory) {
    return (<CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}><View style={styles.centerFull}><Text style={styles.emptyText}>Memory not found</Text><Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}><Text style={styles.backLink}>Go Back</Text></Pressable></View></CinematicScreen>);
  }

  const typeMeta = TYPE_META[memory.type] || TYPE_META.text;
  const dateStr = new Date(memory.createdAt).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={styles.headerActions}>
          <Pressable onPress={() => toggleFavorite(memoryId)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name={fav ? "star" : "star-outline"} size={22} color={fav ? "#FFD700" : "rgba(255,255,255,0.4)"} />
          </Pressable>
          <Pressable onPress={handleTagToggle} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="label" size={20} color="#FFD700" />
          </Pressable>
          <Pressable onPress={handleAddToFolder} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="create-new-folder" size={22} color="#FFD700" />
          </Pressable>
          <Pressable onPress={() => router.push(`/analyze?memoryId=${memoryId}` as any)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="document-scanner" size={20} color="#FFD700" />
          </Pressable>
          <Pressable onPress={handleShare} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="share" size={20} color="#FFD700" />
          </Pressable>
          <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            {deleting ? <ActivityIndicator size="small" color="#FF6B6B" /> : <MaterialIcons name="delete" size={20} color="#FF6B6B" />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={styles.badgeRow}>
            <LinearGradient colors={[`${typeMeta.color}20`, `${typeMeta.color}10`]} style={styles.typeBadge}>
              <MaterialIcons name={typeMeta.icon as any} size={14} color={typeMeta.color} />
              <Text style={{ color: typeMeta.color, fontSize: 12, fontWeight: "600" }}>{typeMeta.label}</Text>
            </LinearGradient>
            {fav && (
              <View style={[styles.typeBadge, { backgroundColor: "rgba(255,215,0,0.12)" }]}>
                <MaterialIcons name="star" size={12} color="#FFD700" />
                <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>Favorite</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{memory.title}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* Tags */}
        {memTags.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View style={styles.tagRow}>
              {memTags.map((tag) => (
                <View key={tag.id} style={[styles.tagChip, { backgroundColor: `${tag.color}15` }]}>
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={{ color: tag.color, fontSize: 12, fontWeight: "600" }}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!memory.processed && (
          <View style={styles.processingBanner}>
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={{ color: "#FFD700", fontSize: 14, marginLeft: 8 }}>AI is processing this memory...</Text>
          </View>
        )}

        {memory.aiSummary && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <GoldenCard style={{ borderColor: "rgba(255,215,0,0.2)" }}>
              <View style={styles.aiCardHeader}>
                <MaterialIcons name="auto-awesome" size={16} color="#FFD700" />
                <Text style={styles.aiCardTitle}>AI Summary</Text>
              </View>
              <Text style={styles.aiCardText}>{memory.aiSummary}</Text>
            </GoldenCard>
          </View>
        )}

        {memory.aiTopics && memory.aiTopics.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Topics</Text>
            <View style={styles.topicRow}>
              {memory.aiTopics.map((topic: string) => (
                <LinearGradient key={topic} colors={["rgba(255,215,0,0.12)", "rgba(255,165,0,0.06)"]} style={styles.topicChip}>
                  <Text style={{ color: "#FFD700", fontSize: 13, fontWeight: "600" }}>{topic}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {memory.aiKeyInsights && memory.aiKeyInsights.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Key Insights</Text>
            {memory.aiKeyInsights.map((insight: string, i: number) => (
              <View key={i} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: "#FFD700" }]} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {memory.aiTranscription && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Transcription</Text>
            <GoldenCard><Text style={styles.contentText}>{memory.aiTranscription}</Text></GoldenCard>
          </View>
        )}

        {memory.aiExtractedText && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Extracted Text</Text>
            <GoldenCard><Text style={styles.contentText}>{memory.aiExtractedText}</Text></GoldenCard>
          </View>
        )}

        {memory.content && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Original Content</Text>
            <GoldenCard><Text style={styles.contentText}>{memory.content}</Text></GoldenCard>
          </View>
        )}

        {memory.sourceUrl && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Source</Text>
            <GoldenCard><Text style={{ color: "#4FC3F7", fontSize: 14 }}>{memory.sourceUrl}</Text></GoldenCard>
          </View>
        )}
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  backLink: { color: "#FFD700", marginTop: 12, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,215,0,0.08)" },
  backBtn: { padding: 4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  title: { fontSize: 24, fontWeight: "700", lineHeight: 30, color: "#FFFFFF" },
  date: { fontSize: 13, marginTop: 6, color: "rgba(255,255,255,0.35)" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  processingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, marginHorizontal: 20, marginTop: 16, borderRadius: 10, backgroundColor: "rgba(15,20,40,0.90)" },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  aiCardTitle: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
  aiCardText: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.7)" },
  sectionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 10, color: "#FFFFFF" },
  topicRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightText: { fontSize: 14, lineHeight: 20, flex: 1, color: "rgba(255,255,255,0.8)" },
  contentText: { fontSize: 14, lineHeight: 21, color: "rgba(255,255,255,0.8)" },
});
