import { Text, Platform } from "react-native";

type GoldenTextProps = {
  children: string;
  style?: any;
  variant?: "hero" | "title" | "subtitle" | "label";
};

const variants: Record<string, any> = {
  hero: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    lineHeight: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
};

export function GoldenText({
  children,
  style,
  variant = "title",
}: GoldenTextProps) {
  return (
    <Text
      style={[
        variants[variant],
        {
          color: "#FFD700",
          ...Platform.select({
            ios: {
              textShadowColor: "rgba(255,215,0,0.5)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 12,
            },
            android: {
              textShadowColor: "rgba(255,215,0,0.5)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 12,
            },
            default: {},
          }),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
