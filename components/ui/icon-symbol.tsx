import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "plus.circle.fill": "add-circle",
  "book.fill": "library-books",
  "brain": "psychology",
  "chart.bar.fill": "insights",
  "magnifyingglass": "search",
  "mic.fill": "mic",
  "camera.fill": "camera-alt",
  "doc.fill": "description",
  "link": "link",
  "text.alignleft": "notes",
  "xmark": "close",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "pencil": "edit",
  "lightbulb.fill": "lightbulb",
  "arrow.up.circle.fill": "arrow-upward",
  "sparkles": "auto-awesome",
  "clock.fill": "schedule",
  "tag.fill": "label",
  "photo.fill": "image",
  "waveform": "graphic-eq",
  "globe": "language",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "person.fill": "person",
  "gearshape.fill": "settings",
  "arrow.left": "arrow-back",
  "ellipsis": "more-horiz",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
