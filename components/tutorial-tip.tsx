import { View, Text, Pressable, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppState } from "@/lib/app-state";

interface TutorialTipProps {
  tipKey: string;
  icon: any;
  iconColor: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function TutorialTip({ tipKey, icon, iconColor, title, message, actionLabel, onAction }: TutorialTipProps) {
  const colors = useColors();
  const { hasSeenTutorial, markTutorialSeen } = useAppState();

  if (hasSeenTutorial[tipKey]) return null;

  return (
    <View style={[styles.container, { backgroundColor: iconColor + "10", borderColor: iconColor + "30" }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}>
          <IconSymbol name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
        </View>
        <Pressable
          onPress={() => markTutorialSeen(tipKey)}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="xmark" size={14} color={colors.muted} />
        </Pressable>
      </View>
      {actionLabel && onAction && (
        <Pressable
          onPress={() => { onAction(); markTutorialSeen(tipKey); }}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: iconColor },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "700" },
  message: { fontSize: 13, lineHeight: 19 },
  closeBtn: { padding: 4 },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    marginLeft: 48,
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
