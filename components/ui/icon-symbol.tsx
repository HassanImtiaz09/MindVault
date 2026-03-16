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
  "star.fill": "star",
  "star": "star-border",
  "folder.fill": "folder",
  "folder.badge.plus": "create-new-folder",
  "doc.text.magnifyingglass": "find-in-page",
  "crown.fill": "workspace-premium",
  "bell.fill": "notifications",
  "questionmark.circle.fill": "help",
  "arrow.right": "arrow-forward",
  "doc.text.fill": "article",
  "square.and.arrow.down": "download",
  "scanner.fill": "document-scanner",
  "info.circle.fill": "info",
  "bolt.fill": "bolt",
  "lock.fill": "lock",
  "checkmark": "check",
  "calendar": "event",
  "tray.fill": "inbox",
  "chart.pie.fill": "pie-chart",
  "arrow.clockwise": "refresh",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "hand.wave.fill": "waving-hand",
  "rocket.fill": "rocket-launch",
  "shield.fill": "shield",
  "paintbrush.fill": "brush",
  "list.bullet": "format-list-bulleted",
  "doc.on.doc.fill": "file-copy",
  "eye.fill": "visibility",
  "heart.fill": "favorite",
  // Phase 3 icons
  "timer": "timer",
  "stop.fill": "stop",
  "archivebox.fill": "archive",
  "leaf.fill": "eco",
  "scope": "center-focus-strong",
  "target": "gps-fixed",
  "number": "tag",
  "plus": "add",
  "minus": "remove",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "square.grid.2x2.fill": "grid-view",
  "line.3.horizontal.decrease": "filter-list",
} as unknown as IconMapping;

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
