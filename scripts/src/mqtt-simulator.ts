import mqtt from "mqtt";

const brokerUrl = process.env.MQTT_BROKER_URL;

if (!brokerUrl) {
  console.error("MQTT_BROKER_URL is required to run the simulator.");
  process.exit(1);
}

const client = mqtt.connect(brokerUrl, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `smart-ro-simulator-${Date.now()}`,
  clean: true,
});

const topics = {
  status: "ro/device/status",
};

let tick = 0;

client.on("connect", () => {
  console.log(`Connected to ${sanitizeBrokerUrl(brokerUrl)}`);
  publishReading();
  setInterval(publishReading, Number(process.env.MQTT_SIM_INTERVAL_MS ?? 5_000));
});

client.on("error", (err) => {
  console.error("MQTT simulator error:", err.message);
});

function publishReading() {
  tick += 1;
  const highTempCycle = tick % 8 === 0;
  const temperature = highTempCycle ? 36.4 : round(31.5 + Math.sin(tick / 2) * 1.8);
  const payload = {
    temperature,
    tds: Math.round(175 + Math.cos(tick / 3) * 18),
    waterLevel: round(4.2 - (tick % 6) * 0.08),
    threshold: 35,
    manualMode: false,
  };

  client.publish(topics.status, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      console.error("Publish failed:", err.message);
      return;
    }
    console.log(`Published ${topics.status}: ${JSON.stringify(payload)}`);
  });
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function sanitizeBrokerUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.username) parsed.username = "configured";
    if (parsed.password) parsed.password = "redacted";
    return parsed.toString();
  } catch {
    return "configured broker";
  }
}
