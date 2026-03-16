import { useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, FlatList, Alert, StyleSheet } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppState, type UserTag } from "@/lib/app-state";
import { useRouter } from "expo-router";

const TAG_COLORS = [
  "#00C9A7", "#D4A017", "#E74C3C", "#3498DB", "#9B59B6",
  "#1ABC9C", "#F39C12", "#E67E22", "#2ECC71", "#E91E63",
];

export default function TagsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { tags, createTag, deleteTag, getMemoriesByTag, canUseFeature } = useAppState();
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = useCallback(() => {
    if (!newTagName.trim()) return;
    if (!canUseFeature("custom_tags")) {
      router.push("/subscription" as any);
      return;
    }
    createTag(newTagName.trim(), selectedColor);
    setNewTagName("");
    setShowCreate(false);
  }, [newTagName, selectedColor, createTag, canUseFeature, router]);

  const handleDelete = useCallback((tag: UserTag) => {
    Alert.alert("Delete Tag?", `Remove "${tag.name}" from all memories?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTag(tag.id) },
    ]);
  }, [deleteTag]);

  const renderTag = useCallback(({ item }: { item: UserTag }) => {
    const memCount = getMemoriesByTag(item.id).length;
    return (
      <View style={[styles.tagCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.tagName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.tagCount, { color: colors.muted }]}>
            {memCount} {memCount === 1 ? "memory" : "memories"}
          </Text>
        </View>
        <Pressable
          onPress={() => handleDelete(item)}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
        </Pressable>
      </View>
    );
  }, [colors, getMemoriesByTag, handleDelete]);

  return (
    <GlassScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tags</Text>
        <Pressable
          onPress={() => setShowCreate(!showCreate)}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Create Tag Form */}
      {showCreate && (
        <View style={[styles.createForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.createTitle, { color: colors.foreground }]}>Create New Tag</Text>
          <TextInput
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="Tag name..."
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={styles.colorRow}>
            {TAG_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={({ pressed }) => [
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotSelected,
                  pressed && { opacity: 0.7 },
                ]}
              />
            ))}
          </View>
          <View style={styles.createActions}>
            <Pressable
              onPress={() => setShowCreate(false)}
              style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Create Tag</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Tags List */}
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTag}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="tag.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No tags yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Create custom tags to organize your memories beyond AI-generated topics.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9 },
              ]}
            >
              <IconSymbol name="plus" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Create First Tag</Text>
            </Pressable>
          </View>
        }
      />
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
  createForm: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  createTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  createActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  createBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  tagDot: { width: 14, height: 14, borderRadius: 7 },
  tagName: { fontSize: 15, fontWeight: "600" },
  tagCount: { fontSize: 12, marginTop: 1 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
