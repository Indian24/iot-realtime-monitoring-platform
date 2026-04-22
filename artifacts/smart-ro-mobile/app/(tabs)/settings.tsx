import { Feather } from "@expo/vector-icons";
import { useGetSystemStatus } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { ScreenShell, SectionCard } from "@/components/RoComponents";
import { useRoSettings } from "@/contexts/RoSettingsContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const { refreshIntervalMs, setRefreshIntervalMs, intervalOptions } = useRoSettings();
  const status = useGetSystemStatus({ query: { refetchInterval: refreshIntervalMs } });
  const hardware = status.data?.hardware;

  return (
    <ScreenShell title="Settings" subtitle="Control policy, telemetry refresh, and hardware reference for the installed ESP32 retrofit.">
      <SectionCard title="Temperature cutoff">
        <SettingRow label="Threshold" value={`${status.data?.threshold ?? 35}°C`} detail="Fixed automatic safety cutoff" />
        <SettingRow label="Pump rule" value="Automatic" detail="Pump OFF above 35°C, ON at 35°C or below" />
      </SectionCard>

      <SectionCard title="Refresh interval">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {intervalOptions.map((option) => {
            const active = option === refreshIntervalMs;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setRefreshIntervalMs(option);
                  Haptics.selectionAsync().catch(() => undefined);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderRadius: 999,
                  backgroundColor: active ? colors.primary : colors.secondary,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: active ? colors.primaryForeground : colors.secondaryForeground, fontFamily: "Inter_700Bold" }}>{option / 1000}s</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Manual override">
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
            <Feather name="lock" size={20} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>Reserved for future relay commands</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 }}>The backend is structured for a control endpoint later, but this build keeps pump control automatic for safety.</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="ESP32 hardware map">
        <SettingRow label="Temperature" value={hardware?.temperatureSensor.dataPin ?? "GPIO4"} detail="DS18B20 DATA with 4.7k pull-up to 3V3" />
        <SettingRow label="Water level" value={hardware?.waterLevelSensor.analogPin ?? "GPIO35"} detail="Analog signal input" />
        <SettingRow label="TDS" value={hardware?.tdsSensor.analogPin ?? "GPIO34"} detail="Analog signal input" />
        <SettingRow label="Relay" value={hardware?.relay.inputPin ?? "GPIO25"} detail="Pump control relay input" />
        <SettingRow label="OLED" value={`${hardware?.oledDisplay.sclPin ?? "GPIO22"} / ${hardware?.oledDisplay.sdaPin ?? "GPIO21"}`} detail="I2C SCL / SDA" />
      </SectionCard>
    </ScreenShell>
  );
}

function SettingRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 3 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 14 }}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 }}>{label}</Text>
        <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 15 }}>{value}</Text>
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }}>{detail}</Text>
    </View>
  );
}
