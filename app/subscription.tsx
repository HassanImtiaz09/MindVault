import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppState, PLANS, SubscriptionTier } from "@/lib/app-state";
import { useRouter } from "expo-router";

export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { subscription, setSubscription } = useAppState();

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === "pro" && subscription !== "pro") {
      Alert.alert(
        "Upgrade to Pro",
        "This would initiate a payment flow in a production app. For demo purposes, your plan will be upgraded immediately.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => {
              setSubscription("pro");
              Alert.alert("Welcome to Pro!", "You now have access to all premium features.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            },
          },
        ]
      );
    } else if (tier === "basic" && subscription === "pro") {
      Alert.alert(
        "Downgrade to Basic",
        "You will lose access to premium features. Your data will be preserved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Downgrade",
            style: "destructive",
            onPress: () => {
              setSubscription("basic");
            },
          },
        ]
      );
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Subscription</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <IconSymbol name="crown.fill" size={48} color="#FDCB6E" />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Choose Your Plan</Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
            Unlock the full power of your AI-powered second brain
          </Text>
        </View>

        {/* Plans */}
        {(["basic", "pro"] as SubscriptionTier[]).map((tier) => {
          const plan = PLANS[tier];
          const isActive = subscription === tier;
          const isPro = tier === "pro";

          return (
            <View
              key={tier}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
            >
              {isPro && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="star.fill" size={12} color="#fff" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, { color: isPro ? colors.primary : colors.foreground }]}>
                    {plan.price}
                  </Text>
                  {isPro && (
                    <Text style={[styles.planBilling, { color: colors.muted }]}>
                      or $99.99/year (save 17%)
                    </Text>
                  )}
                </View>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.success + "20" }]}>
                    <IconSymbol name="checkmark.circle.fill" size={14} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>Current</Text>
                  </View>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={18}
                    color={isPro ? colors.primary : colors.success}
                  />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text>
                </View>
              ))}

              {!isActive && (
                <Pressable
                  onPress={() => handleSelectPlan(tier)}
                  style={({ pressed }) => [
                    styles.selectBtn,
                    {
                      backgroundColor: isPro ? colors.primary : "transparent",
                      borderColor: isPro ? colors.primary : colors.border,
                      borderWidth: isPro ? 0 : 1.5,
                    },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectBtnText,
                      { color: isPro ? "#fff" : colors.foreground },
                    ]}
                  >
                    {isPro ? "Upgrade to Pro" : "Downgrade to Basic"}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Comparison Table */}
        <View style={styles.comparisonSection}>
          <Text style={[styles.compTitle, { color: colors.foreground }]}>Plan Comparison</Text>
          {[
            { feature: "Memories", basic: "50", pro: "Unlimited" },
            { feature: "Folders", basic: "3", pro: "Unlimited" },
            { feature: "Text & Link Capture", basic: "Yes", pro: "Yes" },
            { feature: "Image & Voice Capture", basic: "Limited", pro: "Unlimited" },
            { feature: "PDF & DOCX Analysis", basic: "No", pro: "Yes" },
            { feature: "Contract/Medical Analysis", basic: "No", pro: "Yes" },
            { feature: "Report Generation", basic: "No", pro: "Yes" },
            { feature: "Export as PDF", basic: "No", pro: "Yes" },
            { feature: "Knowledge Graph", basic: "View Only", pro: "Full Access" },
            { feature: "Idea Generation", basic: "No", pro: "Yes" },
            { feature: "Push Notifications", basic: "No", pro: "Yes" },
            { feature: "Weekly AI Summary", basic: "Basic", pro: "Detailed" },
          ].map((row, i) => (
            <View
              key={i}
              style={[
                styles.compRow,
                { backgroundColor: i % 2 === 0 ? colors.surface : "transparent" },
              ]}
            >
              <Text style={[styles.compFeature, { color: colors.foreground }]}>{row.feature}</Text>
              <Text style={[styles.compValue, { color: colors.muted }]}>{row.basic}</Text>
              <Text style={[styles.compValue, { color: colors.primary, fontWeight: "600" }]}>{row.pro}</Text>
            </View>
          ))}
          <View style={[styles.compRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.compFeature, { color: colors.muted, fontWeight: "700", fontSize: 12 }]}>Feature</Text>
            <Text style={[styles.compValue, { color: colors.muted, fontWeight: "700", fontSize: 12 }]}>Basic</Text>
            <Text style={[styles.compValue, { color: colors.primary, fontWeight: "700", fontSize: 12 }]}>Pro</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
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
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  heroTitle: { fontSize: 24, fontWeight: "800" },
  heroSubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  popularText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: { fontSize: 20, fontWeight: "700" },
  planPrice: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  planBilling: { fontSize: 12, marginTop: 2 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  divider: { height: 1, marginVertical: 16 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featureText: { fontSize: 14, flex: 1 },
  selectBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  selectBtnText: { fontSize: 16, fontWeight: "700" },
  comparisonSection: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  compTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  compRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  compFeature: { flex: 1.5, fontSize: 13 },
  compValue: { flex: 1, fontSize: 13, textAlign: "center" },
});
