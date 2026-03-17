import { useState } from "react";
import { View, Text, Pressable, FlatList, TextInput, StyleSheet, Alert, Platform, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";

const BG = require("@/assets/images/backgrounds/detail.jpg");

export default function RemindersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { reminders, addReminder, completeReminder, deleteReminder, getPendingReminders, canUseFeature } = useAppState();

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  const pending = getPendingReminders();
  const completed = reminders.filter((r) => r.completed);

  const handleAdd = () => {
    if (!title.trim()) return;
    addReminder({
      memoryId: 0,
      title: title.trim(),
      description: desc.trim(),
      dueDate: dueDate || new Date(Date.now() + 86400000).toISOString(),
    });
    setTitle("");
    setDesc("");
    setDueDate("");
    setShowAdd(false);
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
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Smart Reminders</Text>
          <Pressable onPress={() => setShowAdd(true)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <MaterialIcons name={"add-circle" as any} size={26} color="#00C9A7" />
          </Pressable>
        </View>

        {/* Add form */}
        {showAdd && (
          <View style={[styles.addCard, { backgroundColor: cardBg, borderColor: "#D4A017" + "40" }]}>
            <Text style={[styles.addTitle, { color: "#D4A017" }]}>New Reminder</Text>
            <TextInput
              style={[styles.input, { color: "#FFFFFF", borderColor: cardBorder, backgroundColor: isDark ? "rgba(8,12,28,0.90)" : "rgba(255,255,255,0.5)" }]}
              placeholder="Reminder title..."
              placeholderTextColor={"rgba(255,255,255,0.4)"}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { color: "#FFFFFF", borderColor: cardBorder, backgroundColor: isDark ? "rgba(8,12,28,0.90)" : "rgba(255,255,255,0.5)" }]}
              placeholder="Description (optional)..."
              placeholderTextColor={"rgba(255,255,255,0.4)"}
              value={desc}
              onChangeText={setDesc}
              multiline
            />
            <View style={styles.addActions}>
              <Pressable onPress={() => setShowAdd(false)} style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: "#00C9A7" }, pressed && { opacity: 0.9 }]}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Add Reminder</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pending */}
        <FlatList
          data={[...pending, ...completed]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={
            pending.length > 0 ? (
              <Text style={[styles.sectionLabel, { color: "#D4A017" }]}>
                {pending.length} pending reminder{pending.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <MaterialIcons name={"notifications" as any} size={40} color="#D4A017" />
              <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>No Reminders Yet</Text>
              <Text style={[styles.emptySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
                AI will detect action items in your notes and suggest reminders automatically. You can also add them manually.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCompleted = item.completed;
            const showCompletedHeader = index === pending.length && completed.length > 0;
            return (
              <>
                {showCompletedHeader && (
                  <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.7)", marginTop: 16 }]}>Completed</Text>
                )}
                <View style={[styles.reminderCard, { backgroundColor: cardBg, borderColor: isCompleted ? cardBorder : "#D4A017" + "30" }]}>
                  <Pressable
                    onPress={() => !isCompleted && completeReminder(item.id)}
                    style={({ pressed }) => [
                      styles.checkbox,
                      {
                        borderColor: isCompleted ? "#00C9A7" : "#D4A017",
                        backgroundColor: isCompleted ? "#00C9A7" + "20" : "transparent",
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {isCompleted && <MaterialIcons name={"check" as any} size={14} color="#00C9A7" />}
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderTitle, { color: "#FFFFFF", textDecorationLine: isCompleted ? "line-through" : "none" }]}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.reminderDesc, { color: "rgba(255,255,255,0.7)" }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={[styles.reminderDate, { color: "#D4A017" }]}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => deleteReminder(item.id)}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                  >
                    <MaterialIcons name={"delete" as any} size={16} color={"rgba(255,255,255,0.4)"} />
                  </Pressable>
                </View>
              </>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  sectionLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  addCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  addTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { fontSize: 15, fontWeight: "600" },
  reminderDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  reminderDate: { fontSize: 12, fontWeight: "600", marginTop: 4 },
});
