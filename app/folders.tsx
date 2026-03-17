import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

export interface Folder {
  id: string;
  name: string;
  color: string;
  memoryIds: number[];
  createdAt: string;
}

const FOLDER_COLORS = ["#6C5CE7", "#00D2D3", "#FF6B6B", "#FDCB6E", "#00B894", "#E17055", "#0984E3", "#A29BFE"];
const FOLDERS_KEY = "@mindvault_folders";

export async function loadFolders(): Promise<Folder[]> {
  try {
    const raw = await AsyncStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveFolders(folders: Folder[]) {
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export default function FoldersScreen() {
  const router = useRouter();
  const { canUseFeature, getFolderLimit, subscription } = useAppState();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders().then((f) => {
      setFolders(f);
      setLoading(false);
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const limit = getFolderLimit();
    if (limit > 0 && folders.length >= limit) {
      Alert.alert("Folder Limit Reached", `Your ${subscription} plan allows up to ${limit} folders. Upgrade to Pro for unlimited folders.`, [
        { text: "OK" },
        { text: "Upgrade", onPress: () => router.push("/subscription" as any) },
      ]);
      return;
    }
    const folder: Folder = {
      id: Date.now().toString(),
      name: newName.trim(),
      color: selectedColor,
      memoryIds: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...folders, folder];
    setFolders(updated);
    await saveFolders(updated);
    setNewName("");
    setShowCreate(false);
  }, [newName, selectedColor, folders, getFolderLimit, subscription, router]);

  const handleDelete = useCallback((folderId: string) => {
    Alert.alert("Delete Folder", "This will remove the folder but not the memories inside.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = folders.filter((f) => f.id !== folderId);
          setFolders(updated);
          await saveFolders(updated);
        },
      },
    ]);
  }, [folders]);

  return (
    <CinematicScreen screenName="folders" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Folders</Text>
        <Pressable
          onPress={() => setShowCreate(!showCreate)}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name={"create-new-folder" as any} size={24} color={"#FFD700"} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Create Form */}
        {showCreate && (
          <View style={[styles.createForm, { backgroundColor: "rgba(8,12,28,0.88)", borderColor: "rgba(255,215,0,0.22)" }]}>
            <Text style={[styles.createLabel, { color: "#FFFFFF" }]}>New Folder</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Folder name..."
              placeholderTextColor={"rgba(255,255,255,0.4)"}
              style={[styles.nameInput, { color: "#FFFFFF", borderColor: "rgba(255,215,0,0.22)", backgroundColor: "#0A0E1A" }]}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={({ pressed }) => [
                    styles.colorDot,
                    { backgroundColor: c, borderColor: selectedColor === c ? "#FFFFFF" : "transparent", borderWidth: selectedColor === c ? 2.5 : 0 },
                    pressed && { opacity: 0.7 },
                  ]}
                />
              ))}
            </View>
            <View style={styles.createActions}>
              <Pressable onPress={() => setShowCreate(false)} style={({ pressed }) => [styles.cancelBtn, { borderColor: "rgba(255,215,0,0.22)" }, pressed && { opacity: 0.7 }]}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                style={({ pressed }) => [styles.createBtn, { backgroundColor: "#FFD700" }, pressed && { opacity: 0.8 }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Create</Text>
              </Pressable>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={"#FFD700"} />
        ) : folders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name={"folder" as any} size={48} color={"rgba(255,255,255,0.4)"} />
            <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>No Folders Yet</Text>
            <Text style={[styles.emptySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
              Create folders to organize your memories by topic, project, or category.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => [styles.emptyBtn, { backgroundColor: "#FFD700" }, pressed && { opacity: 0.8 }]}
            >
              <MaterialIcons name={"create-new-folder" as any} size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Create First Folder</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => router.push(`/folder/${folder.id}` as any)}
                onLongPress={() => handleDelete(folder.id)}
                style={({ pressed }) => [
                  styles.folderCard,
                  { backgroundColor: "rgba(8,12,28,0.88)", borderColor: "rgba(255,215,0,0.22)" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.folderIcon, { backgroundColor: folder.color + "20" }]}>
                  <MaterialIcons name={"folder" as any} size={22} color={folder.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.folderName, { color: "#FFFFFF" }]}>{folder.name}</Text>
                  <Text style={[styles.folderCount, { color: "rgba(255,255,255,0.7)" }]}>
                    {folder.memoryIds.length} {folder.memoryIds.length === 1 ? "memory" : "memories"}
                  </Text>
                </View>
                <MaterialIcons name={"chevron-right" as any} size={16} color={"rgba(255,255,255,0.4)"} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  createLabel: { fontSize: 16, fontWeight: "700" },
  nameInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  createActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  folderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: { fontSize: 16, fontWeight: "600" },
  folderCount: { fontSize: 13, marginTop: 2 },
});
