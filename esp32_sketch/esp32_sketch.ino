/*
  WAVY Home - Dedicated ESP32 3+ Sensor Threshold Trigger Code
  
  Logic:
  Counts as 1 Door Open / Room Access event ONLY when 3 or more sensor heads (>= 3)
  detect motion/object passing at the exact same time simultaneously!
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* WIFI_SSID = "T2.4";
const char* WIFI_PASSWORD = "iloveanmum";
const char* VERCEL_SERVER_URL = "https://wavy-home.vercel.app/api/sensor-event";

const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
const int SENSOR_TRIGGER_STATE = LOW;

const int REQUIRED_SENSORS_THRESHOLD = 3;
const unsigned long TRIGGER_COOLDOWN_MS = 2500;

bool currentSensorState[5] = {false, false, false, false, false};
unsigned long lastGroupTriggerTime = 0;
bool groupActive = false;

void sendHttpsEvent(String jsonPayload) {
  Serial.print("[Serial JSON]: ");
  Serial.println(jsonPayload);

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure *client = new WiFiClientSecure;
    if (client) {
      client->setInsecure();
      HTTPClient http;
      if (http.begin(*client, VERCEL_SERVER_URL)) {
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST(jsonPayload);
        if (httpResponseCode > 0) {
          Serial.printf("[Vercel HTTPS Success] Code: %d\n", httpResponseCode);
        } else {
          Serial.printf("[Vercel HTTPS Error] %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
      }
      delete client;
    }
  } else {
    Serial.println("[WiFi] Not connected. Sent via Serial only.");
  }
}

void sendMultiSensorAccessEvent(int activeCount) {
  String json = "{";
  json += "\"type\":\"door_access\",";
  json += "\"active_count\":" + String(activeCount) + ",";
  json += "\"state\":1";
  json += "}";

  sendHttpsEvent(json);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WAVY Home ESP32 (3+ Sensor Threshold) ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    currentSensorState[i] = false;
  }

  Serial.printf("Connecting to WiFi 2.4GHz: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi Connected Successfully!]");
    Serial.print("ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Connection Timeout]");
  }
}

void loop() {
  unsigned long now = millis();
  int activeCount = 0;

  for (int i = 0; i < 5; i++) {
    int rawRead = digitalRead(SENSOR_PINS[i]);
    if (rawRead == SENSOR_TRIGGER_STATE) {
      activeCount++;
      currentSensorState[i] = true;
    } else {
      currentSensorState[i] = false;
    }
  }

  if (activeCount >= REQUIRED_SENSORS_THRESHOLD) {
    if (!groupActive && (now - lastGroupTriggerTime > TRIGGER_COOLDOWN_MS)) {
      groupActive = true;
      lastGroupTriggerTime = now;

      sendMultiSensorAccessEvent(activeCount);
    }
  } else if (activeCount == 0) {
    groupActive = false;
  }

  delay(10);
}
