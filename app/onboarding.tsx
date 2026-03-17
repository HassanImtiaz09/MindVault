import { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  Pressable,
  StyleSheet,
  Platform,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { CinematicScreen } from "@/components/screen-background";
import { GoldenButton } from "@/components/golden-button";
import { GoldenText } from "@/components/golden-text";
import { useAppState } from "@/lib/app-state";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const SLIDES = [
  {
    key: "welcome",
    screen: "onboarding",
    icon: "psychology",
    title: "MINDVAULT",
    subtitle: "Your AI-Powered\nSecond Brain",
    desc: "Capture everything. Remember anything.\nLet AI organize your knowledge.",
  },
  {
    key: "capture",
    screen: "capture",
    icon: "bolt",
    title: "CAPTURE ANYTHING",
    subtitle: "Zero Friction Input",
    desc: "Text, voice, photos, documents, links —\ncapture ideas in seconds from any source.",
  },
  {
    key: "intelligence",
    screen: "ask",
    icon: "auto-awesome",
    title: "AI INTELLIGENCE",
    subtitle: "Your Knowledge, Amplified",
    desc: "Ask questions in natural language.\nGet instant answers from your own knowledge base.",
  },
  {
    key: "insights",
    screen: "insights",
    icon: "insights",
    title: "DEEP INSIGHTS",
    subtitle: "See the Big Picture",
    desc: "Knowledge graphs, weekly summaries,\ntrending topics, and idea generation.",
  },
  {
    key: "plans",
    screen: "subscription",
    icon: "workspace-premium",
    title: "CHOOSE YOUR PLAN",
    subtitle: "Unlock Full Potential",
    desc: "",
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { completeOnboarding, setGuest, setSubscription } = useAppState();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  const finish = (mode: "guest" | "signin" | "pro") => {
    completeOnboarding();
    if (mode === "guest") {
      setGuest(true);
    } else if (mode === "pro") {
      setSubscription("pro");
    }
    router.replace("/(tabs)");
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: (typeof SLIDES)[0];
    index: number;
  }) => {
    const isPlans = item.key === "plans";

    return (
      <CinematicScreen
        screenName={item.screen}
        edges={["top", "bottom", "left", "right"]}
        overlayOpacity={0.6}
      >
        <View style={[styles.slideInner, { width }]}>
          {!isPlans ? (
            <>
              <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                <View style={styles.iconCircle}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={48}
                    color="#FFD700"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <GoldenText variant="label" style={{ marginTop: 32 }}>
                  {item.title}
                </GoldenText>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                <Text style={styles.desc}>{item.desc}</Text>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                <View style={styles.iconCircle}>
                  <MaterialIcons
                    name="workspace-premium"
                    size={48}
                    color="#FFD700"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <GoldenText variant="label" style={{ marginTop: 24 }}>
                  {item.title}
                </GoldenText>
                <Text style={[styles.subtitle, { marginTop: 8 }]}>
                  {item.subtitle}
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(600).duration(600)}
                style={{
                  width: "100%",
                  paddingHorizontal: 24,
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <View style={styles.planCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.planName}>Basic</Text>
                    <Text style={styles.planPrice}>Free</Text>
                  </View>
                  <Text style={styles.planFeature}>
                    50 memories / month
                  </Text>
                  <Text style={styles.planFeature}>3 folders</Text>
                  <Text style={styles.planFeature}>
                    AI search & summaries
                  </Text>
                </View>

                <LinearGradient
                  colors={[
                    "rgba(255,215,0,0.12)",
                    "rgba(255,165,0,0.06)",
                  ]}
                  style={styles.proCard}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={[styles.planName, { color: "#FFD700" }]}
                      >
                        Pro
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>RECOMMENDED</Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.planPrice, { color: "#FFD700" }]}
                    >
                      $9.99/mo
                    </Text>
                  </View>
                  <Text style={styles.planFeature}>
                    Unlimited memories
                  </Text>
                  <Text style={styles.planFeature}>
                    Unlimited folders & tags
                  </Text>
                  <Text style={styles.planFeature}>
                    Smart reminders & collaboration
                  </Text>
                  <Text style={styles.planFeature}>
                    Focus Mode & data export
                  </Text>
                  <Text style={styles.planFeature}>
                    Priority AI processing
                  </Text>
                </LinearGradient>
              </Animated.View>
            </>
          )}
        </View>
      </CinematicScreen>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.key}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.bottomOverlay}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {activeIndex < SLIDES.length - 1 ? (
            <>
              <GoldenButton
                title="CONTINUE"
                onPress={goNext}
                icon="arrow-forward"
                variant="primary"
                size="large"
              />
              <Pressable
                onPress={() => finish("guest")}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            </>
          ) : (
            <>
              <GoldenButton
                title="START PRO — $9.99/MO"
                onPress={() => finish("pro")}
                icon="workspace-premium"
                variant="primary"
                size="large"
              />
              <GoldenButton
                title="GET STARTED FREE"
                onPress={() => finish("guest")}
                icon="rocket-launch"
                variant="outline"
                size="medium"
              />
              <Pressable
                onPress={() => finish("signin")}
                style={({ pressed }) => [
                  styles.skipBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.skipText}>Sign in with account</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  slideInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 180,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(15,20,40,0.88)",
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
    marginTop: 12,
  },
  desc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 16,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 32,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: "#FFD700",
    width: 24,
  },
  buttons: {
    gap: 12,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(15,20,40,0.8)",
    padding: 16,
    gap: 4,
  },
  proCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.3)",
    padding: 16,
    gap: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },
  planFeature: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
  },
  badge: {
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 0.5,
  },
});
