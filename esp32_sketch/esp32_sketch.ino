/*
  WACY Security Access - Dedicated ESP32 5-Head Sensor Code
  
  Target Deployment: https://wavy-home.vercel.app/
  Target Endpoint:   https://wavy-home.vercel.app/api/sensor-event
  
  WiFi Credentials:
  - SSID: T5
  - Password: iloveanmum
  
  Hardware Pinouts (Sensor 5-Head Module OUT 1..5):
  - OUT 1 -> ESP32 GPIO 13
  - OUT 2 -> ESP32 GPIO 12
  - OUT 3 -> ESP32 GPIO 14
  - OUT 4 -> ESP32 GPIO 27
  - OUT 5 -> ESP32 GPIO 26
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// WiFi & Server Configuration
const char* WIFI_SSID = "T5";
const char* WIFI_PASSWORD = "iloveanmum";
const char* VERCEL_SERVER_URL = "https://wavy-home.vercel.app/api/sensor-event";

// ESP32 GPIO Pins for Sensor Heads OUT 1..5
const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
const int SENSOR_TRIGGER_STATE = LOW;

const char* SENSOR_NAMES[5] = {
  "Sensor Head OUT 1",
  "Sensor Head OUT 2",
  "Sensor Head OUT 3",
  "Sensor Head OUT 4",
  "Sensor Head OUT 5"
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
          Serial.printf("[Vercel HTTPS Success] Code: %d\n", httpResponseCode);
        } else {
          Serial.printf("[Vercel HTTPS Error] %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
      }
      delete client;
    }
  } else {
    Serial.println("[WiFi] Not connected. Event sent over Serial only.");
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
  Serial.println("\n--- WACY Security Access ESP32 (wavy-home.vercel.app) ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    lastPinState[i] = digitalRead(SENSOR_PINS[i]);
  }

  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
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
    Serial.print("Target Server: ");
    Serial.println(VERCEL_SERVER_URL);
  } else {
    Serial.println("\n[WiFi Connection Timeout] Please check router status.");
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
