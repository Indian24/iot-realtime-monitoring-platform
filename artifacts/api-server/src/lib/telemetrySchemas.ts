import { z } from "zod";
import { TEMPERATURE_THRESHOLD_C } from "./iotConfig";

const numberFromUnknown = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
    z.number().finite().min(min).max(max),
  );

export const telemetryPayloadSchema = z
  .object({
    temperature: numberFromUnknown(-10, 85).optional(),
    tds: numberFromUnknown(0, 3000).optional(),
    waterLevel: numberFromUnknown(0, 5).optional(),
    threshold: numberFromUnknown(1, 80).default(TEMPERATURE_THRESHOLD_C).optional(),
    manualMode: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) => value.temperature !== undefined || value.tds !== undefined || value.waterLevel !== undefined,
    "At least one sensor value is required",
  );

export const limitQuerySchema = (defaultValue: number, maxValue: number) =>
  z.object({
    limit: z
      .preprocess((value) => (value === undefined ? defaultValue : Number(value)), z.number().int().min(1).max(maxValue))
      .default(defaultValue),
  });

export const sensorReadingSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  temperature: z.number().finite(),
  tds: z.number().finite().min(0),
  waterLevel: z.number().finite().min(0),
  pumpState: z.enum(["ON", "OFF"]),
  threshold: z.number().finite(),
  alert: z.enum(["NORMAL", "HIGH_TEMPERATURE"]),
  manualMode: z.boolean(),
});
