import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { FadeOut, SlideInDown } from "react-native-reanimated";
import { dismissTip, getDismissedTips, type TipId } from "@/lib/tooltip-store";

interface TooltipBubbleProps {
  tipId: TipId;
  text: string;
  position?: "top" | "bottom";
  arrowSide?: "left" | "center" | "right";
  style?: any;
}

function Arrow({
  direction,
  side,
}: {
  direction: "up" | "down";
  side: "left" | "center" | "right";
}) {
  const alignSelf =
    side === "left" ? "flex-start" : side === "right" ? "flex-end" : "center";
  const marginH = side === "center" ? 0 : 24;
  const isUp = direction === "up";

  return (
    <View
      style={{
        alignSelf: alignSelf as any,
        marginLeft: side === "left" ? marginH : 0,
        marginRight: side === "right" ? marginH : 0,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        ...(isUp
          ? {
              borderBottomWidth: 8,
              borderBottomColor: "rgba(255,215,0,0.2)",
            }
          : {
              borderTopWidth: 8,
              borderTopColor: "rgba(255,215,0,0.2)",
            }),
      }}
    />
  );
}

export function TooltipBubble({
  tipId,
  text,
  position = "bottom",
  arrowSide = "center",
  style,
}: TooltipBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getDismissedTips().then((dismissed) => {
      if (!dismissed.has(tipId)) setVisible(true);
    });
  }, [tipId]);

  const handleDismiss = () => {
    setVisible(false);
    dismissTip(tipId);
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify().damping(18)}
      exiting={FadeOut.duration(200)}
      style={[{ zIndex: 100, alignSelf: "stretch" as const, marginHorizontal: 16, marginVertical: 4 }, style]}
    >
      {position === "bottom" && (
        <Arrow direction="up" side={arrowSide} />
      )}
      <Pressable
        onPress={handleDismiss}
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <View style={bubbleStyles.bubble}>
          <LinearGradient
            colors={["rgba(255,215,0,0.15)", "rgba(255,165,0,0.08)"]}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialIcons name="lightbulb" size={14} color="#FFD700" />
              <Text
                style={{
                  flex: 1,
                  color: "#FFF",
                  fontSize: 12,
                  fontWeight: "500",
                  lineHeight: 16,
                }}
              >
                {text}
              </Text>
              <MaterialIcons
                name="close"
                size={14}
                color="rgba(255,215,0,0.4)"
              />
            </View>
          </LinearGradient>
        </View>
      </Pressable>
      {position === "top" && (
        <Arrow direction="down" side={arrowSide} />
      )}
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  bubble: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
});
