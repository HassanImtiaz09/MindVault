import { useState, useRef } from "react";
import { View, Text, Pressable, Dimensions, FlatList, StyleSheet, ImageBackground, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppState } from "@/lib/app-state";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const BG = require("@/assets/images/backgrounds/onboarding.jpg");

const SLIDES = [
  {
    icon: "brain" as const,
    iconColor: "#00C9A7",
    title: "Welcome to\nMindVault",
    subtitle: "Your AI-powered second brain",
    description: "Capture ideas, documents, links, and voice notes. MindVault organizes everything and makes it searchable with AI.",
    badge: null,
  },
  {
    icon: "sparkles" as const,
    iconColor: "#D4A017",
    title: "Capture\nEverything",
    subtitle: "Multiple ways to save knowledge",
    description: "Save text notes, screenshots, images, voice recordings, PDFs, DOCX files, presentations, and web links — all in one place.",
    badge: "6 input types",
  },
  {
    icon: "doc.text.magnifyingglass" as const,
    iconColor: "#00C9A7",
    title: "AI-Powered\nAnalysis",
    subtitle: "Understand your documents instantly",
    description: "Upload contracts, prescriptions, blood reports, or any document. AI analyzes and summarizes them in simple, clear language.",
    badge: "Smart AI",
  },
  {
    icon: "magnifyingglass" as const,
    iconColor: "#D4A017",
    title: "Ask Questions\nNaturally",
    subtitle: "Your knowledge, on demand",
    description: "Ask questions like \"What did I learn about marketing?\" or \"Summarize my notes on investing\" and get structured AI answers.",
    badge: "Natural language",
  },
  {
    icon: "chart.bar.fill" as const,
    iconColor: "#00C9A7",
    title: "Insights &\nKnowledge Graph",
    subtitle: "See how your knowledge connects",
    description: "Get weekly AI summaries, discover recurring themes, visualize topic connections, and generate new ideas from your knowledge.",
    badge: "Visual insights",
  },
  {
    icon: "folder.fill" as const,
    iconColor: "#D4A017",
    title: "Organize &\nCollaborate",
    subtitle: "Folders, tags, and team sharing",
    description: "Create folders for different topics, tag memories with custom labels, share folders with collaborators, and use Focus Mode for deep work.",
    badge: "Team ready",
  },
  {
    icon: "crown.fill" as const,
    iconColor: "#D4A017",
    title: "Unlock\nFull Power",
    subtitle: "Choose your plan",
    description: "",
    badge: "Special offer",
    isSubscription: true,
  },
];

const PRO_FEATURES = [
  { icon: "infinity" as const, text: "Unlimited memories & folders" },
  { icon: "mic.fill" as const, text: "Voice, image & document capture" },
  { icon: "scanner.fill" as const, text: "Contract & medical analysis" },
  { icon: "scope" as const, text: "Focus Mode & custom tags" },
  { icon: "square.and.arrow.down" as const, text: "Export & backup" },
  { icon: "bell.fill" as const, text: "Smart reminders & Daily Digest" },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { completeOnboarding, setGuest, setSubscription } = useAppState();
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
    const { startOAuthLogin } = require("@/lib/_core/auth");
    startOAuthLogin();
  };

  const handleSelectPro = () => {
    setSubscription("pro");
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const isLast = currentIndex === SLIDES.length - 1;

  const overlayColor = isDark ? "rgba(10,18,15,0.7)" : "rgba(240,255,248,0.55)";

  return (
    <View style={styles.root}>
      {/* Background image */}
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Blur overlay */}
      {Platform.OS !== "web" ? (
        <BlurView intensity={30} tint={isDark ? "dark" : "light"} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor, backdropFilter: "blur(12px)" } as any]} />
      )}

      <LinearGradient
        colors={isDark
          ? ["rgba(10,18,15,0.6)", "rgba(5,30,20,0.5)", "rgba(10,18,15,0.7)"]
          : ["rgba(240,255,248,0.5)", "rgba(230,250,240,0.4)", "rgba(240,255,248,0.6)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.safeArea}>
        {/* Skip button */}
        {!isLast && (
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.skipText, { color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }]}>Skip</Text>
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
              {(item as any).isSubscription ? (
                // Subscription upsell slide
                <View style={styles.subSlide}>
                  <View style={[styles.iconGlow, { backgroundColor: "#D4A017" + "20" }]}>
                    <IconSymbol name="crown.fill" size={48} color="#D4A017" />
                  </View>
                  <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.slideSubtitle, { color: "#D4A017" }]}>{item.subtitle}</Text>

                  {/* Pro features list */}
                  <View style={[styles.proCard, { backgroundColor: isDark ? "rgba(20,35,28,0.6)" : "rgba(255,255,255,0.5)", borderColor: "#D4A017" + "30" }]}>
                    {PRO_FEATURES.map((f, i) => (
                      <View key={i} style={styles.proRow}>
                        <IconSymbol name={f.icon} size={16} color="#D4A017" />
                        <Text style={[styles.proText, { color: colors.foreground }]}>{f.text}</Text>
                      </View>
                    ))}
                    <View style={styles.proPriceRow}>
                      <Text style={[styles.proPrice, { color: "#D4A017" }]}>$9.99</Text>
                      <Text style={[styles.proPeriod, { color: colors.muted }]}>/month</Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Regular feature slide
                <View style={styles.featureSlide}>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.iconColor + "20" }]}>
                      <Text style={[styles.badgeText, { color: item.iconColor }]}>{item.badge}</Text>
                    </View>
                  )}
                  <View style={[styles.iconGlow, { backgroundColor: item.iconColor + "18" }]}>
                    <IconSymbol name={item.icon} size={52} color={item.iconColor} />
                  </View>
                  <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.slideSubtitle, { color: item.iconColor }]}>{item.subtitle}</Text>
                  <Text style={[styles.slideDescription, { color: colors.muted }]}>{item.description}</Text>
                </View>
              )}
            </View>
          )}
        />

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? "#00C9A7" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"),
                  width: i === currentIndex ? 28 : 8,
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
                onPress={handleSelectPro}
                style={({ pressed }) => [
                  styles.proBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={["#D4A017", "#B8860B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proBtnGradient}
                >
                  <IconSymbol name="crown.fill" size={18} color="#fff" />
                  <Text style={styles.proBtnText}>Start Pro — $9.99/mo</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={handleSignIn}
                style={({ pressed }) => [
                  styles.mainBtn,
                  { backgroundColor: "#00C9A7" },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.mainBtnText}>Sign In — Free Plan</Text>
              </Pressable>
              <Pressable
                onPress={handleGuestMode}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.guestText, { color: colors.muted }]}>Continue as Guest</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.mainBtn,
                { backgroundColor: "#00C9A7" },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.mainBtnText}>Next</Text>
              <IconSymbol name="arrow.right" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
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
    paddingHorizontal: 32,
  },
  featureSlide: {
    alignItems: "center",
    gap: 8,
  },
  subSlide: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  iconGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  slideDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  proCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  proRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  proText: { fontSize: 14, fontWeight: "500" },
  proPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: 8,
    gap: 2,
  },
  proPrice: { fontSize: 32, fontWeight: "800" },
  proPeriod: { fontSize: 14 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
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
  proBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  proBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  proBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  guestText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 4,
  },
});
