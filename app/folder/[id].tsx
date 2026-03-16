import { useState, useEffect, useCallback } from "react";
import { Text, View, Pressable, FlatList, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { loadFolders, saveFolders, Folder } from "../folders";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  text: { icon: "text.alignleft", color: "#6C5CE7" },
  image: { icon: "photo.fill", color: "#00D2D3" },
  voice: { icon: "mic.fill", color: "#FF6B6B" },
  document: { icon: "doc.fill", color: "#FDCB6E" },
  link: { icon: "globe", color: "#00B894" },
};

export default function FolderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const memoriesQuery = trpc.memories.list.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  const aiQuery = trpc.ai.query.useMutation();

  useEffect(() => {
    loadFolders().then((folders) => {
      const found = folders.find((f) => f.id === id);
      setFolder(found || null);
      setLoading(false);
    });
  }, [id]);

  const folderMemories = (memoriesQuery.data || []).filter(
    (m) => folder?.memoryIds.includes(m.id)
  );

  const handleAnalyze = useCallback(async () => {
    if (folderMemories.length === 0) {
      Alert.alert("No Memories", "Add some memories to this folder first.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await aiQuery.mutateAsync({
        question: `Analyze all the content in my "${folder?.name}" folder. Summarize the key themes, important points, and provide actionable insights. Here are the memories in this folder: ${folderMemories.map((m) => m.title).join(", ")}`,
      });
      setAnalysis(result.answer);
    } catch {
      Alert.alert("Error", "Failed to analyze folder contents.");
    }
    setAnalyzing(false);
  }, [folderMemories, folder, aiQuery]);

  const handleRemoveMemory = useCallback(async (memoryId: number) => {
    if (!folder) return;
    const folders = await loadFolders();
    const idx = folders.findIndex((f) => f.id === folder.id);
    if (idx >= 0) {
      folders[idx].memoryIds = folders[idx].memoryIds.filter((id) => id !== memoryId);
      await saveFolders(folders);
      setFolder({ ...folder, memoryIds: folders[idx].memoryIds });
    }
  }, [folder]);

  if (loading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!folder) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted">Folder not found</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Text style={{ color: colors.primary, marginTop: 12, fontWeight: "600" }}>Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{folder.name}</Text>
        </View>
        <Pressable
          onPress={handleAnalyze}
          disabled={analyzing}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <IconSymbol name="sparkles" size={22} color={colors.primary} />
          )}
        </Pressable>
      </View>

      {/* AI Analysis */}
      {analysis && (
        <View style={[styles.analysisCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "25" }]}>
          <View style={styles.analysisHeader}>
            <IconSymbol name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.analysisTitle, { color: colors.primary }]}>Folder Analysis</Text>
            <Pressable onPress={() => setAnalysis(null)} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <IconSymbol name="xmark" size={14} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={[styles.analysisText, { color: colors.foreground }]}>{analysis}</Text>
        </View>
      )}

      <FlatList
        data={folderMemories}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.folderInfo}>
            <View style={[styles.folderIconLarge, { backgroundColor: folder.color + "20" }]}>
              <IconSymbol name="folder.fill" size={32} color={folder.color} />
            </View>
            <Text style={[styles.folderStats, { color: colors.muted }]}>
              {folderMemories.length} {folderMemories.length === 1 ? "memory" : "memories"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.text;
          return (
            <Pressable
              onPress={() => router.push(`/memory/${item.id}` as any)}
              style={({ pressed }) => [
                styles.memoryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + "20" }]}>
                <IconSymbol name={typeInfo.icon} size={18} color={typeInfo.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.memSummary, { color: colors.muted }]} numberOfLines={2}>
                  {item.aiSummary || item.content || "Processing..."}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemoveMemory(item.id)}
                style={({ pressed }) => [pressed && { opacity: 0.5 }]}
              >
                <IconSymbol name="xmark" size={14} color={colors.muted} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="tray.fill" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Empty Folder</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Add memories to this folder from the Library or Memory Detail screen.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  folderInfo: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  folderIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  folderStats: { fontSize: 14 },
  analysisCard: {
    margin: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  analysisTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  analysisText: { fontSize: 14, lineHeight: 21 },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  memTitle: { fontSize: 15, fontWeight: "600" },
  memSummary: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
});
