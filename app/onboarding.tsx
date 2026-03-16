import { useState, useRef } from "react";
import { View, Text, Pressable, Dimensions, FlatList, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "brain" as const,
    iconColor: "#6C5CE7",
    title: "Welcome to MindVault",
    subtitle: "Your AI-powered second brain",
    description: "Capture ideas, documents, links, and voice notes. MindVault organizes everything and makes it searchable with AI.",
  },
  {
    icon: "sparkles" as const,
    iconColor: "#00D2D3",
    title: "Capture Everything",
    subtitle: "Multiple ways to save knowledge",
    description: "Save text notes, screenshots, images, voice recordings, PDFs, DOCX files, presentations, and web links — all in one place.",
  },
  {
    icon: "doc.text.magnifyingglass" as const,
    iconColor: "#FDCB6E",
    title: "AI-Powered Analysis",
    subtitle: "Understand your documents instantly",
    description: "Upload contracts, prescriptions, blood reports, or any document. AI analyzes and summarizes them in simple, clear language.",
  },
  {
    icon: "magnifyingglass" as const,
    iconColor: "#00B894",
    title: "Ask Questions Naturally",
    subtitle: "Your knowledge, on demand",
    description: 'Ask questions like "What did I learn about marketing?" or "Summarize my notes on investing" and get structured AI answers.',
  },
  {
    icon: "chart.bar.fill" as const,
    iconColor: "#FF6B6B",
    title: "Insights & Knowledge Graph",
    subtitle: "See how your knowledge connects",
    description: "Get weekly AI summaries, discover recurring themes, visualize topic connections, and generate new ideas from your knowledge.",
  },
  {
    icon: "folder.fill" as const,
    iconColor: "#6C5CE7",
    title: "Organize with Folders",
    subtitle: "Focus your analysis",
    description: "Create folders for different topics. AI analyzes folder contents to help you focus on what matters most to you.",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { completeOnboarding, setGuest } = useAppState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGetStarted = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleGuestMode = () => {
    setGuest(true);
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleSignIn = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Skip button */}
        {!isLast && (
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
          </Pressable>
        )}

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(idx);
          }}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: item.iconColor + "18" }]}>
                <IconSymbol name={item.icon} size={56} color={item.iconColor} />
              </View>
              <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: colors.primary }]}>{item.subtitle}</Text>
              <Text style={[styles.slideDescription, { color: colors.muted }]}>{item.description}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {isLast ? (
            <>
              <Pressable
                onPress={handleSignIn}
                style={({ pressed }) => [
                  styles.mainBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.mainBtnText}>Sign In & Get Started</Text>
              </Pressable>
              <Pressable
                onPress={handleGuestMode}
                style={({ pressed }) => [
                  styles.guestBtn,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.guestBtnText, { color: colors.muted }]}>Continue as Guest</Text>
              </Pressable>
              <Text style={[styles.guestNote, { color: colors.muted }]}>
                Guest mode stores data locally. Sign in to sync across devices.
              </Text>
            </>
          ) : (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.mainBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.mainBtnText}>Next</Text>
              <IconSymbol name="arrow.right" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: "absolute",
    top: 8,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: { fontSize: 15, fontWeight: "600" },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  mainBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  guestBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  guestNote: {
    fontSize: 12,
    textAlign: "center",
  },
});
