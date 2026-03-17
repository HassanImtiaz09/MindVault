import React, { useEffect, useContext, createContext, useCallback } from "react";
import { View, StyleSheet, Platform, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
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
  type SharedValue,
} from "react-native-reanimated";
import { BACKGROUNDS } from "@/constants/images";
import { cn } from "@/lib/utils";

/* ─── Parallax scroll context ─── */
const ParallaxCtx = createContext<{
  scrollY: SharedValue<number>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
} | null>(null);

export function useParallax() {
  return useContext(ParallaxCtx);
}

/* ─── Background layer with parallax + drift ─── */
type ScreenBackgroundProps = {
  imageUrl: string;
  overlayOpacity?: number;
  goldenVignette?: boolean;
  animated?: boolean;
  scrollY: SharedValue<number>;
};

function ScreenBackgroundLayer({
  imageUrl,
  overlayOpacity = 0.55,
  goldenVignette = true,
  animated = true,
  scrollY,
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

  const parallaxStyle = useAnimatedStyle(() => {
    // Parallax: background moves at 30% of scroll speed (subtle depth)
    const parallaxY = interpolate(scrollY.value, [0, 600], [0, -60], "clamp");
    const driftX = animated ? interpolate(drift.value, [0, 1], [-6, 6]) : 0;
    const driftY = animated ? interpolate(drift.value, [0, 1], [-3, 3]) : 0;
    return {
      transform: [
        { scale: 1.15 }, // Extra scale to prevent edges showing during parallax
        { translateX: driftX },
        { translateY: parallaxY + driftY },
      ],
    };
  });

  const overlayAlpha = Math.round(overlayOpacity * 255)
    .toString(16)
    .padStart(2, "0");

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
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
            colors={["rgba(255,200,50,0.10)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 140,
            }}
          />
          <LinearGradient
            colors={["transparent", "rgba(255,180,30,0.08)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 180,
            }}
          />
        </>
      )}
    </View>
  );
}

/**
 * CinematicScreen — Full-screen wrapper with HD background, parallax scrolling,
 * dark overlay, golden vignette, and SafeArea handling.
 *
 * Children that use ScrollView should call `useParallax()` and pass `onScroll`
 * to their ScrollView for the parallax effect.
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
  const scrollY = useSharedValue(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY]
  );

  return (
    <ParallaxCtx.Provider value={{ scrollY, onScroll }}>
      <View style={styles.root}>
        <ScreenBackgroundLayer
          imageUrl={bgUrl}
          overlayOpacity={overlayOpacity}
          goldenVignette={true}
          animated={animated}
          scrollY={scrollY}
        />
        <SafeAreaView edges={edges} style={styles.safeArea}>
          <View className={cn("flex-1", className)}>{children}</View>
        </SafeAreaView>
      </View>
    </ParallaxCtx.Provider>
  );
}

/**
 * GoldenCard — High-contrast card for the cinematic golden theme.
 * Uses a more opaque background for better text readability.
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
    borderColor: "rgba(255,215,0,0.28)",
    backgroundColor: "rgba(6,10,24,0.95)",
    padding: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
});
