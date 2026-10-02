# WACY Security Access

WACY Security Access is an enterprise-grade 5-head sensor door security monitoring system built for ESP32 and Arduino boards, integrated with an Express Node.js backend and a React Web Application Dashboard deployed on Vercel.

Production Web Dashboard URL: https://wavy-home.vercel.app/

---

## Hardware Configuration and Pin Mapping

The system connects a 5-head integrated sensor array (OUT 1 to OUT 5) to the ESP32 or Arduino board.

| Sensor Signal | Function | ESP32 Pin | Arduino UNO Pin |
| :--- | :--- | :--- | :--- |
| OUT 1 | Sensor Head 1 | GPIO 13 | Digital Pin 2 |
| OUT 2 | Sensor Head 2 | GPIO 12 | Digital Pin 3 |
| OUT 3 | Sensor Head 3 | GPIO 14 | Digital Pin 4 |
| OUT 4 | Sensor Head 4 | GPIO 27 | Digital Pin 5 |
| OUT 5 | Sensor Head 5 | GPIO 26 | Digital Pin 6 |

Power Connections:
- VCC: Connect to 3.3V or 5V
- GND: Connect to Common Ground (GND)

---

## ESP32 Pre-configured Settings

- WiFi SSID: T2.4
- WiFi Password: iloveanmum
- Target Vercel Endpoint: https://wavy-home.vercel.app/api/sensor-event

---

## System Architecture

```text
[5-Head Sensor OUT 1..5] ---> [ESP32 Board] ---> [HTTPS POST] ---> [https://wavy-home.vercel.app/api/sensor-event] ---> [WACY React Dashboard]
```

---

## Local Development and Build Commands

1. Install Dependencies:
```bash
npm install
```

2. Run Local Server:
```bash
npm run server
```

3. Run React Development Dashboard:
```bash
npm run dev
```

4. Build Production Distribution:
```bash
npm run build
```
