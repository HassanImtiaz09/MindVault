import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, StyleSheet, Switch } from "react-native";
import { CinematicScreen, GoldenCard } from "@/components/screen-background";
import { GoldenText } from "@/components/golden-text";
import { GoldenButton } from "@/components/golden-button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAppState } from "@/lib/app-state";

export default function TeamsScreen() {
  const router = useRouter();
  const {
    subscription, teamMembers, teamVaults, teamName, ssoEnabled, apiAccessEnabled,
    addTeamMember, removeTeamMember, updateTeamMemberRole,
    createTeamVault, deleteTeamVault, addMemberToVault, removeMemberFromVault,
    setTeamName, setSsoEnabled, setApiAccessEnabled, canUseFeature,
  } = useAppState();
  const [tab, setTab] = useState<"members" | "vaults" | "settings">("members");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultDesc, setNewVaultDesc] = useState("");
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [tempTeamName, setTempTeamName] = useState(teamName);

  const isTeams = subscription === "teams";

  if (!isTeams) {
    return (
      <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Teams</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.lockedContainer}>
          <MaterialIcons name="groups" size={56} color="rgba(255,215,0,0.3)" />
          <GoldenText variant="title">Teams Plan Required</GoldenText>
          <Text style={styles.lockedText}>
            Upgrade to the Teams plan ($15/user/mo) to access shared vaults, admin controls, API access, and SSO.
          </Text>
          <GoldenButton
            title="VIEW PLANS"
            onPress={() => router.push("/subscription" as any)}
            icon="workspace-premium"
            variant="primary"
          />
        </View>
      </CinematicScreen>
    );
  }

  const handleAddMember = () => {
    if (!newEmail.trim() || !newName.trim()) {
      Alert.alert("Required", "Please enter both email and name.");
      return;
    }
    if (teamMembers.find((m) => m.email === newEmail.trim())) {
      Alert.alert("Duplicate", "This email is already a team member.");
      return;
    }
    addTeamMember(newEmail.trim(), newName.trim(), "member");
    setNewEmail("");
    setNewName("");
    Alert.alert("Invited", `${newName.trim()} has been invited to the team.`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    Alert.alert("Remove Member", `Remove ${name} from the team?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeTeamMember(id) },
    ]);
  };

  const handleCreateVault = () => {
    if (!newVaultName.trim()) {
      Alert.alert("Required", "Please enter a vault name.");
      return;
    }
    createTeamVault(newVaultName.trim(), newVaultDesc.trim());
    setNewVaultName("");
    setNewVaultDesc("");
    Alert.alert("Created", "Team vault created successfully.");
  };

  const handleDeleteVault = (id: string, name: string) => {
    Alert.alert("Delete Vault", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTeamVault(id) },
    ]);
  };

  return (
    <CinematicScreen screenName="subscription" edges={["top", "bottom", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: "rgba(255,215,0,0.12)" }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Teams</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {([
          { key: "members" as const, label: "Members", icon: "people" },
          { key: "vaults" as const, label: "Vaults", icon: "folder-shared" },
          { key: "settings" as const, label: "Settings", icon: "settings" },
        ]).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
              <View style={[styles.tabBtn, { borderBottomColor: active ? "#FFD700" : "transparent" }]}>
                <MaterialIcons name={t.icon as any} size={16} color={active ? "#FFD700" : "rgba(255,255,255,0.3)"} />
                <Text style={{ color: active ? "#FFD700" : "rgba(255,255,255,0.3)", fontWeight: "600", fontSize: 14 }}>{t.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === "members" && (
          <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <LinearGradient colors={["rgba(255,215,0,0.12)", "rgba(255,215,0,0.04)"]} style={styles.statBox}>
                <Text style={styles.statNum}>{teamMembers.length}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </LinearGradient>
              <LinearGradient colors={["rgba(129,199,132,0.12)", "rgba(129,199,132,0.04)"]} style={styles.statBox}>
                <Text style={[styles.statNum, { color: "#81C784" }]}>{teamMembers.filter((m) => m.status === "active").length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </LinearGradient>
              <LinearGradient colors={["rgba(255,165,0,0.12)", "rgba(255,165,0,0.04)"]} style={styles.statBox}>
                <Text style={[styles.statNum, { color: "#FFA500" }]}>{teamMembers.filter((m) => m.status === "invited").length}</Text>
                <Text style={styles.statLabel}>Invited</Text>
              </LinearGradient>
            </View>

            {/* Add Member */}
            <GoldenCard>
              <Text style={styles.cardTitle}>Invite Team Member</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Full name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
              />
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Email address"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={[styles.input, { marginTop: 8 }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={{ marginTop: 12 }}>
                <GoldenButton title="SEND INVITE" onPress={handleAddMember} icon="person-add" variant="primary" />
              </View>
            </GoldenCard>

            {/* Member List */}
            {teamMembers.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Team Members</Text>
                {teamMembers.map((member) => (
                  <GoldenCard key={member.id} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <LinearGradient
                        colors={member.role === "admin" ? ["rgba(255,215,0,0.2)", "rgba(255,215,0,0.1)"] : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.03)"]}
                        style={styles.memberAvatar}
                      >
                        <MaterialIcons name={member.role === "admin" ? "admin-panel-settings" : "person"} size={20} color={member.role === "admin" ? "#FFD700" : "rgba(255,255,255,0.5)"} />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                          <View style={[styles.badge, { backgroundColor: member.role === "admin" ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.06)" }]}>
                            <Text style={[styles.badgeText, { color: member.role === "admin" ? "#FFD700" : "rgba(255,255,255,0.5)" }]}>{member.role}</Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: member.status === "active" ? "rgba(129,199,132,0.12)" : "rgba(255,165,0,0.12)" }]}>
                            <Text style={[styles.badgeText, { color: member.status === "active" ? "#81C784" : "#FFA500" }]}>{member.status}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        <Pressable
                          onPress={() => updateTeamMemberRole(member.id, member.role === "admin" ? "member" : "admin")}
                          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                        >
                          <MaterialIcons name="swap-horiz" size={16} color="rgba(255,255,255,0.4)" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRemoveMember(member.id, member.name)}
                          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                        >
                          <MaterialIcons name="close" size={16} color="#FF6B6B" />
                        </Pressable>
                      </View>
                    </View>
                  </GoldenCard>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === "vaults" && (
          <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
            {/* Create Vault */}
            <GoldenCard>
              <Text style={styles.cardTitle}>Create Shared Vault</Text>
              <TextInput
                value={newVaultName}
                onChangeText={setNewVaultName}
                placeholder="Vault name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
              />
              <TextInput
                value={newVaultDesc}
                onChangeText={setNewVaultDesc}
                placeholder="Description (optional)"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={[styles.input, { marginTop: 8 }]}
              />
              <View style={{ marginTop: 12 }}>
                <GoldenButton title="CREATE VAULT" onPress={handleCreateVault} icon="create-new-folder" variant="primary" />
              </View>
            </GoldenCard>

            {/* Vault List */}
            {teamVaults.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>Shared Vaults</Text>
                {teamVaults.map((vault) => (
                  <GoldenCard key={vault.id} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <LinearGradient colors={["rgba(79,195,247,0.15)", "rgba(79,195,247,0.05)"]} style={styles.vaultIcon}>
                        <MaterialIcons name="folder-shared" size={22} color="#4FC3F7" />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{vault.name}</Text>
                        {vault.description ? <Text style={styles.memberEmail}>{vault.description}</Text> : null}
                        <Text style={styles.vaultMeta}>{vault.memberIds.length} members · Created {new Date(vault.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteVault(vault.id, vault.name)}
                        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
                      >
                        <MaterialIcons name="delete-outline" size={18} color="#FF6B6B" />
                      </Pressable>
                    </View>
                  </GoldenCard>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="folder-shared" size={40} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyTitle}>No shared vaults yet</Text>
                <Text style={styles.emptyText}>Create a vault to share knowledge with your team.</Text>
              </View>
            )}
          </View>
        )}

        {tab === "settings" && (
          <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 16 }}>
            {/* Team Name */}
            <GoldenCard>
              <Text style={styles.cardTitle}>Team Name</Text>
              {editingTeamName ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TextInput
                    value={tempTeamName}
                    onChangeText={setTempTeamName}
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter team name"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                  />
                  <Pressable
                    onPress={() => { setTeamName(tempTeamName); setEditingTeamName(false); }}
                    style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setTempTeamName(teamName); setEditingTeamName(true); }}
                  style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.settingValue}>{teamName || "Not set"}</Text>
                  <MaterialIcons name="edit" size={16} color="rgba(255,255,255,0.3)" />
                </Pressable>
              )}
            </GoldenCard>

            {/* SSO */}
            <GoldenCard>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Single Sign-On (SSO)</Text>
                  <Text style={styles.settingDesc}>Enable SAML/OIDC SSO for your team</Text>
                </View>
                <Switch
                  value={ssoEnabled}
                  onValueChange={setSsoEnabled}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(255,215,0,0.3)" }}
                  thumbColor={ssoEnabled ? "#FFD700" : "rgba(255,255,255,0.3)"}
                />
              </View>
              {ssoEnabled && (
                <View style={styles.ssoInfo}>
                  <MaterialIcons name="check-circle" size={14} color="#81C784" />
                  <Text style={styles.ssoInfoText}>SSO is enabled. Configure your identity provider in the admin console.</Text>
                </View>
              )}
            </GoldenCard>

            {/* API Access */}
            <GoldenCard>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>API Access</Text>
                  <Text style={styles.settingDesc}>Enable REST API for integrations</Text>
                </View>
                <Switch
                  value={apiAccessEnabled}
                  onValueChange={setApiAccessEnabled}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(255,215,0,0.3)" }}
                  thumbColor={apiAccessEnabled ? "#FFD700" : "rgba(255,255,255,0.3)"}
                />
              </View>
              {apiAccessEnabled && (
                <View style={styles.apiKeyBox}>
                  <Text style={styles.apiKeyLabel}>API Key</Text>
                  <View style={styles.apiKeyRow}>
                    <Text style={styles.apiKeyValue} numberOfLines={1}>mv_teams_••••••••••••••••</Text>
                    <Pressable style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                      <MaterialIcons name="content-copy" size={16} color="#FFD700" />
                    </Pressable>
                  </View>
                  <Text style={styles.apiKeyHint}>Use this key to authenticate API requests</Text>
                </View>
              )}
            </GoldenCard>

            {/* Admin Controls */}
            <GoldenCard>
              <Text style={styles.cardTitle}>Admin Controls</Text>
              {[
                { label: "Audit Logs", desc: "View team activity and access logs", icon: "history" },
                { label: "Custom Branding", desc: "Apply your brand colors and logo", icon: "palette" },
                { label: "Bulk Import/Export", desc: "Import or export team data in bulk", icon: "import-export" },
                { label: "Usage Analytics", desc: "View team usage and engagement metrics", icon: "analytics" },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => Alert.alert(item.label, `${item.desc}\n\nThis feature will be available in the full release.`)}
                  style={({ pressed }) => [styles.adminRow, pressed && { opacity: 0.7 }]}
                >
                  <MaterialIcons name={item.icon as any} size={20} color="#FFD700" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminLabel}>{item.label}</Text>
                    <Text style={styles.adminDesc}>{item.desc}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
                </Pressable>
              ))}
            </GoldenCard>
          </View>
        )}
      </ScrollView>
    </CinematicScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  lockedContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  lockedText: { fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 22 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,215,0,0.08)" },
  tabBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, gap: 6, borderBottomWidth: 2 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,215,0,0.1)" },
  statNum: { fontSize: 24, fontWeight: "800", color: "#FFD700" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  input: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)", backgroundColor: "rgba(8,12,28,0.88)",
    fontSize: 15, color: "#FFFFFF", marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  memberName: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  memberEmail: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  vaultIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  vaultMeta: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  emptyState: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, marginTop: 8 },
  settingValue: { fontSize: 15, color: "rgba(255,255,255,0.7)" },
  settingDesc: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FFD700", alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#0A0E1A" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ssoInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "rgba(129,199,132,0.08)" },
  ssoInfoText: { fontSize: 13, color: "#81C784", flex: 1 },
  apiKeyBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "rgba(8,12,28,0.88)", borderWidth: 1, borderColor: "rgba(255,215,0,0.15)" },
  apiKeyLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, textTransform: "uppercase" },
  apiKeyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  apiKeyValue: { fontSize: 14, color: "#FFD700", fontFamily: "monospace", flex: 1 },
  apiKeyHint: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 },
  adminRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "rgba(255,255,255,0.05)" },
  adminLabel: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  adminDesc: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 },
});
