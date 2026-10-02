/*
  WACY Security Access - Dedicated ESP32 5-Head Integrated Sensor Code
  
  Hardware: 5-Head Sensor Module (เซนเซอร์ 5 หัวในชุดเดียว)
  Logic: Any single sensor head trigger counts as 1 Door Open / Passage Event with timestamp.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* VERCEL_SERVER_URL = "https://YOUR-APP-NAME.vercel.app/api/sensor-event";

// ESP32 GPIO Pins for 5 Sensor Heads (Head 1 to 5)
const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
const int SENSOR_TRIGGER_STATE = LOW;

const char* SENSOR_NAMES[5] = {
  "Sensor Head 1",
  "Sensor Head 2",
  "Sensor Head 3",
  "Sensor Head 4",
  "Sensor Head 5"
};

const unsigned long DEBOUNCE_DELAY = 100;

int lastPinState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
int currentSensorState[5] = {0, 0, 0, 0, 0};
unsigned long lastDebounceTime[5] = {0, 0, 0, 0, 0};

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
          Serial.printf("[HTTPS Vercel] Code: %d\n", httpResponseCode);
        } else {
          Serial.printf("[HTTPS Vercel] Error: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
      }
      delete client;
    }
  }
}

void sendDoorOpenEvent(int headId, const char* headName) {
  String json = "{";
  json += "\"type\":\"sensor_state\",";
  json += "\"sensor_id\":" + String(headId) + ",";
  json += "\"sensor_name\":\"" + String(headName) + "\",";
  json += "\"state\":1";
  json += "}";

  sendHttpsEvent(json);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WACY Security Access ESP32 5-Head ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    lastPinState[i] = digitalRead(SENSOR_PINS[i]);
  }

  Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi Connected]");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi Timeout] Running Serial mode.");
  }
}

void loop() {
  unsigned long now = millis();

  for (int i = 0; i < 5; i++) {
    int rawRead = digitalRead(SENSOR_PINS[i]);

    if (rawRead != lastPinState[i]) {
      lastDebounceTime[i] = now;
    }

    if ((now - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
      int isTriggered = (rawRead == SENSOR_TRIGGER_STATE) ? 1 : 0;

      if (isTriggered != currentSensorState[i]) {
        currentSensorState[i] = isTriggered;

        if (isTriggered == 1) {
          sendDoorOpenEvent(i + 1, SENSOR_NAMES[i]);
        }
      }
    }
    lastPinState[i] = rawRead;
  }

  delay(10);
}
