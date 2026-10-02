/*
  WACY Security Access - ESP32 WiFi (HTTPS Vercel Ready & Serial Edition)
  
  Configuration:
  - Fill in your WiFi SSID and Password below before flashing to ESP32.
  - Fill in your Vercel deployment HTTPS URL.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// -------------------------------------------------------------------
// 1. WiFi & Server Configuration (Replace with your actual credentials)
// -------------------------------------------------------------------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your Vercel deployment URL
const char* VERCEL_SERVER_URL = "https://YOUR-APP-NAME.vercel.app/api/sensor-event"; 

// -------------------------------------------------------------------
// 2. ESP32 GPIO Pin Configuration (5 Sensors)
// -------------------------------------------------------------------
const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
const int SENSOR_TRIGGER_STATE = LOW; // LOW for IR Obstacle sensor, HIGH for PIR Motion sensor

const char* SENSOR_NAMES[5] = {
  "Sensor 1 (Outside Door)",
  "Sensor 2 (Outer Frame)",
  "Sensor 3 (Door Threshold)",
  "Sensor 4 (Inner Frame)",
  "Sensor 5 (Inside Room)"
};

const unsigned long DEBOUNCE_DELAY = 100;
const unsigned long PASSAGE_TIMEOUT = 3000;

int lastPinState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
int currentSensorState[5] = {0, 0, 0, 0, 0};
unsigned long lastDebounceTime[5] = {0, 0, 0, 0, 0};

int triggerSequence[5] = {0, 0, 0, 0, 0};
int sequenceCount = 0;
unsigned long firstSequenceTime = 0;

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
          Serial.printf("[HTTPS Vercel] Success Code: %d\n", httpResponseCode);
        } else {
          Serial.printf("[HTTPS Vercel] Error: %s (Code: %d)\n", http.errorToString(httpResponseCode).c_str(), httpResponseCode);
        }
        http.end();
      } else {
        Serial.println("[HTTPS Vercel] Unable to connect to server URL");
      }
      delete client;
    }
  } else {
    Serial.println("[WiFi] Not connected. Event skipped.");
  }
}

void sendSensorUpdate(int sensorId, const char* sensorName, int state) {
  String json = "{";
  json += "\"type\":\"sensor_state\",";
  json += "\"sensor_id\":" + String(sensorId) + ",";
  json += "\"sensor_name\":\"" + String(sensorName) + "\",";
  json += "\"state\":" + String(state);
  json += "}";

  sendHttpsEvent(json);
}

void sendPassageEvent(const char* direction) {
  String json = "{";
  json += "\"type\":\"passage_detected\",";
  json += "\"direction\":\"" + String(direction) + "\"";
  json += "}";

  sendHttpsEvent(json);
}

void evaluateSequence() {
  if (sequenceCount < 2) return;

  int first = triggerSequence[0];
  int last = triggerSequence[sequenceCount - 1];

  if ((first == 1 || first == 2) && (last == 4 || last == 5)) {
    sendPassageEvent("ENTRY");
  } else if ((first == 4 || first == 5) && (last == 1 || last == 2)) {
    sendPassageEvent("EXIT");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WACY Security Access ESP32 ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    lastPinState[i] = digitalRead(SENSOR_PINS[i]);
  }

  Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi Connected Successfully]");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Connection Timeout] Check credentials.");
  }
}

void loop() {
  unsigned long now = millis();

  if (sequenceCount > 0 && (now - firstSequenceTime > PASSAGE_TIMEOUT)) {
    evaluateSequence();
    sequenceCount = 0;
  }

  for (int i = 0; i < 5; i++) {
    int rawRead = digitalRead(SENSOR_PINS[i]);

    if (rawRead != lastPinState[i]) {
      lastDebounceTime[i] = now;
    }

    if ((now - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
      int isTriggered = (rawRead == SENSOR_TRIGGER_STATE) ? 1 : 0;

      if (isTriggered != currentSensorState[i]) {
        currentSensorState[i] = isTriggered;

        sendSensorUpdate(i + 1, SENSOR_NAMES[i], isTriggered);

        if (isTriggered == 1) {
          if (sequenceCount == 0) {
            firstSequenceTime = now;
          }
          if (sequenceCount < 5) {
            if (sequenceCount == 0 || triggerSequence[sequenceCount - 1] != (i + 1)) {
              triggerSequence[sequenceCount] = i + 1;
              sequenceCount++;
            }
          }
        }
      }
    }
    lastPinState[i] = rawRead;
  }

  delay(10);
}
