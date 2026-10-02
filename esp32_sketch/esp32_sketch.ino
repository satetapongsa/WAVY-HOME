/*
  WAVY Home - Dedicated ESP32 Edge Trigger 5-Sensor Code
  
  Logic:
  Each sensor head (1 to 5) works 100% independently.
  As soon as ANY SINGLE sensor head (S1, S2, S3, S4, or S5) is triggered:
  - It sends 1 Door Open / Room Access event instantly to Vercel/Serial.
  - Has a 1.5-second cooldown per sensor head to prevent double-counting on a single pass.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* WIFI_SSID = "T2.4";
const char* WIFI_PASSWORD = "iloveanmum";
const char* VERCEL_SERVER_URL = "https://wavy-home.vercel.app/api/sensor-event";

const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
const int SENSOR_TRIGGER_STATE = LOW;

const char* SENSOR_NAMES[5] = {
  "Sensor Head OUT 1",
  "Sensor Head OUT 2",
  "Sensor Head OUT 3",
  "Sensor Head OUT 4",
  "Sensor Head OUT 5"
};

const unsigned long TRIGGER_COOLDOWN_MS = 1500;

bool currentSensorState[5] = {false, false, false, false, false};
unsigned long lastTriggerTime[5] = {0, 0, 0, 0, 0};

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

void sendDoorAccessEvent(int headId, const char* headName) {
  String json = "{";
  json += "\"type\":\"door_access\",";
  json += "\"sensor_id\":" + String(headId) + ",";
  json += "\"sensor_name\":\"" + String(headName) + "\",";
  json += "\"state\":1";
  json += "}";

  sendHttpsEvent(json);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WAVY Home ESP32 ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    currentSensorState[i] = false;
    lastTriggerTime[i] = 0;
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

  for (int i = 0; i < 5; i++) {
    int rawRead = digitalRead(SENSOR_PINS[i]);
    bool isTriggered = (rawRead == SENSOR_TRIGGER_STATE);

    if (isTriggered) {
      if (!currentSensorState[i] && (now - lastTriggerTime[i] > TRIGGER_COOLDOWN_MS)) {
        currentSensorState[i] = true;
        lastTriggerTime[i] = now;

        sendDoorAccessEvent(i + 1, SENSOR_NAMES[i]);
      }
    } else {
      currentSensorState[i] = false;
    }
  }

  delay(10);
}
