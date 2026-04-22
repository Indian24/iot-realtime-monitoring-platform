export const TEMPERATURE_THRESHOLD_C = 35;

export const MQTT_TOPICS = {
  temperature: "ro/sensor/temperature",
  tds: "ro/sensor/tds",
  waterLevel: "ro/sensor/waterlevel",
  pump: "ro/device/pump",
  status: "ro/device/status",
  alert: "ro/device/alert",
} as const;

export const HARDWARE_PIN_MAP = {
  temperatureSensor: {
    sensor: "DS18B20 waterproof digital temperature sensor",
    dataPin: "GPIO4",
  },
  waterLevelSensor: {
    analogPin: "GPIO35",
  },
  tdsSensor: {
    analogPin: "GPIO34",
  },
  relay: {
    inputPin: "GPIO25",
  },
  oledDisplay: {
    sclPin: "GPIO22",
    sdaPin: "GPIO21",
  },
} as const;

export const MQTT_TOPIC_LIST = Object.values(MQTT_TOPICS);