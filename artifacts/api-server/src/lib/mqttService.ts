import mqtt, { type MqttClient } from "mqtt";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { TEMPERATURE_THRESHOLD_C, MQTT_TOPICS, MQTT_TOPIC_LIST } from "./iotConfig";
import { logger } from "./logger";
import { iotStore } from "./iotStore";
import { telemetryPayloadSchema } from "./telemetrySchemas";
import type { PartialTelemetry } from "./iotTypes";

class MqttTelemetryService {
  private client: MqttClient | null = null;
  private connected = false;
  private lastMessageAt: string | null = null;
  private pendingTelemetry: PartialTelemetry = {};

  get status() {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    return {
      configured: Boolean(brokerUrl),
      connected: this.connected,
      brokerUrl: brokerUrl ? sanitizeBrokerUrl(brokerUrl) : undefined,
      lastMessageAt: this.lastMessageAt ?? undefined,
    };
  }

  connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    if (!brokerUrl) {
      logger.warn("MQTT_BROKER_URL is not configured; REST API will serve stored telemetry only");
      return;
    }

    this.client = mqtt.connect(brokerUrl, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: process.env.MQTT_CLIENT_ID ?? `smart-ro-api-${randomUUID()}`,
      reconnectPeriod: 5_000,
      clean: true,
    });

    this.client.on("connect", () => {
      this.connected = true;
      this.client?.subscribe([MQTT_TOPICS.temperature, MQTT_TOPICS.tds, MQTT_TOPICS.waterLevel, MQTT_TOPICS.status], { qos: 1 }, (err) => {
        if (err) logger.error({ err }, "Failed to subscribe to MQTT topics");
        else logger.info({ topics: MQTT_TOPIC_LIST }, "Subscribed to MQTT topics");
      });
    });

    this.client.on("reconnect", () => {
      this.connected = false;
    });

    this.client.on("close", () => {
      this.connected = false;
    });

    this.client.on("error", (err) => {
      this.connected = false;
      logger.error({ err }, "MQTT connection error");
    });

    this.client.on("message", (topic, payload) => {
      void this.handleMessage(topic, payload);
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const telemetry = parsePayload(topic, payload);
      this.pendingTelemetry = { ...this.pendingTelemetry, ...telemetry };
      const hasStoredReading = await iotStore.latest().then(() => true).catch(() => false);
      const candidate = hasStoredReading ? telemetry : this.pendingTelemetry;
      if (!hasStoredReading && !hasCompleteFirstReading(candidate)) {
        logger.info({ topic }, "Buffered partial MQTT telemetry until first complete reading arrives");
        return;
      }
      const reading = await iotStore.save(candidate);
      this.pendingTelemetry = {};
      this.lastMessageAt = reading.timestamp;
      this.publishState(reading.pumpState, reading.alert);
    } catch (err) {
      if (err instanceof ZodError) {
        logger.warn({ topic, issues: err.issues }, "Rejected invalid MQTT telemetry payload");
        return;
      }
      logger.error({ err, topic }, "Failed to process MQTT message");
    }
  }

  private publishState(pumpState: "ON" | "OFF", alert: "NORMAL" | "HIGH_TEMPERATURE") {
    if (!this.client || !this.connected) return;
    const payload = JSON.stringify({
      pumpState,
      threshold: TEMPERATURE_THRESHOLD_C,
      alert,
      mode: "AUTOMATIC",
    });
    this.client.publish(MQTT_TOPICS.pump, payload, { qos: 1, retain: true });
    this.client.publish(MQTT_TOPICS.alert, payload, { qos: 1, retain: true });
  }
}

function hasCompleteFirstReading(value: PartialTelemetry) {
  return value.temperature !== undefined && value.tds !== undefined && value.waterLevel !== undefined;
}

function parsePayload(topic: string, payload: Buffer): PartialTelemetry {
  const text = payload.toString("utf8").trim();
  const parsed = parseJson(text);

  // ✅ handle full JSON payload (including ro/device/status)
if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
  return telemetryPayloadSchema.parse(parsed);
}

// ✅ explicitly allow status topic (safety fallback)
if (topic === MQTT_TOPICS.status && parsed) {
  return telemetryPayloadSchema.parse(parsed);
}

  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error("MQTT payload must be JSON or a numeric sensor value");

  if (topic === MQTT_TOPICS.temperature) return telemetryPayloadSchema.parse({ temperature: value });
  if (topic === MQTT_TOPICS.tds) return telemetryPayloadSchema.parse({ tds: value });
  if (topic === MQTT_TOPICS.waterLevel) return telemetryPayloadSchema.parse({ waterLevel: value });

  throw new Error(`Unsupported MQTT topic: ${topic}`);
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sanitizeBrokerUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "redacted";
    if (parsed.username) parsed.username = "configured";
    return parsed.toString();
  } catch {
    return "configured";
  }
}

export const mqttTelemetryService = new MqttTelemetryService();
