# WACY Security Access

WACY Security Access is a 5-sensor door security monitoring system built for ESP32 and Arduino boards, integrated with an Express Node.js backend and a React Web Application Dashboard.

---

## System Overview

The system uses 5 sequential motion or obstacle sensors positioned along a doorway corridor to track perimeter movement, passage events, and door opening activity in real-time.

### Core Features

1. Real-time 5-Sensor Monitoring: Displays live detection states across 5 corridor sensors.
2. Immediate Passage Counter: Increments door access count upon any sensor activation.
3. Armed Security Modes: Supports Away (Arm Away) and Home (Disarm) security modes.
4. Security Audit Trail: Maintains time-stamped activity logs with filter and CSV export capabilities.
5. Cloud & Local Support: Communicates over HTTP/HTTPS POST endpoints compatible with Vercel and local deployments.

---

## Hardware Configuration and Sensor Pin Mapping

The 5 sensors should be installed sequentially along the doorway path.

| Sensor Name | Position | ESP32 Pin | Arduino UNO Pin | Function |
| :--- | :--- | :--- | :--- | :--- |
| Sensor 1 | Outside Door | GPIO 13 | Digital Pin 2 | Outer perimeter detection |
| Sensor 2 | Outer Door Frame | GPIO 12 | Digital Pin 3 | Outer frame passage detection |
| Sensor 3 | Door Threshold | GPIO 14 | Digital Pin 4 | Main door open / center detection |
| Sensor 4 | Inner Door Frame | GPIO 27 | Digital Pin 5 | Inner frame passage detection |
| Sensor 5 | Inside Room | GPIO 26 | Digital Pin 6 | Interior room entry detection |

Power Connections:
- VCC: 3.3V or 5V (depending on sensor specification)
- GND: Common Ground (GND)

---

## System Architecture

```text
[5 Corridor Sensors] ---> [ESP32 / Arduino] ---> [HTTP/HTTPS POST] ---> [Express Server / Vercel API] ---> [WebSocket] ---> [React Web Dashboard]
```

### API Endpoints

- GET `/api/status` : Retrieves current system mode, passage count, and sensor states.
- GET `/api/logs` : Retrieves recent audit log entries.
- POST `/api/mode` : Updates security mode (AWAY / HOME).
- POST `/api/sensor-event` : Receives sensor trigger JSON payloads from ESP32 or gateway.
- POST `/api/clear-logs` : Resets audit log and passage counter.

---

## Local Development and Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Backend Server
```bash
npm run server
```

### 3. Run React Frontend Development Server
```bash
npm run dev
```

Open browser at `http://localhost:3000`.

### 4. Build Production Bundle
```bash
npm run build
```

---

## Deployment Configuration

This repository includes a `vercel.json` configuration file supporting deployment to Vercel serverless functions and static hosting.
