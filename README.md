# Smart RO Purifier IoT App

An ESP32-based smart retrofit that transforms a traditional RO water purifier into an intelligent, connected IoT system.

It enables real-time monitoring of temperature, TDS, water level, pump status, and safety alerts through a mobile app built with React Native (Expo). The system uses MQTT for reliable device-to-cloud communication and a Node.js + Express backend for data processing, APIs, and live streaming.

Unlike conventional fixed-threshold systems, this project introduces a machine learning–based temperature prediction approach that adapts safety thresholds based on environmental conditions and usage patterns. Instead of relying on a constant cutoff, the system dynamically determines when the pump should stop, improving both safety and efficiency across different geographic and operating conditions.

Designed for real-world domestic use, the system also includes automatic safety control, historical data tracking with MongoDB, and a full MQTT simulator for testing without hardware.

👉 Tech Stack: ESP32 | MQTT | Node.js | Express | MongoDB Atlas | React Native (Expo) | TypeScript

## 📱 App Preview

## 📱 App Preview

### 🏠 Dashboard (System Overview)
![Dashboard](./assets/dashboard.jpeg)

**Description:**  
The main dashboard provides a real-time overview of the RO system, including pump status, current water level, daily consumption, incoming water temperature, and live TDS values. It gives users instant visibility into the purifier’s operational state.

---

### 📊 History (Trends & Analysis)
![History](./assets/history.jpeg)

**Description:**  
The history page stores and analyzes temperature and TDS trends over time. This supports predictive maintenance, helps estimate area-specific threshold temperatures, and can be used for machine-learning-based insight into membrane health and water quality behavior.

---

### ⚙️ Settings (Control & Refresh)
![Settings](./assets/settings.jpeg)

**Description:**  
The settings page allows users to switch between automatic and manual pump control depending on household needs. It also lets users adjust the refresh interval, such as 5, 10, 30, or 60 seconds, based on network speed and live data update preference.


## Key Highlights

* Real-time telemetry from an ESP32-based RO retrofit
* Live monitoring of temperature, TDS, water level, pump state, and alerts
* MQTT-based data pipeline for reliable device-to-backend communication
* Express backend with REST APIs and live event streaming
* MongoDB Atlas support for historical persistence
* Expo React Native mobile app for a clean monitoring experience
* Fixed automatic pump cutoff at **35°C**
* MQTT simulator for full testing without physical hardware
* Hardware pin mapping documented for easier firmware integration
* Local fallback behavior when cloud services are not configured

## Problem Statement

Traditional RO purifier systems operate as isolated appliances. They usually do not provide real-time visibility into sensor readings, do not keep useful telemetry history, and do not offer automated safety behavior that can be monitored from a phone.

This project solves that gap by retrofitting a standard RO setup with ESP32-based sensing, MQTT messaging, backend validation, and a mobile interface. The result is a practical IoT system that improves visibility, control, and safety without changing the core purifier workflow.

## Solution Overview

The system uses a simple but robust IoT pipeline:

```text
ESP32 / MQTT Simulator → MQTT Broker → Backend API Server → REST APIs + Live Stream → Mobile App
```

The ESP32 publishes sensor and device telemetry to MQTT topics. The backend subscribes to those topics, validates incoming data, applies the unchanged **35°C pump cutoff logic**, stores data when MongoDB is available, and exposes the readings through REST APIs and a live stream for the app.

## Features

* Real-time monitoring of RO telemetry
* Temperature, TDS, and water level tracking
* Pump relay status and safety control
* Automatic pump cutoff at **35°C**
* REST APIs for:

  * latest reading
  * telemetry history
  * system status
  * alerts
* Live event stream for instant mobile updates
* MongoDB Atlas persistence when configured
* MQTT simulator support for development and testing
* Hardware pin mapping for firmware integration
* Mobile-first interface designed for practical monitoring
* Clean fallback behavior when MQTT or MongoDB is not configured

## System Architecture

```text
+-------------------+         +------------------+         +----------------------+
|   ESP32 Device    |         |   MQTT Broker    |         |   Backend API Server |
|-------------------|         |------------------|         |----------------------|
| Sensors & Relay   | ----->  | Topics & Routing | ----->  | Validate & Store     |
| Publishes Telemetry|         |                  |         | REST + Live Stream   |
+-------------------+         +------------------+         +----------------------+
           ^                                                           |
           |                                                           v
           |                                                +----------------------+
           |                                                |   Mobile App         |
           |                                                |----------------------|
           |                                                | Live status, alerts  |
           |                                                | latest values        |
           |                                                +----------------------+
           |
           |                                                +----------------------+
           +-----------------------------------------------> | MQTT Simulator       |
                                                            | dev/test telemetry   |
                                                            +----------------------+

Optional persistence:
Backend → MongoDB Atlas
```

### Component responsibilities

**ESP32**

* Reads hardware sensors
* Controls relay / pump
* Publishes telemetry to MQTT
* Applies device-side logic and status updates

**MQTT Broker**

* Routes messages between device, simulator, and backend
* Keeps the system decoupled and scalable

**Backend API Server**

* Subscribes to MQTT topics
* Validates telemetry payloads
* Applies the 35°C cutoff rule
* Exposes REST APIs
* Streams live updates to the mobile app
* Stores records in MongoDB when configured

**Mobile App**

* Displays live readings
* Shows pump state and alerts
* Provides a clear monitoring interface for the user

**MQTT Simulator**

* Publishes realistic telemetry without ESP32 hardware
* Useful for development, testing, and demo verification

**MongoDB Atlas**

* Stores historical telemetry and alert data when enabled
* Helps with trend analysis and later review

## Tech Stack

### Frontend

* Expo
* React Native

### Backend

* Node.js
* Express

### IoT / Messaging

* MQTT
* Mosquitto-compatible broker

### Database

* MongoDB Atlas
* In-memory fallback when MongoDB is not configured

### Testing / Simulation

* MQTT simulator script

### Language / Tooling

* TypeScript
* pnpm
* PowerShell on Windows

## Repository Structure

```text
.
├── artifacts/
│   ├── api-server/          # Express backend API
│   └── smart-ro-mobile/     # Expo React Native mobile app
├── scripts/
│   └── src/
│       └── mqtt-simulator.ts # MQTT simulator for telemetry testing
├── README.md
└── ...
```

## Hardware Pin Map

| Component                 | Pin    |
| ------------------------- | ------ |
| DS18B20 temperature DATA  | GPIO4  |
| Water level analog signal | GPIO35 |
| TDS analog signal         | GPIO34 |
| Relay IN                  | GPIO25 |
| OLED SCL                  | GPIO22 |
| OLED SDA                  | GPIO21 |

## MQTT Topics

| Topic                   | Purpose                       |
| ----------------------- | ----------------------------- |
| `ro/sensor/temperature` | Temperature sensor updates    |
| `ro/sensor/tds`         | TDS sensor updates            |
| `ro/sensor/waterlevel`  | Water level sensor updates    |
| `ro/device/status`      | Complete device state payload |
| `ro/device/pump`        | Pump relay state updates      |
| `ro/device/alert`       | Safety or system alerts       |

## Sample MQTT Payload

Publish a complete payload to `ro/device/status` for clean end-to-end testing:

```json
{
  "temperature": 32.5,
  "tds": 189,
  "waterLevel": 4.2,
  "threshold": 35,
  "manualMode": false
}
```

This format is useful because it carries the core telemetry in one message, which makes validation, persistence, and live streaming simpler across the whole system.

## Environment Variables

Copy these into your environment and update the values for your setup.

| Variable                   | Purpose                    | Example                                                                        |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `MONGODB_URI`              | MongoDB connection string  | `mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME`          | Database name              | `smart_ro_purifier`                                                            |
| `MONGODB_COLLECTION`       | Telemetry collection name  | `sensor_logs`                                                                  |
| `MQTT_BROKER_URL`          | MQTT broker endpoint       | `mqtt://10.46.122.188:1883`                                                    |
| `MQTT_USERNAME`            | MQTT username              | empty or broker-specific                                                       |
| `MQTT_PASSWORD`            | MQTT password              | empty or broker-specific                                                       |
| `MQTT_CLIENT_ID`           | Client identifier          | `smart-ro-api`                                                                 |
| `MQTT_SIM_INTERVAL_MS`     | Simulator publish interval | `5000`                                                                         |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile app backend URL     | `http://10.46.122.188:3001`                                                    |

MongoDB and MQTT are optional for local fallback behavior, but both are recommended for the full experience.

## Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Sensible-Engineering-Choice
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Set the backend and app environment values for your current network. Use your laptop’s current IPv4 address.

### 4. Start the MQTT broker

Start Mosquitto or your broker first. The broker must be available before the backend and device publisher start.

### 5. Start the backend API

The backend subscribes to MQTT topics and serves the REST APIs.

### 6. Start the simulator or ESP32

Use **only one telemetry source at a time** if you want clean sensor data.

### 7. Start the Expo app

Launch the mobile app after the backend is running so the app can reach the API and live stream.

### Recommended startup order

1. MQTT broker
2. Backend API
3. Simulator or ESP32
4. Expo app

That order matters because every later layer depends on the earlier one being available.

## Three-Terminal Workflow

Use these PowerShell commands on Windows.

### Terminal 1 — MQTT broker

```powershell
mosquitto -c C:\mosquitto\mosquitto.conf -v
```

### Terminal 2 — Backend API

```powershell
$env:MQTT_BROKER_URL="mqtt://10.46.122.188:1883"
pnpm --filter @workspace/api-server dev
```

### Terminal 3 — Simulator

```powershell
$env:MQTT_BROKER_URL="mqtt://10.46.122.188:1883"
pnpm --filter @workspace/scripts mqtt:simulate
```

### Expo frontend

Run this in a separate terminal from the mobile app folder:

```powershell
cd artifacts/smart-ro-mobile
npx expo start --lan -c
```

### Important IP note

Replace `10.46.122.188` with the **current IPv4 address of your laptop**. The same IP must be used in:

* ESP32 code
* backend MQTT URL
* `EXPO_PUBLIC_API_BASE_URL`

## How to Verify the System

Use this checklist to confirm each layer is working:

* MQTT broker starts without port conflicts
* Backend connects and subscribes to MQTT topics
* Simulator publishes telemetry successfully
* ESP32 connects to the broker successfully
* `GET /api/latest` returns valid JSON
* `GET /api/status` returns healthy status
* `GET /api/history` returns telemetry records
* Mobile app shows live updates
* MQTT logs show publish and subscribe activity

### Quick verification examples

```bash
http://10.46.122.188:3001/api/latest
http://10.46.122.188:3001/api/status
http://10.46.122.188:3001/api/history?limit=60
```

## API Documentation

### `GET /api/latest`

Returns the most recent telemetry snapshot.

### `GET /api/history?limit=60`

Returns recent telemetry entries for charts and historical review.

### `GET /api/status`

Returns current system health and connectivity status.

### `GET /api/alerts?limit=20`

Returns recent alerts generated by the system.

### `GET /api/stream`

Provides a live event stream for real-time mobile updates.

## Mobile App Experience

The mobile app gives a simple live view of the purifier state:

* latest temperature
* TDS value
* water level
* pump status
* alerts
* live updates as new MQTT data arrives

The goal is quick visibility, not clutter. The UI is built for practical monitoring from a phone.

## Important Operational Notes

* Do not run both the simulator and the ESP32 at the same time if you want clean data.
* Use only one telemetry source at a time.
* The automatic pump cutoff remains fixed at **35°C**.
* If multiple sources publish to the same MQTT topic, the app may show mixed or inconsistent readings.
* Your laptop IP can change when switching between Wi-Fi, hotspot, or other networks, so configs must be updated accordingly.

## Deployment Guidance

A production deployment should separate the system into stable services:

* Frontend can be deployed as a web build if needed
* Backend can be hosted on a Node-friendly platform
* MQTT broker should be hosted on a stable broker or VPS for production
* ESP32 should point to the deployed broker
* Frontend should point to the deployed backend

The exact deployment provider can vary, but the architecture should remain the same: device → broker → backend → app.

## Troubleshooting

### `MQTT_BROKER_URL is required`

Set the environment variable before starting the simulator or backend.

### Broker connection refused

The broker is not running, the IP is wrong, or port `1883` is blocked.

### Wrong IP address

Update all configs after changing Wi-Fi, hotspot, or router.

### Expo cannot find the `expo` package

Run `pnpm install` inside the correct app workspace and start Expo from `artifacts/smart-ro-mobile`.

### Backend returns `404` for `/api/latest`

Telemetry has not arrived yet, or no publisher is connected.

### Simulator and ESP32 both publishing

Stop one of them to avoid mixed readings.

### Port `1883` already in use

Another MQTT broker or service is already running on that port.

### Phone and laptop on different networks

Make sure both are on the same hotspot or Wi-Fi network.

### Local-only Mosquitto mode

Use a proper Mosquitto config that allows external connections when needed.

### Windows PowerShell syntax issues

Use PowerShell variable syntax:

```powershell
$env:MQTT_BROKER_URL="mqtt://10.46.122.188:1883"
```

Do not use Linux shell syntax in PowerShell.

## Future Improvements

Possible next steps for this project include:

* authenticated user accounts
* push notifications for alerts
* analytics dashboard and trend charts
* role-based views for admin and user
* deployment hardening
* cloud MQTT integration
* hardware fault detection
* richer historical graphs and insights
* multi-device support

## Why This Project Stands Out

This project is strong because it combines multiple real engineering layers in one practical system:

* hardware integration
* firmware logic
* backend development
* MQTT-based communication
* mobile app development
* safety automation
* live telemetry handling

It demonstrates a real IoT architecture, live data flow, and a useful domestic application. The simulator fallback also shows that the system was designed for development, testing, and demo reliability.

## License

Use and modification rights can be added here based on your repository policy.

## Acknowledgments

Built as a smart retrofit IoT solution for RO purifier monitoring and automation.

## Contact

Project maintainer details can be added here if needed.
