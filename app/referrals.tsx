import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, StyleSheet, Share, Platform, FlatList } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";

export default function ReferralsScreen() {
  const router = useRouter();
  const {
    referralCode, referrals, referralRewardsEarned,
    generateReferralCode, addReferral, getReferralStats,
  } = useAppState();
  const [inviteEmail, setInviteEmail] = useState("");

  const code = referralCode || generateReferralCode();
  const stats = getReferralStats();

  const handleShareCode = async () => {
    const message = `Join me on MindVault — the AI-powered second brain! Use my referral code: ${code}\n\nDownload: https://mindvault.app/invite/${code}`;
    try {
      if (Platform.OS === "web") {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          Alert.alert("Copied!", "Referral link copied to clipboard.");
        }
      } else {
        await Share.share({ message, title: "Join MindVault" });
      }
    } catch {
      // user cancelled
    }
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (referrals.find((r) => r.referredEmail === inviteEmail.trim())) {
      Alert.alert("Already Invited", "You've already sent a referral to this email.");
      return;
    }
    addReferral(inviteEmail.trim());
    setInviteEmail("");
    Alert.alert("Invite Sent!", `A referral invite has been sent to ${inviteEmail.trim()}.`);
  };

  const handleCopyCode = async () => {
    if (Platform.OS === "web" && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      Alert.alert("Copied!", "Referral code copied to clipboard.");
    }
  };

  const renderReferral = ({ item }: { item: typeof referrals[0] }) => {
    const statusColors: Record<string, string> = {
      pending: "#FFA500",
      converted: "#81C784",
      expired: "#FF6B6B",
    };
    return (
      <GoldenCard style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <LinearGradient
            colors={[`${statusColors[item.status]}20`, `${statusColors[item.status]}08`]}
            style={styles.referralAvatar}
          >
            <MaterialIcons
              name={item.status === "converted" ? "check-circle" : item.status === "pending" ? "hourglass-top" : "cancel"}
              size={20}
              color={statusColors[item.status]}
            />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralEmail}>{item.referredEmail}</Text>
            <Text style={styles.referralDate}>
              Invited {new Date(item.createdAt).toLocaleDateString()}
              {item.convertedAt && ` · Joined ${new Date(item.convertedAt).toLocaleDateString()}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}15` }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status}</Text>
          </View>
        </View>
      </GoldenCard>
    );
  };

  return (
    <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={["rgba(255,215,0,0.15)", "rgba(255,215,0,0.03)"]} style={styles.heroIcon}>
            <MaterialIcons name="card-giftcard" size={36} color="#FFD700" />
          </LinearGradient>
          <GoldenText variant="title">Invite Friends</GoldenText>
          <Text style={styles.heroSub}>
            Share MindVault with friends and earn rewards when they sign up.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <LinearGradient colors={["rgba(255,215,0,0.12)", "rgba(255,215,0,0.04)"]} style={styles.statBox}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Invited</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(129,199,132,0.12)", "rgba(129,199,132,0.04)"]} style={styles.statBox}>
            <Text style={[styles.statNum, { color: "#81C784" }]}>{stats.converted}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(255,165,0,0.12)", "rgba(255,165,0,0.04)"]} style={styles.statBox}>
            <Text style={[styles.statNum, { color: "#FFA500" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
        </View>

        {/* Referral Code */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
          <GoldenCard>
            <Text style={styles.fieldLabel}>Your Referral Code</Text>
            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [styles.codeBox, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.codeText}>{code}</Text>
              <MaterialIcons name="content-copy" size={18} color="#FFD700" />
            </Pressable>
            <View style={{ marginTop: 12 }}>
              <GoldenButton title="SHARE REFERRAL LINK" onPress={handleShareCode} icon="share" variant="primary" />
            </View>
          </GoldenCard>

          {/* Invite by Email */}
          <GoldenCard>
            <Text style={styles.fieldLabel}>Invite by Email</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="friend@email.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={[styles.input, { flex: 1 }]}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleInviteByEmail}
              />
              <Pressable
                onPress={handleInviteByEmail}
                style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="send" size={18} color="#0A0E1A" />
              </Pressable>
            </View>
          </GoldenCard>

          {/* Rewards */}
          <GoldenCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>Rewards Earned</Text>
                <Text style={styles.rewardDesc}>
                  {referralRewardsEarned > 0
                    ? `You've earned ${referralRewardsEarned} reward${referralRewardsEarned > 1 ? "s" : ""}! Each converted referral extends your Pro trial by 7 days.`
                    : "Earn 7 days of free Pro access for each friend who joins MindVault."}
                </Text>
              </View>
            </View>
          </GoldenCard>

          {/* Referral History */}
          {referrals.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Referral History</Text>
              <FlatList
                data={referrals}
                keyExtractor={(item) => item.id}
                renderItem={renderReferral}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  hero: { alignItems: "center", paddingVertical: 24, gap: 8 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", paddingHorizontal: 40 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 4 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.1)" },
  statNum: { fontSize: 24, fontWeight: "800", color: "#FFD700" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  codeBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "rgba(255,215,0,0.3)", borderStyle: "dashed",
    backgroundColor: "rgba(255,215,0,0.05)",
  },
  codeText: { fontSize: 20, fontWeight: "800", color: "#FFD700", letterSpacing: 2 },
  input: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)", backgroundColor: "rgba(8,12,28,0.88)",
    fontSize: 15, color: "#FFFFFF",
  },
  sendBtn: { width: 48, borderRadius: 10, backgroundColor: "#FFD700", alignItems: "center", justifyContent: "center" },
  rewardTitle: { fontSize: 15, fontWeight: "700", color: "#FFD700" },
  rewardDesc: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  referralAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  referralEmail: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  referralDate: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
