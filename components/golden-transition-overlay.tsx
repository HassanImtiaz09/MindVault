import { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useTransition } from "@/lib/transition-context";

const PARTICLE_COUNT = 18;
const RAY_COUNT = 12;

function SparkleParticle({ index, active }: { index: number; active: boolean }) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2;
  const angle = (2 * Math.PI * index) / PARTICLE_COUNT;
  const dist = 120 + Math.random() * 80;
  const delay = Math.random() * 120;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      opacity.value = 0;
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(300, withTiming(0, { duration: 100 }))
        )
      );
      progress.value = withDelay(
        delay,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
    left: cx + Math.cos(angle) * dist * progress.value - 2,
    top: cy + Math.sin(angle) * dist * progress.value - 2,
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

function LightRay({ index, active }: { index: number; active: boolean }) {
  const angle = (360 / RAY_COUNT) * index;
  const scaleVal = useSharedValue(0);
  const opacityVal = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scaleVal.value = 0;
      opacityVal.value = 0;
      opacityVal.value = withSequence(
        withTiming(0.3, { duration: 300 }),
        withDelay(50, withTiming(0, { duration: 350 }))
      );
      scaleVal.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: 2,
    height: 200,
    backgroundColor: "#FFD700",
    opacity: opacityVal.value,
    transform: [
      { rotate: `${angle}deg` },
      { scaleY: scaleVal.value },
    ],
  }));

  return <Animated.View style={style} />;
}

export function GoldenTransitionOverlay() {
  const { isTransitioning, onTransitionComplete } = useTransition();
  const containerOpacity = useSharedValue(0);
  const flashScale = useSharedValue(0.2);
  const flashOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (isTransitioning) {
      // Reset
      containerOpacity.value = 0;
      flashScale.value = 0.2;
      flashOpacity.value = 0;
      ringScale.value = 0;
      ringOpacity.value = 0;

      // Animate
      containerOpacity.value = withTiming(1, { duration: 50 });
      flashOpacity.value = withSequence(
        withTiming(0.9, { duration: 200 }),
        withTiming(0, { duration: 250 })
      );
      flashScale.value = withTiming(2.5, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      ringOpacity.value = withSequence(
        withTiming(0.6, { duration: 150 }),
        withDelay(250, withTiming(0, { duration: 200 }))
      );
      ringScale.value = withTiming(3, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });

      // Auto-dismiss
      const timer = setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(onTransitionComplete)();
        });
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFD700",
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFD700",
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  if (!isTransitioning) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 9998, justifyContent: "center", alignItems: "center" },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      {/* Light rays */}
      <View
        style={{
          position: "absolute",
          left: width / 2 - 1,
          top: height / 2 - 100,
        }}
      >
        {Array.from({ length: RAY_COUNT }).map((_, i) => (
          <LightRay key={i} index={i} active={isTransitioning} />
        ))}
      </View>

      {/* Sparkle particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <SparkleParticle key={i} index={i} active={isTransitioning} />
      ))}

      {/* Central flash */}
      <Animated.View style={flashStyle} />

      {/* Expanding ring */}
      <Animated.View style={ringStyle} />
    </Animated.View>
  );
}
