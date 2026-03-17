import { useState } from "react";
import { View, Text, Pressable, FlatList, TextInput, StyleSheet, Platform, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppState } from "@/lib/app-state";
import { useRouter, useLocalSearchParams } from "expo-router";

const BG = require("@/assets/images/backgrounds/folders.jpg");

export default function CollaborateScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId: string; folderName: string }>();
  const { addCollaborator, removeCollaborator, getFolderCollaborators, canUseFeature } = useAppState();

  const folderId = params.folderId || "default";
  const folderName = params.folderName || "Folder";
  const collaborators = getFolderCollaborators(folderId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");

  const handleAdd = () => {
    if (!email.trim() || !email.includes("@")) return;
    addCollaborator(folderId, email.trim().toLowerCase(), role);
    setEmail("");
  };

  const cardBg = isDark ? "rgba(8,12,28,0.92)" : "rgba(255,255,255,0.5)";
  const cardBorder = isDark ? "rgba(0,201,167,0.15)" : "rgba(0,201,167,0.2)";

  return (
    <View style={styles.root}>
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {Platform.OS !== "web" ? (
        <BlurView intensity={45} tint={isDark ? "dark" : "light"} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(8,12,28,0.92)" : "rgba(240,255,248,0.6)", backdropFilter: "blur(18px)" } as any]} />
      )}
      <LinearGradient
        colors={isDark
          ? ["rgba(10,18,15,0.65)", "rgba(5,30,20,0.55)", "rgba(10,18,15,0.65)"]
          : ["rgba(240,255,248,0.55)", "rgba(230,250,240,0.45)", "rgba(240,255,248,0.55)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Share Folder</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{folderName}</Text>
          </View>
        </View>

        <View style={{ padding: 20, gap: 16, flex: 1 }}>
          {/* Add collaborator */}
          <View style={[styles.addCard, { backgroundColor: cardBg, borderColor: "#00C9A7" + "30" }]}>
            <Text style={[styles.addTitle, { color: "#00C9A7" }]}>Invite Collaborator</Text>
            <TextInput
              style={[styles.input, { color: "#FFFFFF", borderColor: cardBorder, backgroundColor: isDark ? "rgba(8,12,28,0.90)" : "rgba(255,255,255,0.5)" }]}
              placeholder="Email address..."
              placeholderTextColor={"rgba(255,255,255,0.4)"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {/* Role picker */}
            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setRole("viewer")}
                style={({ pressed }) => [
                  styles.roleBtn,
                  { backgroundColor: role === "viewer" ? "#00C9A7" + "20" : "transparent", borderColor: role === "viewer" ? "#00C9A7" : cardBorder },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name={"visibility" as any} size={16} color={role === "viewer" ? "#00C9A7" : "rgba(255,255,255,0.4)"} />
                <Text style={{ color: role === "viewer" ? "#00C9A7" : "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: 13 }}>Viewer</Text>
              </Pressable>
              <Pressable
                onPress={() => setRole("editor")}
                style={({ pressed }) => [
                  styles.roleBtn,
                  { backgroundColor: role === "editor" ? "#D4A017" + "20" : "transparent", borderColor: role === "editor" ? "#D4A017" : cardBorder },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name={"edit" as any} size={16} color={role === "editor" ? "#D4A017" : "rgba(255,255,255,0.4)"} />
                <Text style={{ color: role === "editor" ? "#D4A017" : "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: 13 }}>Editor</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [styles.inviteBtn, { backgroundColor: "#00C9A7" }, pressed && { opacity: 0.9 }]}
            >
              <MaterialIcons name={"person-add" as any} size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>Send Invite</Text>
            </Pressable>
          </View>

          {/* Collaborators list */}
          <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.7)" }]}>
            {collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""}
          </Text>

          <FlatList
            data={collaborators}
            keyExtractor={(item) => item.email}
            contentContainerStyle={{ gap: 8 }}
            ListEmptyComponent={
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <MaterialIcons name={"group" as any} size={36} color="#00C9A7" />
                <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>No Collaborators</Text>
                <Text style={[styles.emptySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
                  Invite team members to view or edit this folder's contents together.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.collabCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.avatar, { backgroundColor: item.role === "editor" ? "#D4A017" + "20" : "#00C9A7" + "20" }]}>
                  <Text style={{ color: item.role === "editor" ? "#D4A017" : "#00C9A7", fontWeight: "700", fontSize: 16 }}>
                    {item.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.collabEmail, { color: "#FFFFFF" }]}>{item.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: item.role === "editor" ? "#D4A017" + "15" : "#00C9A7" + "15" }]}>
                    <Text style={{ color: item.role === "editor" ? "#D4A017" : "#00C9A7", fontSize: 11, fontWeight: "600" }}>
                      {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => removeCollaborator(folderId, item.email)}
                  style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                >
                  <MaterialIcons name={"cancel" as any} size={22} color={"rgba(255,255,255,0.4)"} />
                </Pressable>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  addCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  addTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  roleRow: { flexDirection: "row", gap: 10 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  collabCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  collabEmail: { fontSize: 14, fontWeight: "600" },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
});
