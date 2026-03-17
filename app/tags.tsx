import { useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, FlatList, Alert, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppState, type UserTag } from "@/lib/app-state";
import { useRouter } from "expo-router";

const TAG_COLORS = [
  "#00C9A7", "#D4A017", "#E74C3C", "#3498DB", "#9B59B6",
  "#1ABC9C", "#F39C12", "#E67E22", "#2ECC71", "#E91E63",
];

export default function TagsScreen() {
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
      <View style={[styles.tagCard, { backgroundColor: "rgba(8,12,28,0.88)", borderColor: "rgba(255,215,0,0.22)" }]}>
        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.tagName, { color: "#FFFFFF" }]}>{item.name}</Text>
          <Text style={[styles.tagCount, { color: "rgba(255,255,255,0.7)" }]}>
            {memCount} {memCount === 1 ? "memory" : "memories"}
          </Text>
        </View>
        <Pressable
          onPress={() => handleDelete(item)}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name={"delete" as any} size={16} color={"#FF6B6B"} />
        </Pressable>
      </View>
    );
  }, [getMemoriesByTag, handleDelete]);

  return (
    <CinematicScreen screenName="detail" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Tags</Text>
        <Pressable
          onPress={() => setShowCreate(!showCreate)}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name={"add" as any} size={24} color={"#FFD700"} />
        </Pressable>
      </View>

      {/* Create Tag Form */}
      {showCreate && (
        <View style={[styles.createForm, { backgroundColor: "rgba(8,12,28,0.88)", borderColor: "rgba(255,215,0,0.22)" }]}>
          <Text style={[styles.createTitle, { color: "#FFFFFF" }]}>Create New Tag</Text>
          <TextInput
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="Tag name..."
            placeholderTextColor={"rgba(255,255,255,0.4)"}
            style={[styles.input, { color: "#FFFFFF", backgroundColor: "#0A0E1A", borderColor: "rgba(255,215,0,0.22)" }]}
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
              style={({ pressed }) => [styles.cancelBtn, { borderColor: "rgba(255,215,0,0.22)" }, pressed && { opacity: 0.7 }]}
            >
              <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: "#FFD700" },
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
            <MaterialIcons name={"label" as any} size={48} color={"rgba(255,255,255,0.4)"} />
            <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>No tags yet</Text>
            <Text style={[styles.emptySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
              Create custom tags to organize your memories beyond AI-generated topics.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: "#FFD700" },
                pressed && { opacity: 0.9 },
              ]}
            >
              <MaterialIcons name={"add" as any} size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Create First Tag</Text>
            </Pressable>
          </View>
        }
      />
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
