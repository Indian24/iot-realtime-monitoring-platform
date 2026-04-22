import 'dotenv/config';
import app from "./app";
import { iotStore } from "./lib/iotStore";
import { logger } from "./lib/logger";
import { mqttTelemetryService } from "./lib/mqttService";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await iotStore.connect();
mqttTelemetryService.connect();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
