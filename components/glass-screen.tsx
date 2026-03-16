import { View, ImageBackground, StyleSheet, Platform } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Background images mapped to screen names
const BACKGROUNDS: Record<string, any> = {
  home: require("@/assets/images/backgrounds/home.jpg"),
  capture: require("@/assets/images/backgrounds/capture.jpg"),
  library: require("@/assets/images/backgrounds/library.jpg"),
  ask: require("@/assets/images/backgrounds/ask.jpg"),
  insights: require("@/assets/images/backgrounds/insights.jpg"),
  onboarding: require("@/assets/images/backgrounds/onboarding.jpg"),
  folders: require("@/assets/images/backgrounds/folders.jpg"),
  focus: require("@/assets/images/backgrounds/focus.jpg"),
  subscription: require("@/assets/images/backgrounds/subscription.jpg"),
  detail: require("@/assets/images/backgrounds/detail.jpg"),
};

export interface GlassScreenProps {
  children: React.ReactNode;
  screenName: keyof typeof BACKGROUNDS | string;
  edges?: Edge[];
  className?: string;
  /** 0-100, higher = more blur. Default 40 */
  blurIntensity?: number;
  /** Overlay opacity 0-1. Default 0.65 for dark, 0.55 for light */
  overlayOpacity?: number;
  /** Whether to show gradient overlay. Default true */
  showGradient?: boolean;
}

export function GlassScreen({
  children,
  screenName,
  edges = ["top", "left", "right"],
  className,
  blurIntensity = 40,
  overlayOpacity,
  showGradient = true,
}: GlassScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const finalOpacity = overlayOpacity ?? (isDark ? 0.72 : 0.6);
  const bgImage = BACKGROUNDS[screenName] || BACKGROUNDS.home;

  const overlayColor = isDark ? "rgba(10,18,15," : "rgba(240,255,248,";
  const gradientColors = isDark
    ? [`rgba(10,18,15,${finalOpacity})`, `rgba(5,30,20,${finalOpacity * 0.85})`, `rgba(10,18,15,${finalOpacity})`]
    : [`rgba(240,255,248,${finalOpacity})`, `rgba(230,250,240,${finalOpacity * 0.85})`, `rgba(240,255,248,${finalOpacity})`];

  return (
    <View style={styles.root}>
      {/* HD Background Image */}
      <ImageBackground
        source={bgImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Blur layer - native only, web uses CSS backdrop-filter */}
      {Platform.OS !== "web" ? (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? "dark" : "light"}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `${overlayColor}${finalOpacity * 0.7})`,
              backdropFilter: `blur(${blurIntensity * 0.4}px)`,
            } as any,
          ]}
        />
      )}

      {/* Gradient overlay for depth */}
      {showGradient && (
        <LinearGradient
          colors={gradientColors as any}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Content with SafeArea */}
      <SafeAreaView edges={edges} style={styles.safeArea}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

/**
 * A glass-morphism card component for use inside GlassScreen
 */
export function GlassCard({
  children,
  style,
  className: _className,
}: {
  children: React.ReactNode;
  style?: any;
  className?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: isDark ? "rgba(20,35,28,0.55)" : "rgba(255,255,255,0.45)",
          borderColor: isDark ? "rgba(0,201,167,0.15)" : "rgba(0,201,167,0.2)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
  },
});
