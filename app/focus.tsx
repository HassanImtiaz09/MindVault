import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppState } from "@/lib/app-state";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from "react-native-reanimated";

const DURATIONS = [15, 25, 45, 60, 90];

export default function FocusScreen() {
  const router = useRouter();
  const { folderId, folderName } = useLocalSearchParams<{ folderId: string; folderName: string }>();
  const { activeFocusSession, startFocusSession, endFocusSession, canUseFeature } = useAppState();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Breathing animation for the focus ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isRunning && !isPaused) {
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isRunning, isPaused]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleStart = useCallback(() => {
    if (!canUseFeature("focus_mode")) {
      router.push("/subscription" as any);
      return;
    }
    const seconds = selectedDuration * 60;
    setTimeLeft(seconds);
    setIsRunning(true);
    setIsPaused(false);
    if (folderId && folderName) {
      startFocusSession(folderId, folderName, selectedDuration);
    }
  }, [selectedDuration, folderId, folderName, startFocusSession, canUseFeature, router]);

  const handlePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const handleStop = useCallback(() => {
    Alert.alert("End Focus Session?", "Your session progress will be saved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Session",
        style: "destructive",
        onPress: () => {
          setIsRunning(false);
          setIsPaused(false);
          setTimeLeft(0);
          endFocusSession();
          if (intervalRef.current) clearInterval(intervalRef.current);
        },
      },
    ]);
  }, [endFocusSession]);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            endFocusSession();
            if (Platform.OS !== "web") {
              try {
                const Haptics = require("expo-haptics");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
            Alert.alert("Focus Session Complete!", `Great work! You focused for ${selectedDuration} minutes.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, timeLeft, selectedDuration, endFocusSession]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = isRunning ? 1 - timeLeft / (selectedDuration * 60) : 0;
  const captured = activeFocusSession?.capturedMemoryIds.length ?? 0;

  return (
    <CinematicScreen screenName="focus" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Focus Mode</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.content}>
        {/* Folder info */}
        {folderName && (
          <View style={[styles.folderBadge, { backgroundColor: "#FFD700" + "15" }]}>
            <MaterialIcons name={"folder" as any} size={16} color={"#FFD700"} />
            <Text style={[styles.folderName, { color: "#FFD700" }]}>{folderName}</Text>
          </View>
        )}

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <Animated.View style={[styles.pulseRing, { borderColor: "#FFD700" }, pulseStyle]} />
          <View style={[styles.timerCircle, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "#FFD700" + "30" }]}>
            {isRunning ? (
              <>
                <Text style={[styles.timerText, { color: "#FFFFFF" }]}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </Text>
                <Text style={[styles.timerLabel, { color: "rgba(255,255,255,0.4)" }]}>
                  {isPaused ? "Paused" : "Focusing..."}
                </Text>
                {captured > 0 && (
                  <View style={[styles.capturedBadge, { backgroundColor: "#FFD700" + "15" }]}>
                    <Text style={{ fontSize: 12, color: "#FFD700", fontWeight: "600" }}>
                      {captured} captured
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <MaterialIcons name={"my-location" as any} size={48} color={"#FFD700"} />
                <Text style={[styles.readyText, { color: "#FFFFFF" }]}>Ready to Focus</Text>
                <Text style={[styles.readySubtext, { color: "rgba(255,255,255,0.4)" }]}>
                  Deep work, no distractions
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Duration Selection */}
        {!isRunning && (
          <View style={styles.durationSection}>
            <Text style={[styles.durationLabel, { color: "rgba(255,255,255,0.4)" }]}>Session Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDuration(d)}
                  style={({ pressed }) => [
                    styles.durationChip,
                    {
                      backgroundColor: selectedDuration === d ? "#FFD700" : "rgba(255,255,255,0.04)",
                      borderColor: selectedDuration === d ? "#FFD700" : "rgba(255,215,0,0.12)",
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: selectedDuration === d ? "#fff" : "#FFFFFF",
                    }}
                  >
                    {d}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: selectedDuration === d ? "#ffffffCC" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    min
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Progress bar */}
        {isRunning && (
          <View style={[styles.progressBar, { backgroundColor: "rgba(255,215,0,0.12)" }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: "#FFD700", width: `${progress * 100}%` },
              ]}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {!isRunning ? (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: "#FFD700" },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <MaterialIcons name={"play-arrow" as any} size={22} color="#fff" />
              <Text style={styles.startBtnText}>Start Focus Session</Text>
            </Pressable>
          ) : (
            <View style={styles.controlRow}>
              <Pressable
                onPress={handlePause}
                style={({ pressed }) => [
                  styles.controlBtn,
                  { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,215,0,0.12)" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name={isPaused ? ("play-arrow" as any) : ("pause" as any)} size={24} color={"#FFFFFF"} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/capture")}
                style={({ pressed }) => [
                  styles.captureBtn,
                  { backgroundColor: "#FFD700" },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
              >
                <MaterialIcons name={"add-circle" as any} size={22} color="#fff" />
                <Text style={styles.captureBtnText}>Quick Capture</Text>
              </Pressable>
              <Pressable
                onPress={handleStop}
                style={({ pressed }) => [
                  styles.controlBtn,
                  { backgroundColor: "#FF6B6B" + "15", borderColor: "#FF6B6B" + "30" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name={"stop" as any} size={24} color={"#FF6B6B"} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Tips */}
        {!isRunning && (
          <View style={[styles.tipsCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,215,0,0.12)" }]}>
            <MaterialIcons name={"eco" as any} size={18} color={"#FFD700"} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: "#FFFFFF" }]}>Focus Tips</Text>
              <Text style={[styles.tipText, { color: "rgba(255,255,255,0.4)" }]}>
                Put your phone on Do Not Disturb. Capture ideas quickly during your session — they'll be saved to your paired folder.
              </Text>
            </View>
          </View>
        )}
      </View>
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
  content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 20 },
  folderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  folderName: { fontSize: 14, fontWeight: "600" },
  timerContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  pulseRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timerText: { fontSize: 48, fontWeight: "200", letterSpacing: 2 },
  timerLabel: { fontSize: 14, fontWeight: "500" },
  capturedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  readyText: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  readySubtext: { fontSize: 13 },
  durationSection: { alignItems: "center", marginBottom: 28 },
  durationLabel: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  durationRow: { flexDirection: "row", gap: 10 },
  durationChip: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: { width: "100%", height: 4, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: "100%", borderRadius: 2 },
  actionRow: { width: "100%", marginBottom: 24 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  startBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  captureBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  tipsCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    width: "100%",
  },
  tipTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  tipText: { fontSize: 13, lineHeight: 19 },
});
