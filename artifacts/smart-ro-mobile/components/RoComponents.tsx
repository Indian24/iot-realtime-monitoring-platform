import { Feather } from "@expo/vector-icons";
import type { SensorReading } from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

type IconName = keyof typeof Feather.glyphMap;

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenShell({ title, subtitle, children, refreshing, onRefresh }: ScreenShellProps) {
  const colors = useColors();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.screenContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      <View style={styles.titleBlock}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Smart RO Retrofit</Text>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function LoadingState({ label = "Loading purifier telemetry" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Feather name="alert-triangle" size={24} color={colors.critical} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Unable to reach the purifier API</Text>
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}> 
          <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatusBadge({ status }: { status: SensorReading["alert"] }) {
  const colors = useColors();
  const isNormal = status === "NORMAL";
  return (
    <View style={[styles.badge, { backgroundColor: isNormal ? colors.successSoft : colors.criticalSoft }]}> 
      <View style={[styles.badgeDot, { backgroundColor: isNormal ? colors.success : colors.critical }]} />
      <Text style={[styles.badgeText, { color: isNormal ? colors.success : colors.critical }]}> {isNormal ? "Normal" : "High temperature"}</Text>
    </View>
  );
}

export function PumpBadge({ pumpState }: { pumpState: SensorReading["pumpState"] }) {
  const colors = useColors();
  const running = pumpState === "ON";
  return (
    <View style={[styles.badge, { backgroundColor: running ? colors.successSoft : colors.warningSoft }]}> 
      <Feather name={running ? "zap" : "pause-circle"} size={14} color={running ? colors.success : colors.warning} />
      <Text style={[styles.badgeText, { color: running ? colors.success : colors.warning }]}>Pump {running ? "running" : "stopped"}</Text>
    </View>
  );
}

export function ConnectionPill({ label, connected, detail }: { label: string; connected: boolean; detail: string }) {
  const colors = useColors();
  return (
    <View style={[styles.connectionPill, { backgroundColor: connected ? colors.successSoft : colors.warningSoft }]}> 
      <View style={[styles.badgeDot, { backgroundColor: connected ? colors.success : colors.warning }]} />
      <View style={styles.flexOne}>
        <Text style={[styles.connectionLabel, { color: connected ? colors.success : colors.warning }]}>{label}: {connected ? "Online" : "Offline"}</Text>
        <Text style={[styles.connectionDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
    </View>
  );
}

export function FreshnessNotice({ stale, timestamp }: { stale: boolean; timestamp?: string }) {
  const colors = useColors();
  if (!stale) return <ReadingTimestamp timestamp={timestamp} />;
  return (
    <View style={[styles.freshnessCard, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}> 
      <Feather name="wifi-off" size={16} color={colors.warning} />
      <Text style={[styles.freshnessText, { color: colors.foreground }]}>Live data is stale. Last update: {timestamp ? new Date(timestamp).toLocaleString() : "waiting for first reading"}</Text>
    </View>
  );
}

export function SensorCard({ label, value, unit, icon, tone, footer }: { label: string; value: string | number; unit: string; icon: IconName; tone?: "water" | "success" | "warning" | "critical"; footer?: string }) {
  const colors = useColors();
  const toneColor = tone ? colors[tone] : colors.primary;
  return (
    <View style={[styles.sensorCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={[styles.sensorIcon, { backgroundColor: colors.accent }]}> 
        <Feather name={icon} size={20} color={toneColor} />
      </View>
      <Text style={[styles.sensorLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.sensorValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.sensorUnit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
      {footer ? <Text style={[styles.cardFooter, { color: colors.mutedForeground }]}>{footer}</Text> : null}
    </View>
  );
}

export function RulePanel({ reading }: { reading: SensorReading }) {
  const colors = useColors();
  const overLimit = reading.temperature > reading.threshold;
  return (
    <View style={[styles.rulePanel, { backgroundColor: overLimit ? colors.criticalSoft : colors.successSoft, borderColor: overLimit ? colors.critical : colors.success }]}> 
      <View style={styles.ruleIconWrap}>
        <Feather name={overLimit ? "thermometer" : "check-circle"} size={24} color={overLimit ? colors.critical : colors.success} />
      </View>
      <View style={styles.flexOne}>
        <Text style={[styles.ruleTitle, { color: overLimit ? colors.critical : colors.success }]}> {overLimit ? "Temperature cutoff active" : "Automatic control normal"}</Text>
        <Text style={[styles.ruleText, { color: colors.foreground }]}>If temperature is above {reading.threshold}°C, pump turns OFF. At {reading.threshold}°C or below, pump turns ON.</Text>
      </View>
    </View>
  );
}

export function SectionCard({ title, children, style }: { title: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }, style]}> 
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

export function MetricChart({ readings, metric, unit, colorKey = "primary" }: { readings: SensorReading[]; metric: "temperature" | "tds" | "waterLevel"; unit: string; colorKey?: "primary" | "water" | "success" | "warning" }) {
  const colors = useColors();
  const values = readings.map((reading) => Number(reading[metric])).filter(Number.isFinite);
  const width = 310;
  const height = 120;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 24) - 12;
      return `${x},${y}`;
    })
    .join(" ");

  if (values.length === 0) {
    return <Text style={[styles.stateText, { color: colors.mutedForeground }]}>No readings available yet.</Text>;
  }

  const latest = values.at(-1) ?? 0;
  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartLatest, { color: colors.foreground }]}>{formatNumber(latest)} {unit}</Text>
        <Text style={[styles.chartRange, { color: colors.mutedForeground }]}>Min {formatNumber(min)} · Max {formatNumber(max)}</Text>
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Polyline points={points} fill="none" stroke={colors[colorKey]} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
          const y = height - ((value - min) / range) * (height - 24) - 12;
          return <Circle key={`${metric}-${index}`} cx={x} cy={y} r={3.5} fill={colors[colorKey]} opacity={index === values.length - 1 ? 1 : 0.35} />;
        })}
      </Svg>
    </View>
  );
}

export function ReadingTimestamp({ timestamp }: { timestamp?: string }) {
  const colors = useColors();
  const label = timestamp ? new Date(timestamp).toLocaleString() : "Waiting for first reading";
  return <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>Last update: {label}</Text>;
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 118, gap: 16 },
  titleBlock: { gap: 5, marginBottom: 4 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 24, gap: 12, alignItems: "center" },
  stateTitle: { fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" },
  stateText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" },
  retryButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start" },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  connectionPill: { borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  connectionLabel: { fontFamily: "Inter_700Bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.4 },
  connectionDetail: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  freshnessCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  freshnessText: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, flex: 1 },
  sensorCard: { borderWidth: 1, borderRadius: 22, padding: 16, flex: 1, minWidth: "47%", gap: 9 },
  sensorIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sensorLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  sensorValue: { fontFamily: "Inter_700Bold", fontSize: 30, letterSpacing: -0.8 },
  sensorUnit: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  cardFooter: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  rulePanel: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: "row", gap: 14 },
  ruleIconWrap: { paddingTop: 2 },
  flexOne: { flex: 1 },
  ruleTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 5 },
  ruleText: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  sectionCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  chartWrap: { gap: 6 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  chartLatest: { fontFamily: "Inter_700Bold", fontSize: 22 },
  chartRange: { fontFamily: "Inter_500Medium", fontSize: 12 },
  timestamp: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
