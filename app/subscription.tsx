import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppState, PLANS, SubscriptionTier } from "@/lib/app-state";
import { useRouter } from "expo-router";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscription, setSubscription } = useAppState();

  const tierOrder: SubscriptionTier[] = ["basic", "pro", "teams"];
  const tierIndex = (t: SubscriptionTier) => tierOrder.indexOf(t);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === subscription) return;
    const isUpgrade = tierIndex(tier) > tierIndex(subscription);
    const planName = PLANS[tier].name;
    const price = PLANS[tier].price;

    if (isUpgrade) {
      Alert.alert(
        `Upgrade to ${planName}`,
        `This would initiate a payment flow (${price}) in a production app. For demo purposes, your plan will be upgraded immediately.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => {
              setSubscription(tier);
              Alert.alert(`Welcome to ${planName}!`, `You now have access to all ${planName} features.`, [
                { text: "OK", onPress: () => router.back() },
              ]);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `Downgrade to ${planName}`,
        "You will lose access to higher-tier features. Your data will be preserved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Downgrade",
            style: "destructive",
            onPress: () => setSubscription(tier),
          },
        ]
      );
    }
  };

  return (
    <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name={"arrow-back" as any} size={22} color={"#FFFFFF"} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Subscription</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <MaterialIcons name={"workspace-premium" as any} size={48} color="#FDCB6E" />
          <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>Choose Your Plan</Text>
          <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.7)" }]}>
            Unlock the full power of your AI-powered second brain
          </Text>
        </View>

        {/* Plans */}
        {(["basic", "pro", "teams"] as SubscriptionTier[]).map((tier) => {
          const plan = PLANS[tier];
          const isActive = subscription === tier;
          const isPro = tier === "pro";
          const isTeams = tier === "teams";
          const isUpgrade = tierIndex(tier) > tierIndex(subscription);
          const accentColor = isTeams ? "#4FC3F7" : isPro ? "#FFD700" : "#81C784";

          return (
            <View
              key={tier}
              style={[
                styles.planCard,
                {
                  backgroundColor: "rgba(8,12,28,0.88)",
                  borderColor: isActive ? "#FFD700" : "rgba(255,215,0,0.12)",
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
            >
              {isPro && (
                <View style={[styles.popularBadge, { backgroundColor: "#FFD700" }]}>
                  <MaterialIcons name={"star-outline" as any} size={12} color="#fff" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              {isTeams && (
                <View style={[styles.popularBadge, { backgroundColor: "#4FC3F7" }]}>
                  <MaterialIcons name={"groups" as any} size={12} color="#fff" />
                  <Text style={styles.popularText}>For Teams</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: "#FFFFFF" }]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, { color: accentColor }]}>
                    {plan.price}
                  </Text>
                  {isPro && (
                    <Text style={[styles.planBilling, { color: "rgba(255,255,255,0.7)" }]}>
                      or $99.99/year (save 17%)
                    </Text>
                  )}
                  {isTeams && (
                    <Text style={[styles.planBilling, { color: "rgba(255,255,255,0.7)" }]}>
                      per user, billed monthly
                    </Text>
                  )}
                </View>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: "#81C784" + "20" }]}>
                    <MaterialIcons name={"check-circle" as any} size={14} color={"#81C784"} />
                    <Text style={{ color: "#81C784", fontSize: 12, fontWeight: "600" }}>Current</Text>
                  </View>
                )}
              </View>

              <View style={[styles.divider, { backgroundColor: "rgba(255,215,0,0.12)" }]} />

              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <MaterialIcons
                    name={"check-circle" as any}
                    size={18}
                    color={accentColor}
                  />
                  <Text style={[styles.featureText, { color: "#FFFFFF" }]}>{feature}</Text>
                </View>
              ))}

              {!isActive && (
                <Pressable
                  onPress={() => handleSelectPlan(tier)}
                  style={({ pressed }) => [
                    styles.selectBtn,
                    {
                      backgroundColor: isUpgrade ? accentColor : "transparent",
                      borderColor: isUpgrade ? accentColor : "rgba(255,215,0,0.12)",
                      borderWidth: isUpgrade ? 0 : 1.5,
                    },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectBtnText,
                      { color: isUpgrade ? "#fff" : "#FFFFFF" },
                    ]}
                  >
                    {isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Comparison Table */}
        <View style={styles.comparisonSection}>
          <Text style={[styles.compTitle, { color: "#FFFFFF" }]}>Plan Comparison</Text>
          <View style={[styles.compRow, { backgroundColor: "rgba(8,12,28,0.88)" }]}>
            <Text style={[styles.compFeature, { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 12 }]}>Feature</Text>
            <Text style={[styles.compValue, { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 12 }]}>Basic</Text>
            <Text style={[styles.compValue, { color: "#FFD700", fontWeight: "700", fontSize: 12 }]}>Pro</Text>
            <Text style={[styles.compValue, { color: "#4FC3F7", fontWeight: "700", fontSize: 12 }]}>Teams</Text>
          </View>
          {[
            { feature: "Memories", basic: "50", pro: "Unlimited", teams: "Unlimited" },
            { feature: "Folders", basic: "3", pro: "Unlimited", teams: "Unlimited" },
            { feature: "Text & Link Capture", basic: "Yes", pro: "Yes", teams: "Yes" },
            { feature: "Image & Voice Capture", basic: "Limited", pro: "Unlimited", teams: "Unlimited" },
            { feature: "PDF & DOCX Analysis", basic: "No", pro: "Yes", teams: "Yes" },
            { feature: "Report Generation", basic: "No", pro: "Yes", teams: "Yes" },
            { feature: "Knowledge Graph", basic: "View Only", pro: "Full Access", teams: "Full Access" },
            { feature: "Shared Vaults", basic: "No", pro: "No", teams: "Yes" },
            { feature: "Admin Controls", basic: "No", pro: "No", teams: "Yes" },
            { feature: "API Access", basic: "No", pro: "No", teams: "Yes" },
            { feature: "SSO Support", basic: "No", pro: "No", teams: "Yes" },
            { feature: "Audit Logs", basic: "No", pro: "No", teams: "Yes" },
          ].map((row, i) => (
            <View
              key={i}
              style={[
                styles.compRow,
                { backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "transparent" },
              ]}
            >
              <Text style={[styles.compFeature, { color: "#FFFFFF" }]}>{row.feature}</Text>
              <Text style={[styles.compValue, { color: "rgba(255,255,255,0.7)" }]}>{row.basic}</Text>
              <Text style={[styles.compValue, { color: "#FFD700", fontWeight: "600" }]}>{row.pro}</Text>
              <Text style={[styles.compValue, { color: "#4FC3F7", fontWeight: "600" }]}>{row.teams}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
