import { useState, useCallback } from "react";
import { ScrollView, Text, View, TextInput, Pressable, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import { GlassScreen, GlassCard } from "@/components/glass-screen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useAppState } from "@/lib/app-state";
import { TutorialTip } from "@/components/tutorial-tip";
import { useRouter } from "expo-router";

type CaptureMode = "text" | "voice" | "image" | "document" | "link" | "scan";

const MODES: { key: CaptureMode; label: string; icon: any; proOnly?: boolean }[] = [
  { key: "text", label: "Note", icon: "text.alignleft" },
  { key: "image", label: "Image", icon: "camera.fill" },
  { key: "document", label: "Docs", icon: "doc.fill" },
  { key: "scan", label: "Scan", icon: "scanner.fill", proOnly: true },
  { key: "link", label: "Link", icon: "link" },
  { key: "voice", label: "Voice", icon: "mic.fill" },
];

export default function CaptureScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isGuest, canUseFeature, subscription } = useAppState();
  const cardBg = isDark ? "rgba(20,35,28,0.55)" : "rgba(255,255,255,0.45)";
  const cardBorder = isDark ? "rgba(0,201,167,0.15)" : "rgba(0,201,167,0.2)";
  const [mode, setMode] = useState<CaptureMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const createMutation = trpc.memories.create.useMutation();
  const utils = trpc.useUtils();

  const isLoggedIn = isAuthenticated || isGuest;

  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setUrl("");
    setSelectedFile(null);
    setIsRecording(false);
    setSaved(false);
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          name: `image-${Date.now()}.jpg`,
          base64: asset.base64 || "",
          mimeType: asset.mimeType || "image/jpeg",
        });
        if (!title) setTitle(`Image - ${new Date().toLocaleDateString()}`);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  }, [title]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/msword",
          "application/vnd.ms-powerpoint",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let base64 = "";
        if (Platform.OS !== "web") {
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        setSelectedFile({
          name: asset.name,
          base64,
          mimeType: asset.mimeType || "application/pdf",
        });
        if (!title) setTitle(asset.name.replace(/\.(pdf|docx?|pptx?)$/i, ""));
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  }, [title]);

  const handleScanDocument = useCallback(async () => {
    if (!canUseFeature("document_analysis")) {
      Alert.alert("Pro Feature", "Document scanning and AI analysis is a Pro feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Upgrade", onPress: () => router.push("/subscription" as any) },
      ]);
      return;
    }
    // Use camera to capture document
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to scan documents.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          name: `scan-${Date.now()}.jpg`,
          base64: asset.base64 || "",
          mimeType: "image/jpeg",
        });
        if (!title) setTitle(`Scanned Document - ${new Date().toLocaleDateString()}`);
        setMode("image"); // Process as image for OCR
      }
    } catch {
      Alert.alert("Error", "Failed to scan document. Try picking an image instead.");
    }
  }, [title, canUseFeature, router]);

  const handleStartRecording = useCallback(async () => {
    try {
      const { requestRecordingPermissionsAsync, setAudioModeAsync } = await import("expo-audio");
      const status = await requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission Required", "Microphone access is needed to record voice notes.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      setIsRecording(true);
      if (!title) setTitle(`Voice Note - ${new Date().toLocaleDateString()}`);
    } catch {
      Alert.alert("Error", "Voice recording is not available on this platform. Try adding a text note instead.");
    }
  }, [title]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please add a title for your memory.");
      return;
    }
    if (!isAuthenticated && !isGuest) {
      Alert.alert("Sign In Required", "Please sign in or use guest mode to save memories.");
      return;
    }
    setSaving(true);
    try {
      const effectiveMode = mode === "scan" ? "image" : mode;
      await createMutation.mutateAsync({
        type: effectiveMode as any,
        title: title.trim(),
        content: content.trim() || undefined,
        sourceUrl: mode === "link" ? url.trim() : undefined,
        fileBase64: selectedFile?.base64,
        fileName: selectedFile?.name,
        fileMimeType: selectedFile?.mimeType,
      });
      utils.memories.list.invalidate();
      utils.memories.recent.invalidate();
      utils.memories.stats.invalidate();
      setSaved(true);
      setTimeout(() => resetForm(), 2000);
    } catch {
      Alert.alert("Error", "Failed to save memory. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [title, content, url, mode, selectedFile, createMutation, utils, resetForm, isAuthenticated, isGuest]);

  const handleModeSelect = useCallback((modeKey: CaptureMode) => {
    if (modeKey === "scan") {
      handleScanDocument();
      return;
    }
    setMode(modeKey);
    setSelectedFile(null);
    setIsRecording(false);
  }, [handleScanDocument]);

  if (!isLoggedIn) {
    return (
      <GlassScreen screenName="capture" className="flex-1 items-center justify-center p-6">
        <IconSymbol name="plus.circle.fill" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to start capturing memories</Text>
      </GlassScreen>
    );
  }

  if (saved) {
    return (
      <GlassScreen screenName="capture" className="flex-1 items-center justify-center p-6">
        <View style={styles.savedContainer}>
          <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
          <Text style={[styles.savedTitle, { color: colors.foreground }]}>Saved!</Text>
          <Text style={[styles.savedSubtitle, { color: colors.muted }]}>
            AI is processing your memory in the background.
          </Text>
          <Pressable
            onPress={resetForm}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>Capture Another</Text>
          </Pressable>
        </View>
      </GlassScreen>
    );
  }

  return (
    <GlassScreen screenName="capture">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Capture</Text>
          <Text className="text-sm text-muted mt-1">Save a thought, file, or link to your knowledge base</Text>
        </View>

        {/* Tutorial Tip */}
        <TutorialTip
          tipKey="capture_intro"
          icon="plus.circle.fill"
          iconColor="#00D2D3"
          title="Quick Capture"
          message="Choose a capture mode below. You can save text notes, images, documents (PDF, DOCX), web links, or scan physical documents."
        />

        {/* Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={styles.modeRow}>
            {MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => handleModeSelect(m.key)}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    backgroundColor: mode === m.key ? colors.primary : colors.surface,
                    borderColor: mode === m.key ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <IconSymbol name={m.icon} size={18} color={mode === m.key ? "#fff" : colors.muted} />
                <Text style={[styles.modeLabel, { color: mode === m.key ? "#fff" : colors.muted }]}>
                  {m.label}
                </Text>
                {m.proOnly && subscription !== "pro" && (
                  <IconSymbol name="crown.fill" size={12} color="#FDCB6E" />
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Title Input */}
        <View className="px-5 mt-5">
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your memory a title..."
            placeholderTextColor={colors.muted}
            style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            returnKeyType="done"
          />
        </View>

        {/* Mode-specific content */}
        <View className="px-5 mt-4">
          {mode === "text" && (
            <>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Note</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your thoughts..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              />
            </>
          )}

          {mode === "voice" && (
            <View style={[styles.voiceArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isRecording ? (
                <View style={styles.centeredContent}>
                  <IconSymbol name="waveform" size={48} color={colors.error} />
                  <Text style={[styles.voiceTitle, { color: colors.foreground }]}>Recording...</Text>
                  <Text style={[styles.voiceHint, { color: colors.muted }]}>
                    Voice recording requires the native app. For now, type a note about what you would record.
                  </Text>
                  <Pressable
                    onPress={() => setIsRecording(false)}
                    style={({ pressed }) => [styles.recordBtn, { backgroundColor: colors.error }, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Stop</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.centeredContent}>
                  <IconSymbol name="mic.fill" size={48} color={colors.primary} />
                  <Text style={[styles.voiceHint, { color: colors.muted }]}>
                    Tap to start recording a voice memo. Your recording will be transcribed by AI.
                  </Text>
                  <Pressable
                    onPress={handleStartRecording}
                    style={({ pressed }) => [styles.recordBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
                  >
                    <IconSymbol name="mic.fill" size={20} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Start Recording</Text>
                  </Pressable>
                </View>
              )}
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Or type a note about what you'd record..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 16 }]}
              />
            </View>
          )}

          {mode === "image" && (
            <View>
              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [styles.filePickerArea, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                {selectedFile ? (
                  <View style={styles.centeredContent}>
                    <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
                    <Text style={[styles.fileSelectedName, { color: colors.foreground }]}>{selectedFile.name}</Text>
                    <Text style={[styles.fileHint, { color: colors.muted }]}>Tap to change</Text>
                  </View>
                ) : (
                  <View style={styles.centeredContent}>
                    <IconSymbol name="photo.fill" size={40} color={colors.primary} />
                    <Text style={[styles.fileSelectedName, { color: colors.foreground }]}>Select Image or Screenshot</Text>
                    <Text style={[styles.fileHint, { color: colors.muted }]}>AI will extract text and key info</Text>
                  </View>
                )}
              </Pressable>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Add a note about this image..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textAreaSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
              />
            </View>
          )}

          {mode === "document" && (
            <View>
              <Pressable
                onPress={handlePickDocument}
                style={({ pressed }) => [styles.filePickerArea, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                {selectedFile ? (
                  <View style={styles.centeredContent}>
                    <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
                    <Text style={[styles.fileSelectedName, { color: colors.foreground }]}>{selectedFile.name}</Text>
                    <Text style={[styles.fileHint, { color: colors.muted }]}>Tap to change</Text>
                  </View>
                ) : (
                  <View style={styles.centeredContent}>
                    <IconSymbol name="doc.fill" size={40} color={colors.primary} />
                    <Text style={[styles.fileSelectedName, { color: colors.foreground }]}>Select Document</Text>
                    <Text style={[styles.fileHint, { color: colors.muted }]}>
                      PDF, DOCX, or PowerPoint — AI will summarize and extract key info
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Document Analysis Hint */}
              <View style={[styles.hintCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
                <IconSymbol name="sparkles" size={14} color={colors.primary} />
                <Text style={[styles.hintText, { color: colors.muted }]}>
                  Upload contracts, prescriptions, blood reports, or any document. AI will analyze and summarize in simple terms.
                </Text>
              </View>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Add notes about this document..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textAreaSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
              />
            </View>
          )}

          {mode === "link" && (
            <View>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>URL</Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com/article"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="url"
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                returnKeyType="done"
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Add notes about this link..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[styles.textAreaSmall, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
              />
            </View>
          )}
        </View>

        {/* Save Button */}
        <View className="px-5 mt-6">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              saving && { opacity: 0.6 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="sparkles" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save & Process with AI</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  modeLabel: { fontSize: 13, fontWeight: "600" },
  inputLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 160,
  },
  textAreaSmall: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  voiceArea: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  centeredContent: { alignItems: "center", gap: 8 },
  voiceTitle: { fontSize: 16, fontWeight: "600" },
  voiceHint: { fontSize: 14, textAlign: "center" },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  filePickerArea: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
  },
  fileSelectedName: { fontWeight: "600" },
  fileHint: { fontSize: 13, textAlign: "center" },
  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },
  hintText: { fontSize: 12, lineHeight: 18, flex: 1 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  savedContainer: { alignItems: "center", gap: 12 },
  savedTitle: { fontSize: 24, fontWeight: "700" },
  savedSubtitle: { fontSize: 15, textAlign: "center" },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
});
