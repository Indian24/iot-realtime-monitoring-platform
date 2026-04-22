import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { MongoClient, type Collection, type Db } from "mongodb";
import { logger } from "./logger";
import { TEMPERATURE_THRESHOLD_C } from "./iotConfig";
import { telemetryPayloadSchema } from "./telemetrySchemas";
import type { AlertEvent, PartialTelemetry, SensorReading, TelemetryEvent } from "./iotTypes";

type SensorDocument = Omit<SensorReading, "id"> & {
  _id?: unknown;
};

const developmentFallbackReading: SensorReading = {
  id: "development-fallback",
  timestamp: new Date().toISOString(),
  temperature: 33.5,
  tds: 189,
  waterLevel: 4.1,
  pumpState: "ON",
  threshold: TEMPERATURE_THRESHOLD_C,
  alert: "NORMAL",
  manualMode: false,
};

const shouldUseDevelopmentFallback =
  process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI && !process.env.MQTT_BROKER_URL;

export class IotStore {
  private readings: SensorReading[] = shouldUseDevelopmentFallback ? [developmentFallbackReading] : [];
  private client: MongoClient | null = null;
  private collection: Collection<SensorDocument> | null = null;
  private connected = false;
  private events = new EventEmitter();

  get databaseStatus() {
    return {
      configured: Boolean(process.env.MONGODB_URI),
      connected: this.connected,
      provider: process.env.MONGODB_URI ? "MongoDB Atlas" : "In-memory development store",
    };
  }

  onReading(listener: (event: TelemetryEvent) => void) {
    this.events.on("reading", listener);
    return () => this.events.off("reading", listener);
  }

  async connect() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      logger.warn("MONGODB_URI is not configured; using in-memory telemetry store");
      return;
    }

    const dbName = process.env.MONGODB_DB_NAME ?? "smart_ro_purifier";
    const collectionName = process.env.MONGODB_COLLECTION ?? "sensor_logs";

    try {
      this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
      await this.client.connect();
      const db = this.client.db(dbName);
      await ensureSensorLogCollection(db, collectionName);
      this.collection = db.collection<SensorDocument>(collectionName);
      await this.collection.createIndex({ timestamp: -1 }, { name: "sensor_logs_timestamp_desc" });
      await this.collection.createIndex({ alert: 1, timestamp: -1 }, { name: "sensor_logs_alert_timestamp" });
      this.connected = true;
      logger.info({ dbName, collectionName }, "Connected to MongoDB telemetry store");
    } catch (err) {
      this.connected = false;
      this.collection = null;
      logger.error({ err }, "MongoDB connection failed; continuing with in-memory telemetry store");
    }
  }

  async save(partial: PartialTelemetry) {
    const payload = telemetryPayloadSchema.parse(partial);
    const previous = await this.latest().catch(() => null);

    if (!previous && (payload.temperature === undefined || payload.tds === undefined || payload.waterLevel === undefined)) {
      throw new Error("First telemetry payload must include temperature, tds, and waterLevel");
    }

    const temperature = payload.temperature ?? previous!.temperature;
    const threshold = payload.threshold ?? TEMPERATURE_THRESHOLD_C;
    const pumpState = temperature > threshold ? "OFF" : "ON";
    const alert = temperature > threshold ? "HIGH_TEMPERATURE" : "NORMAL";
    const reading: SensorReading = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      temperature,
      tds: payload.tds ?? previous!.tds,
      waterLevel: payload.waterLevel ?? previous!.waterLevel,
      pumpState,
      threshold,
      alert,
      manualMode: Boolean(payload.manualMode ?? previous?.manualMode ?? false),
    };

    this.readings = [...this.readings.filter((item) => item.id !== "development-fallback").slice(-199), reading];

    if (this.collection) {
      try {
        const { id, ...document } = reading;
        await this.collection.insertOne(document);
      } catch (err) {
        logger.error({ err }, "Failed to persist sensor reading");
        throw err;
      }
    }

    this.events.emit("reading", { type: "reading", reading } satisfies TelemetryEvent);
    return reading;
  }

  async latest() {
    if (this.collection) {
      try {
        const document = await this.collection.find().sort({ timestamp: -1 }).limit(1).next();
        if (document) return fromDocument(document);
      } catch (err) {
        logger.error({ err }, "Failed to read latest MongoDB telemetry");
        throw err;
      }
    }

    const reading = this.readings.at(-1);
    if (!reading) throw new Error("No sensor readings available yet");
    return reading;
  }

  async history(limit: number) {
    if (this.collection) {
      try {
        const documents = await this.collection.find().sort({ timestamp: -1 }).limit(limit).toArray();
        return documents.map(fromDocument).reverse();
      } catch (err) {
        logger.error({ err }, "Failed to read MongoDB telemetry history");
        throw err;
      }
    }

    return this.readings.slice(-limit);
  }

  async alerts(limit: number): Promise<AlertEvent[]> {
    const readings = await this.history(Math.max(limit * 4, limit));
    return readings
      .filter((reading) => reading.alert !== "NORMAL")
      .slice(-limit)
      .map((reading) => ({
        id: `alert-${reading.id}`,
        timestamp: reading.timestamp,
        severity: "warning",
        message: `Temperature exceeded ${reading.threshold}°C. Pump stopped automatically.`,
        reading,
      }));
  }
}

async function ensureSensorLogCollection(db: Db, collectionName: string) {
  const existing = await db.listCollections({ name: collectionName }).toArray();
  const validator = {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "temperature", "tds", "waterLevel", "pumpState", "threshold", "alert", "manualMode"],
      properties: {
        timestamp: { bsonType: "string" },
        temperature: { bsonType: ["double", "int", "long", "decimal"] },
        tds: { bsonType: ["double", "int", "long", "decimal"] },
        waterLevel: { bsonType: ["double", "int", "long", "decimal"] },
        pumpState: { enum: ["ON", "OFF"] },
        threshold: { bsonType: ["double", "int", "long", "decimal"] },
        alert: { enum: ["NORMAL", "HIGH_TEMPERATURE"] },
        manualMode: { bsonType: "bool" },
      },
    },
  };

  if (existing.length === 0) {
    await db.createCollection(collectionName, { validator, validationLevel: "moderate" });
    return;
  }

  await db.command({ collMod: collectionName, validator, validationLevel: "moderate" }).catch((err) => {
    logger.warn({ err }, "MongoDB collection validator could not be updated");
  });
}

function fromDocument(document: SensorDocument): SensorReading {
  const id =
    document._id && typeof document._id === "object" && "toString" in document._id
      ? document._id.toString()
      : randomUUID();
  return {
    id,
    timestamp: new Date(document.timestamp).toISOString(),
    temperature: document.temperature,
    tds: document.tds,
    waterLevel: document.waterLevel,
    pumpState: document.pumpState,
    threshold: document.threshold,
    alert: document.alert,
    manualMode: document.manualMode,
  };
}

export const iotStore = new IotStore();
