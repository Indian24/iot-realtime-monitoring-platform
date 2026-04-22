export type PumpState = "ON" | "OFF";
export type AlertStatus = "NORMAL" | "HIGH_TEMPERATURE";
export type AlertSeverity = "info" | "warning" | "critical";

export type SensorReading = {
  id: string;
  timestamp: string;
  temperature: number;
  tds: number;
  waterLevel: number;
  pumpState: PumpState;
  threshold: number;
  alert: AlertStatus;
  manualMode: boolean;
};

export type AlertEvent = {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  message: string;
  reading?: SensorReading;
};

export type PartialTelemetry = {
  temperature?: number;
  tds?: number;
  waterLevel?: number;
  threshold?: number;
  manualMode?: boolean;
};

export type ConnectionState = {
  configured: boolean;
  connected: boolean;
};

export type TelemetryEvent = {
  type: "reading";
  reading: SensorReading;
};
