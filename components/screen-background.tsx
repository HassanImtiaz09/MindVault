import { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { BACKGROUNDS } from "@/constants/images";
import { cn } from "@/lib/utils";

type ScreenBackgroundProps = {
  imageUrl: string;
  overlayOpacity?: number;
  goldenVignette?: boolean;
  animated?: boolean;
};

function ScreenBackgroundLayer({
  imageUrl,
  overlayOpacity = 0.55,
  goldenVignette = true,
  animated = true,
}: ScreenBackgroundProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      drift.value = withRepeat(
        withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const driftStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    return {
      transform: [
        { scale: 1.05 },
        { translateX: interpolate(drift.value, [0, 1], [-6, 6]) },
        { translateY: interpolate(drift.value, [0, 1], [-3, 3]) },
      ],
    };
  });

  const overlayAlpha = Math.round(overlayOpacity * 255)
    .toString(16)
    .padStart(2, "0");

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={600}
        />
      </Animated.View>
      <LinearGradient
        colors={[
          `#0A0E1A${overlayAlpha}`,
          `#0A0E1A${Math.round(overlayOpacity * 0.85 * 255)
            .toString(16)
            .padStart(2, "0")}`,
          `#0A0E1A${Math.round(Math.min(overlayOpacity * 1.1, 1) * 255)
            .toString(16)
            .padStart(2, "0")}`,
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {goldenVignette && (
        <>
          <LinearGradient
            colors={["rgba(255,200,50,0.08)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
            }}
          />
          <LinearGradient
            colors={["transparent", "rgba(255,180,30,0.06)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 160,
            }}
          />
        </>
      )}
    </View>
  );
}

/**
 * CinematicScreen — Full-screen wrapper with HD background, dark overlay,
 * golden vignette, and SafeArea handling. Replaces GlassScreen.
 */
export interface CinematicScreenProps {
  children: React.ReactNode;
  screenName: string;
  edges?: Edge[];
  className?: string;
  overlayOpacity?: number;
  animated?: boolean;
}

export function CinematicScreen({
  children,
  screenName,
  edges = ["top", "left", "right"],
  className,
  overlayOpacity = 0.55,
  animated = true,
}: CinematicScreenProps) {
  const bgUrl = BACKGROUNDS[screenName] || BACKGROUNDS.home;

  return (
    <View style={styles.root}>
      <ScreenBackgroundLayer
        imageUrl={bgUrl}
        overlayOpacity={overlayOpacity}
        goldenVignette={true}
        animated={animated}
      />
      <SafeAreaView edges={edges} style={styles.safeArea}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

/**
 * GoldenCard — A card component styled for the cinematic golden theme
 */
export function GoldenCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.goldenCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  safeArea: {
    flex: 1,
  },
  goldenCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.12)",
    backgroundColor: "rgba(15,20,40,0.85)",
    padding: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
});
