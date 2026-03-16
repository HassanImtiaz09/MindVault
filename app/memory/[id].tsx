import { useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  text: { icon: "text.alignleft", color: "#6C5CE7", label: "Text Note" },
  image: { icon: "photo.fill", color: "#00D2D3", label: "Image" },
  voice: { icon: "mic.fill", color: "#FF6B6B", label: "Voice Recording" },
  document: { icon: "doc.fill", color: "#FDCB6E", label: "Document" },
  link: { icon: "globe", color: "#00B894", label: "Web Link" },
};

export default function MemoryDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memoryId = parseInt(id || "0", 10);
  const [deleting, setDeleting] = useState(false);

  const memoryQuery = trpc.memories.get.useQuery({ id: memoryId }, { enabled: memoryId > 0 });
  const deleteMutation = trpc.memories.delete.useMutation();
  const utils = trpc.useUtils();

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

  if (memoryQuery.isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const memory = memoryQuery.data;
  if (!memory) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 items-center justify-center p-6">
        <Text className="text-lg text-muted">Memory not found</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Text style={{ color: colors.primary, marginTop: 12, fontWeight: "600" }}>Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const typeMeta = TYPE_META[memory.type] || TYPE_META.text;
  const dateStr = new Date(memory.createdAt).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          {deleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <IconSymbol name="trash.fill" size={20} color={colors.error} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Type Badge & Title */}
        <View className="px-5 pt-4">
          <View style={[styles.typeBadge, { backgroundColor: typeMeta.color + "18" }]}>
            <IconSymbol name={typeMeta.icon} size={14} color={typeMeta.color} />
            <Text style={{ color: typeMeta.color, fontSize: 12, fontWeight: "600" }}>{typeMeta.label}</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{memory.title}</Text>
          <Text style={[styles.date, { color: colors.muted }]}>{dateStr}</Text>
        </View>

        {/* Processing Status */}
        {!memory.processed && (
          <View style={[styles.processingBanner, { backgroundColor: colors.primary + "10" }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 8 }}>
              AI is processing this memory...
            </Text>
          </View>
        )}

        {/* AI Summary */}
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

        {/* Topics */}
        {memory.aiTopics && memory.aiTopics.length > 0 && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Topics</Text>
            <View style={styles.topicRow}>
              {memory.aiTopics.map((topic: string) => (
                <View key={topic} style={[styles.topicChip, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Key Insights */}
        {memory.aiKeyInsights && memory.aiKeyInsights.length > 0 && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Key Insights</Text>
            {memory.aiKeyInsights.map((insight: string, i: number) => (
              <View key={i} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: "#FDCB6E" }]} />
                <Text style={[styles.insightText, { color: colors.foreground }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transcription */}
        {memory.aiTranscription && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Transcription</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.aiTranscription}</Text>
            </View>
          </View>
        )}

        {/* Extracted Text */}
        {memory.aiExtractedText && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Extracted Text</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.aiExtractedText}</Text>
            </View>
          </View>
        )}

        {/* Original Content */}
        {memory.content && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Original Content</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.contentText, { color: colors.foreground }]}>{memory.content}</Text>
            </View>
          </View>
        )}

        {/* Source URL */}
        {memory.sourceUrl && (
          <View className="px-5 mt-4">
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Source</Text>
            <View style={[styles.contentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.primary, fontSize: 14 }}>{memory.sourceUrl}</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  backBtn: {
    padding: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  date: {
    fontSize: 13,
    marginTop: 6,
  },
  processingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
  },
  aiCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  aiCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  aiCardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  topicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  contentBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
