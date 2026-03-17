import { useState, useCallback } from "react";
import { ScrollView, Text, View, TextInput, Pressable, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import { CinematicScreen, GoldenCard, useParallax } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import { TooltipBubble } from "@/components/tooltip-bubble";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";

type CaptureMode = "text" | "voice" | "image" | "document" | "link" | "scan";

const MODES: { key: CaptureMode; label: string; icon: string; color: string; proOnly?: boolean }[] = [
  { key: "text", label: "Note", icon: "edit-note", color: "#FFD700" },
  { key: "image", label: "Image", icon: "image", color: "#FFA500" },
  { key: "document", label: "Docs", icon: "description", color: "#4FC3F7" },
  { key: "scan", label: "Scan", icon: "document-scanner", color: "#CE93D8", proOnly: true },
  { key: "link", label: "Link", icon: "link", color: "#81C784" },
  { key: "voice", label: "Voice", icon: "mic", color: "#FF6B6B" },
];

export default function CaptureScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest, canUseFeature, subscription } = useAppState();
  const parallax = useParallax();
  const [mode, setMode] = useState<CaptureMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const createMutation = trpc.memories.create.useMutation();
  const utils = trpc.useUtils();
  const isLoggedIn = isAuthenticated || isGuest;

  const resetForm = useCallback(() => {
    setTitle(""); setContent(""); setUrl(""); setSelectedFile(null); setIsRecording(false); setSaved(false);
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({ name: `image-${Date.now()}.jpg`, base64: asset.base64 || "", mimeType: asset.mimeType || "image/jpeg" });
        if (!title) setTitle(`Image - ${new Date().toLocaleDateString()}`);
      }
    } catch { Alert.alert("Error", "Failed to pick image"); }
  }, [title]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/msword", "application/vnd.ms-powerpoint"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let base64 = "";
        if (Platform.OS !== "web") {
          base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        }
        setSelectedFile({ name: asset.name, base64, mimeType: asset.mimeType || "application/pdf" });
        if (!title) setTitle(asset.name.replace(/\.(pdf|docx?|pptx?)$/i, ""));
      }
    } catch { Alert.alert("Error", "Failed to pick document"); }
  }, [title]);

  const handleScanDocument = useCallback(async () => {
    if (!canUseFeature("document_analysis")) {
      Alert.alert("Pro Feature", "Document scanning is a Pro feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Upgrade", onPress: () => router.push("/subscription" as any) },
      ]);
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Camera access is needed."); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.9, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({ name: `scan-${Date.now()}.jpg`, base64: asset.base64 || "", mimeType: "image/jpeg" });
        if (!title) setTitle(`Scanned Document - ${new Date().toLocaleDateString()}`);
        setMode("image");
      }
    } catch { Alert.alert("Error", "Failed to scan document."); }
  }, [title, canUseFeature, router]);

  const handleStartRecording = useCallback(async () => {
    try {
      const { requestRecordingPermissionsAsync, setAudioModeAsync } = await import("expo-audio");
      const status = await requestRecordingPermissionsAsync();
      if (!status.granted) { Alert.alert("Permission Required", "Microphone access is needed."); return; }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      setIsRecording(true);
      if (!title) setTitle(`Voice Note - ${new Date().toLocaleDateString()}`);
    } catch { Alert.alert("Error", "Voice recording is not available on this platform."); }
  }, [title]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) { Alert.alert("Title Required", "Please add a title."); return; }
    if (!isAuthenticated && !isGuest) { Alert.alert("Sign In Required", "Please sign in or use guest mode."); return; }
    setSaving(true);
    try {
      const effectiveMode = mode === "scan" ? "image" : mode;
      await createMutation.mutateAsync({
        type: effectiveMode as any, title: title.trim(), content: content.trim() || undefined,
        sourceUrl: mode === "link" ? url.trim() : undefined,
        fileBase64: selectedFile?.base64, fileName: selectedFile?.name, fileMimeType: selectedFile?.mimeType,
      });
      utils.memories.list.invalidate(); utils.memories.recent.invalidate(); utils.memories.stats.invalidate();
      setSaved(true);
      setTimeout(() => resetForm(), 2000);
    } catch { Alert.alert("Error", "Failed to save memory."); } finally { setSaving(false); }
  }, [title, content, url, mode, selectedFile, createMutation, utils, resetForm, isAuthenticated, isGuest]);

  const handleModeSelect = useCallback((modeKey: CaptureMode) => {
    if (modeKey === "scan") { handleScanDocument(); return; }
    setMode(modeKey); setSelectedFile(null); setIsRecording(false);
  }, [handleScanDocument]);

  if (!isLoggedIn) {
    return (
      <CinematicScreen screenName="capture">
        <View style={styles.centerFull}>
          <MaterialIcons name="add-circle" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.loginText}>Sign in to start capturing memories</Text>
        </View>
      </CinematicScreen>
    );
  }

  if (saved) {
    return (
      <CinematicScreen screenName="capture">
        <View style={styles.centerFull}>
          <View style={styles.successGlow}>
            <MaterialIcons name="check-circle" size={64} color="#81C784" />
          </View>
          <GoldenText variant="title">Saved!</GoldenText>
          <Text style={styles.successSub}>AI is processing your memory in the background.</Text>
          <GoldenButton title="Capture Another" onPress={resetForm} variant="outline" icon="add" size="medium" fullWidth={false} />
        </View>
      </CinematicScreen>
    );
  }

  const currentMode = MODES.find((m) => m.key === mode)!;

  return (
    <CinematicScreen screenName="capture">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" onScroll={parallax?.onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <GoldenText variant="title" style={{ textAlign: "left" }}>Capture</GoldenText>
          <Text style={styles.headerSub}>Save a thought, file, or link to your knowledge base</Text>
        </View>

        <TooltipBubble tipId="capture_text" text="Choose a capture mode below — text, image, document, link, scan, or voice. AI processes everything automatically!" position="bottom" arrowSide="left" />

        {/* Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => handleModeSelect(m.key)}
                  style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                >
                  <LinearGradient
                    colors={active ? [`${m.color}`, `${m.color}CC`] : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
                    style={[styles.modeChip, { borderColor: active ? m.color : "rgba(255,255,255,0.1)" }]}
                  >
                    <MaterialIcons name={m.icon as any} size={18} color={active ? "#0A0E1A" : m.color} />
                    <Text style={[styles.modeLabel, { color: active ? "#0A0E1A" : "rgba(255,255,255,0.6)" }]}>{m.label}</Text>
                    {m.proOnly && subscription !== "pro" && <MaterialIcons name="workspace-premium" size={12} color="#FFD700" />}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your memory a title..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.textInput}
            returnKeyType="done"
          />
        </View>

        {/* Mode-specific content */}
        <View style={styles.inputSection}>
          {mode === "text" && (
            <>
              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your thoughts..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                textAlignVertical="top"
                style={styles.textArea}
              />
            </>
          )}

          {mode === "voice" && (
            <GoldenCard>
              {isRecording ? (
                <View style={styles.centeredContent}>
                  <MaterialIcons name="graphic-eq" size={48} color="#FF6B6B" />
                  <Text style={styles.voiceTitle}>Recording...</Text>
                  <Text style={styles.voiceHint}>Voice recording requires the native app.</Text>
                  <Pressable onPress={() => setIsRecording(false)} style={({ pressed }) => [styles.recordBtn, { backgroundColor: "#FF6B6B" }, pressed && { opacity: 0.8 }]}>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Stop</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.centeredContent}>
                  <MaterialIcons name="mic" size={48} color="#FFD700" />
                  <Text style={styles.voiceHint}>Tap to start recording. AI will transcribe automatically.</Text>
                  <Pressable onPress={handleStartRecording} style={({ pressed }) => [styles.recordBtn, pressed && { opacity: 0.8 }]}>
                    <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.recordBtnGrad}>
                      <MaterialIcons name="mic" size={20} color="#0A0E1A" />
                      <Text style={{ color: "#0A0E1A", fontWeight: "700" }}>Start Recording</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Or type a note about what you'd record..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { marginTop: 16 }]}
              />
            </GoldenCard>
          )}

          {mode === "image" && (
            <View>
              <Pressable onPress={handlePickImage} style={({ pressed }) => [styles.filePicker, pressed && { opacity: 0.7 }]}>
                {selectedFile ? (
                  <View style={styles.centeredContent}>
                    <MaterialIcons name="check-circle" size={40} color="#81C784" />
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileHint}>Tap to change</Text>
                  </View>
                ) : (
                  <View style={styles.centeredContent}>
                    <MaterialIcons name="add-photo-alternate" size={40} color="#FFA500" />
                    <Text style={styles.fileName}>Select Image or Screenshot</Text>
                    <Text style={styles.fileHint}>AI will extract text and key info</Text>
                  </View>
                )}
              </Pressable>
              <TextInput value={content} onChangeText={setContent} placeholder="Add a note about this image..." placeholderTextColor="rgba(255,255,255,0.25)" multiline textAlignVertical="top" style={[styles.textAreaSmall, { marginTop: 12 }]} />
            </View>
          )}

          {mode === "document" && (
            <View>
              <Pressable onPress={handlePickDocument} style={({ pressed }) => [styles.filePicker, pressed && { opacity: 0.7 }]}>
                {selectedFile ? (
                  <View style={styles.centeredContent}>
                    <MaterialIcons name="check-circle" size={40} color="#81C784" />
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileHint}>Tap to change</Text>
                  </View>
                ) : (
                  <View style={styles.centeredContent}>
                    <MaterialIcons name="upload-file" size={40} color="#4FC3F7" />
                    <Text style={styles.fileName}>Select Document</Text>
                    <Text style={styles.fileHint}>PDF, DOCX, or PowerPoint — AI will summarize</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.aiHint}>
                <MaterialIcons name="auto-awesome" size={14} color="#FFD700" />
                <Text style={styles.aiHintText}>Upload contracts, prescriptions, reports — AI analyzes and summarizes in simple terms.</Text>
              </View>
              <TextInput value={content} onChangeText={setContent} placeholder="Add notes about this document..." placeholderTextColor="rgba(255,255,255,0.25)" multiline textAlignVertical="top" style={[styles.textAreaSmall, { marginTop: 12 }]} />
            </View>
          )}

          {mode === "link" && (
            <View>
              <Text style={styles.inputLabel}>URL</Text>
              <TextInput value={url} onChangeText={setUrl} placeholder="https://example.com/article" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="none" keyboardType="url" style={styles.textInput} returnKeyType="done" />
              <TextInput value={content} onChangeText={setContent} placeholder="Add notes about this link..." placeholderTextColor="rgba(255,255,255,0.25)" multiline textAlignVertical="top" style={[styles.textAreaSmall, { marginTop: 12 }]} />
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <GoldenButton title={saving ? "Saving..." : "SAVE & PROCESS WITH AI"} onPress={handleSave} disabled={saving} icon="auto-awesome" variant="primary" />
        </View>
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  centerFull: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  loginText: { fontSize: 16, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  successGlow: { marginBottom: 8 },
  successSub: { fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  modeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  modeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1, gap: 6 },
  modeLabel: { fontSize: 13, fontWeight: "600" },
  inputSection: { paddingHorizontal: 20, marginTop: 16 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginBottom: 8, letterSpacing: 0.5 },
  textInput: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", color: "#FFFFFF" },
  textArea: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", color: "#FFFFFF", minHeight: 160 },
  textAreaSmall: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(8,12,28,0.88)", color: "#FFFFFF", minHeight: 80 },
  centeredContent: { alignItems: "center", gap: 8, paddingVertical: 8 },
  voiceTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  voiceHint: { fontSize: 14, textAlign: "center", color: "rgba(255,255,255,0.7)" },
  recordBtn: { borderRadius: 24, overflow: "hidden", marginTop: 8 },
  recordBtnGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  filePicker: { padding: 32, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,215,0,0.25)", backgroundColor: "rgba(8,12,28,0.88)", alignItems: "center" },
  fileName: { fontWeight: "600", color: "#FFFFFF" },
  fileHint: { fontSize: 13, textAlign: "center", color: "rgba(255,255,255,0.35)" },
  aiHint: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,215,0,0.22)", backgroundColor: "rgba(15,20,40,0.88)", gap: 8, marginTop: 12 },
  aiHintText: { fontSize: 12, lineHeight: 18, flex: 1, color: "rgba(255,255,255,0.75)" },
});
