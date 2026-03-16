import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

interface GraphNode {
  id: string;
  label: string;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const GRAPH_SIZE = 360;
const CENTER = GRAPH_SIZE / 2;
const RADIUS = 130;

const NODE_COLORS = [
  "#6C5CE7", "#00D2D3", "#FF6B6B", "#FDCB6E", "#00B894",
  "#A29BFE", "#FD79A8", "#81ECEC", "#FAB1A0", "#74B9FF",
];

export function KnowledgeGraphView({ nodes, edges }: Props) {
  const colors = useColors();

  const layout = useMemo(() => {
    if (nodes.length === 0) return { positioned: [], lines: [] };

    const positioned = nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const r = nodes.length === 1 ? 0 : RADIUS * (0.6 + 0.4 * Math.min(node.size / 5, 1));
      return {
        ...node,
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
        color: NODE_COLORS[i % NODE_COLORS.length],
        radius: Math.max(12, Math.min(28, 10 + node.size * 3)),
      };
    });

    const nodeMap = new Map(positioned.map((n) => [n.id, n]));
    const lines = edges
      .map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        return { x1: source.x, y1: source.y, x2: target.x, y2: target.y, weight: edge.weight };
      })
      .filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; weight: number }[];

    return { positioned, lines };
  }, [nodes, edges]);

  return (
    <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 16 }}>
      <View style={[styles.graphContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
          {/* Edges */}
          {layout.lines.map((line, i) => (
            <Line
              key={`e-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={colors.muted + "40"}
              strokeWidth={Math.max(1, Math.min(3, line.weight))}
            />
          ))}
          {/* Nodes */}
          {layout.positioned.map((node) => (
            <Circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color + "30"}
              stroke={node.color}
              strokeWidth={2}
            />
          ))}
          {/* Labels */}
          {layout.positioned.map((node) => (
            <SvgText
              key={`t-${node.id}`}
              x={node.x}
              y={node.y + node.radius + 14}
              textAnchor="middle"
              fontSize={11}
              fill={colors.foreground}
              fontWeight="600"
            >
              {node.label.length > 12 ? node.label.substring(0, 12) + "..." : node.label}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: colors.foreground }]}>Topics</Text>
        <View style={styles.legendGrid}>
          {layout.positioned.map((node) => (
            <View key={node.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: node.color }]} />
              <Text style={[styles.legendLabel, { color: colors.foreground }]} numberOfLines={1}>
                {node.label}
              </Text>
              <Text style={[styles.legendCount, { color: colors.muted }]}>{node.size}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  graphContainer: {
    width: GRAPH_SIZE + 20,
    height: GRAPH_SIZE + 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  legend: {
    width: "100%",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  legendGrid: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 14,
    flex: 1,
  },
  legendCount: {
    fontSize: 13,
    fontWeight: "600",
  },
});
