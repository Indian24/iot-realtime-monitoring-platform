import { useGetAlerts, useGetHistory } from "@workspace/api-client-react";
import React from "react";
import { Text, View } from "react-native";

import { ErrorState, LoadingState, MetricChart, ScreenShell, SectionCard } from "@/components/RoComponents";
import { useRoSettings } from "@/contexts/RoSettingsContext";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";
import { useColors } from "@/hooks/useColors";

export default function HistoryScreen() {
  useLiveTelemetry();
  const { refreshIntervalMs } = useRoSettings();
  const history = useGetHistory({ limit: 80 }, { query: { refetchInterval: refreshIntervalMs } });
  const alerts = useGetAlerts({ limit: 10 }, { query: { refetchInterval: refreshIntervalMs } });
  const readings = history.data?.readings ?? [];

  if (history.isLoading) return <ScreenShell title="History"><LoadingState label="Loading trend history" /></ScreenShell>;
  if (history.isError) return <ScreenShell title="History"><ErrorState message="Historical readings are unavailable." onRetry={() => history.refetch()} /></ScreenShell>;

  return (
    <ScreenShell title="History" subtitle="Recent sensor trends saved by the backend. Connect MongoDB Atlas for persistent long-term storage." refreshing={history.isRefetching} onRefresh={() => { history.refetch(); alerts.refetch(); }}>
      <SectionCard title="Temperature trend">
        <MetricChart readings={readings} metric="temperature" unit="°C" colorKey="warning" />
      </SectionCard>
      <SectionCard title="TDS trend">
        <MetricChart readings={readings} metric="tds" unit="ppm" colorKey="water" />
      </SectionCard>
      <SectionCard title="Water level trend">
        <MetricChart readings={readings} metric="waterLevel" unit="V" colorKey="success" />
      </SectionCard>
      <SectionCard title="Recent alerts">
        {alerts.data?.alerts.length ? alerts.data.alerts.map((alert) => <AlertRow key={alert.id} message={alert.message} timestamp={alert.timestamp} />) : <EmptyAlerts />}
      </SectionCard>
    </ScreenShell>
  );
}

function AlertRow({ message, timestamp }: { message: string; timestamp: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 }}>
      <Text style={{ color: colors.warning, fontFamily: "Inter_700Bold", fontSize: 14 }}>{message}</Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>{new Date(timestamp).toLocaleString()}</Text>
    </View>
  );
}

function EmptyAlerts() {
  const colors = useColors();
  return <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 }}>No active high-temperature alerts in the current history window.</Text>;
}
