import { Router, type IRouter } from "express";
import { ZodError } from "zod";
import { HARDWARE_PIN_MAP, MQTT_TOPIC_LIST, TEMPERATURE_THRESHOLD_C } from "../lib/iotConfig";
import { iotStore } from "../lib/iotStore";
import { mqttTelemetryService } from "../lib/mqttService";
import { limitQuerySchema } from "../lib/telemetrySchemas";

const router: IRouter = Router();

router.get("/latest", async (_req, res, next) => {
  try {
    res.json(await iotStore.latest());
  } catch (err) {
    if (isNoReadingError(err)) {
      res.status(404).json({ error: "NO_TELEMETRY", message: "No sensor readings available yet" });
      return;
    }
    next(err);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const { limit } = limitQuerySchema(60, 500).parse(req.query);
    res.json({ readings: await iotStore.history(limit) });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "INVALID_QUERY", issues: err.issues });
      return;
    }
    next(err);
  }
});

router.get("/status", async (_req, res, next) => {
  try {
    const latest = await iotStore.latest().catch(() => null);
    res.json({
      mode: "AUTOMATIC",
      threshold: TEMPERATURE_THRESHOLD_C,
      pumpRule: "Pump OFF when temperature is above 35°C; pump ON when temperature is 35°C or below.",
      latest,
      mqtt: mqttTelemetryService.status,
      database: iotStore.databaseStatus,
      topics: MQTT_TOPIC_LIST,
      hardware: HARDWARE_PIN_MAP,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const { limit } = limitQuerySchema(20, 100).parse(req.query);
    res.json({ alerts: await iotStore.alerts(limit) });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: "INVALID_QUERY", issues: err.issues });
      return;
    }
    next(err);
  }
});

router.get("/stream", async (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const unsubscribe = iotStore.onReading(send);
  const latest = await iotStore.latest().catch(() => null);
  if (latest) send({ type: "reading", reading: latest });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25_000);

  res.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

function isNoReadingError(err: unknown) {
  return err instanceof Error && err.message.includes("No sensor readings available");
}

export default router;
