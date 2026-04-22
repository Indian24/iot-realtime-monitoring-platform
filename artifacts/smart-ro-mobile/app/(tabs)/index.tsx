import React from "react";
import { View } from "react-native";

import { ConnectionPill, ErrorState, FreshnessNotice, LoadingState, PumpBadge, RulePanel, ScreenShell, SectionCard, SensorCard, StatusBadge, formatNumber } from "@/components/RoComponents";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";

export default function DashboardScreen() {
  const telemetry = useLiveTelemetry();
  const { latest, status, reading } = telemetry;

  if (latest.isLoading && status.isLoading && !reading) return <ScreenShell title="Dashboard"><LoadingState /></ScreenShell>;
  if (latest.isError && status.isError && !reading) return <ScreenShell title="Dashboard"><ErrorState message="Check that the backend service is running and reachable." onRetry={telemetry.refetch} /></ScreenShell>;

  return (
    <ScreenShell
      title="Purifier overview"
      subtitle="Live health view for the ESP32-based RO purifier retrofit. Automatic pump cutoff is fixed at 35°C."
      refreshing={latest.isRefetching || status.isRefetching}
      onRefresh={telemetry.refetch}
    >
      {reading ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatusBadge status={reading.alert} />
            <PumpBadge pumpState={reading.pumpState} />
          </View>

          <RulePanel reading={reading} />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <SensorCard label="Temperature" value={formatNumber(reading.temperature)} unit="°C" icon="thermometer" tone={reading.alert === "NORMAL" ? "success" : "critical"} footer={`Cutoff ${reading.threshold}°C`} />
            <SensorCard label="TDS" value={formatNumber(reading.tds)} unit="ppm" icon="droplet" tone="water" footer="Analog sensor on GPIO34" />
            <SensorCard label="Water level" value={formatNumber(reading.waterLevel)} unit="V" icon="bar-chart-2" tone="water" footer="Analog level on GPIO35" />
            <SensorCard label="Pump relay" value={reading.pumpState} unit="" icon="power" tone={reading.pumpState === "ON" ? "success" : "warning"} footer="Relay input on GPIO25" />
          </View>
        </>
      ) : (
        <ErrorState message="Waiting for the first valid MQTT reading from the backend." onRetry={telemetry.refetch} />
      )}

      <SectionCard title="Connectivity">
        <ConnectionPill label="API" connected={telemetry.apiConnected} detail={telemetry.apiConnected ? "Latest and status endpoints reachable" : "Using cached or waiting state"} />
        <ConnectionPill label="MQTT" connected={telemetry.mqttConnected} detail={status.data?.mqtt.configured ? "Backend broker connection" : "Set MQTT_BROKER_URL to receive ESP32 telemetry"} />
      </SectionCard>

      <FreshnessNotice stale={telemetry.isStale} timestamp={reading?.timestamp} />
    </ScreenShell>
  );
}
