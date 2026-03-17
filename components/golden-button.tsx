import { Pressable, Text, Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type GoldenButtonProps = {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "large" | "medium" | "small";
  disabled?: boolean;
  fullWidth?: boolean;
};

export function GoldenButton({
  title,
  onPress,
  icon,
  variant = "primary",
  size = "large",
  disabled = false,
  fullWidth = true,
}: GoldenButtonProps) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const paddingV = size === "large" ? 16 : size === "medium" ? 13 : 10;
  const fontSize = size === "large" ? 16 : size === "medium" ? 14 : 12;
  const iconSize = size === "large" ? 20 : size === "medium" ? 18 : 14;
  const borderRadius = size === "large" ? 28 : size === "medium" ? 22 : 18;

  if (isOutline) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            borderWidth: 1.5,
            borderColor: "rgba(255,215,0,0.4)",
            backgroundColor: "rgba(15,20,40,0.90)",
            paddingHorizontal: 24,
            paddingVertical: paddingV,
            borderRadius,
            width: fullWidth ? ("100%" as any) : undefined,
          },
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          disabled && { opacity: 0.4 },
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon as any}
            size={iconSize}
            color="#FFD700"
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          style={{
            color: "#FFD700",
            fontWeight: "700",
            letterSpacing: 0.5,
            fontSize,
          }}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  const gradientColors: [string, string, ...string[]] = isPrimary
    ? ["#FFD700", "#FFA500", "#FF8C00"]
    : ["#2A2040", "#1E1835"];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.4 },
        fullWidth ? { width: "100%" as any } : {},
      ]}
    >
      <View
        style={{
          borderRadius,
          ...Platform.select({
            ios: {
              shadowColor: "#FFD700",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
            default: {},
          }),
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: paddingV,
            borderRadius,
          }}
        >
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={iconSize}
              color={isPrimary ? "#0A0E1A" : "#FFD700"}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              color: isPrimary ? "#0A0E1A" : "#FFD700",
              fontWeight: isPrimary ? "900" : "800",
              letterSpacing: isPrimary ? 1 : 0.5,
              fontSize,
            }}
          >
            {title}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
