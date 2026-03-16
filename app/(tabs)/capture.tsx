import { useState, useCallback } from "react";
import { ScrollView, Text, View, TextInput, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

type CaptureMode = "text" | "voice" | "image" | "document" | "link";

const MODES: { key: CaptureMode; label: string; icon: any }[] = [
  { key: "text", label: "Note", icon: "text.alignleft" },
  { key: "voice", label: "Voice", icon: "mic.fill" },
  { key: "image", label: "Image", icon: "camera.fill" },
  { key: "document", label: "PDF", icon: "doc.fill" },
  { key: "link", label: "Link", icon: "link" },
];

export default function CaptureScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
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
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const createMutation = trpc.memories.create.useMutation();
  const utils = trpc.useUtils();

  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setUrl("");
    setSelectedFile(null);
    setRecordingUri(null);
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
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  }, [title]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
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
        if (!title) setTitle(asset.name.replace(/\.pdf$/i, ""));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  }, [title]);

  const handleStartRecording = useCallback(async () => {
    try {
      const { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, RecordingPresets } = await import("expo-audio");
      const status = await requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission Required", "Microphone access is needed to record voice notes.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      setIsRecording(true);
      if (!title) setTitle(`Voice Note - ${new Date().toLocaleDateString()}`);
    } catch (err) {
      Alert.alert("Error", "Voice recording is not available on this platform. Try adding a text note instead.");
    }
  }, [title]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please add a title for your memory.");
      return;
    }
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        type: mode,
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
    } catch (err) {
      Alert.alert("Error", "Failed to save memory. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [title, content, url, mode, selectedFile, createMutation, utils, resetForm]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <IconSymbol name="plus.circle.fill" size={48} color={colors.muted} />
        <Text className="text-lg text-muted mt-4 text-center">Sign in to start capturing memories</Text>
      </ScreenContainer>
    );
  }

  if (saved) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <View className="items-center gap-4">
          <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
          <Text className="text-2xl font-bold text-foreground">Saved!</Text>
          <Text className="text-base text-muted text-center">
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Capture</Text>
          <Text className="text-sm text-muted mt-1">Save a thought, file, or link to your knowledge base</Text>
        </View>

        {/* Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={styles.modeRow}>
            {MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => { setMode(m.key); setSelectedFile(null); setRecordingUri(null); }}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    backgroundColor: mode === m.key ? colors.primary : colors.surface,
                    borderColor: mode === m.key ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <IconSymbol
                  name={m.icon}
                  size={18}
                  color={mode === m.key ? "#fff" : colors.muted}
                />
                <Text
                  style={[
                    styles.modeLabel,
                    { color: mode === m.key ? "#fff" : colors.muted },
                  ]}
                >
                  {m.label}
                </Text>
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
            style={[
              styles.textInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
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
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                ]}
              />
            </>
          )}

          {mode === "voice" && (
            <View style={[styles.voiceArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {isRecording ? (
                <View className="items-center gap-3">
                  <IconSymbol name="waveform" size={48} color={colors.error} />
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>Recording...</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
                    Voice recording requires the native app. For now, you can type a note about what you would record.
                  </Text>
                  <Pressable
                    onPress={() => setIsRecording(false)}
                    style={({ pressed }) => [
                      styles.recordBtn,
                      { backgroundColor: colors.error },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Stop</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center gap-3">
                  <IconSymbol name="mic.fill" size={48} color={colors.primary} />
                  <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
                    Tap to start recording a voice memo. Your recording will be transcribed by AI.
                  </Text>
                  <Pressable
                    onPress={handleStartRecording}
                    style={({ pressed }) => [
                      styles.recordBtn,
                      { backgroundColor: colors.primary },
                      pressed && { opacity: 0.8 },
                    ]}
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
                style={[
                  styles.textArea,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 16 },
                ]}
              />
            </View>
          )}

          {mode === "image" && (
            <View>
              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.filePickerArea,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {selectedFile ? (
                  <View className="items-center gap-2">
                    <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>{selectedFile.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>Tap to change</Text>
                  </View>
                ) : (
                  <View className="items-center gap-2">
                    <IconSymbol name="photo.fill" size={40} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>Select Image or Screenshot</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>AI will extract text and key info</Text>
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
                style={[
                  styles.textAreaSmall,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 },
                ]}
              />
            </View>
          )}

          {mode === "document" && (
            <View>
              <Pressable
                onPress={handlePickDocument}
                style={({ pressed }) => [
                  styles.filePickerArea,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {selectedFile ? (
                  <View className="items-center gap-2">
                    <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>{selectedFile.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>Tap to change</Text>
                  </View>
                ) : (
                  <View className="items-center gap-2">
                    <IconSymbol name="doc.fill" size={40} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontWeight: "600" }}>Select PDF Document</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>AI will summarize and extract key info</Text>
                  </View>
                )}
              </Pressable>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Add notes about this document..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[
                  styles.textAreaSmall,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 },
                ]}
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
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                ]}
                returnKeyType="done"
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Add notes about this link..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={[
                  styles.textAreaSmall,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, marginTop: 12 },
                ]}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  modeLabel: { fontSize: 14, fontWeight: "600" },
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
});
