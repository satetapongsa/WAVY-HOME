/*
  WACY Security Access - Independent 5-Sensor Door Open/Close Detector
  
  Fault-Tolerant Independent Sensor Design:
  Each sensor head (1 to 5) operates 100% independently. 
  If Sensor Head 5 (or any sensor) is broken/damaged/disconnected, 
  all remaining working sensors (1, 2, 3, 4) will continue to detect and send events normally.
  
  WiFi Configured:
  - SSID: T5
  - Password: iloveanmum
  - Target Endpoint: https://wavy-home.vercel.app/api/sensor-event
*/

#ifdef ESP32
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiClientSecure.h>

  // WiFi & Server Configuration for ESP32
  const char* WIFI_SSID = "T5";
  const char* WIFI_PASSWORD = "iloveanmum";
  const char* VERCEL_SERVER_URL = "https://wavy-home.vercel.app/api/sensor-event";

  // ESP32 GPIO Pins for 5 Sensor Heads (Head 1 to 5)
  const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
#else
  // Arduino UNO Digital Pins
  const int SENSOR_PINS[5] = {2, 3, 4, 5, 6};
#endif

// Active state: LOW for Active-Low IR Sensors (Change to HIGH if sensors output HIGH when triggered)
const int SENSOR_TRIGGER_STATE = LOW;

const char* SENSOR_NAMES[5] = {
  "Sensor Head 1",
  "Sensor Head 2",
  "Sensor Head 3",
  "Sensor Head 4",
  "Sensor Head 5"
};

const unsigned long DEBOUNCE_DELAY = 100;

// Independent State Trackers per sensor head
int lastPinState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
int currentSensorState[5] = {0, 0, 0, 0, 0};
unsigned long lastDebounceTime[5] = {0, 0, 0, 0, 0};

void sendEvent(String jsonPayload) {
  Serial.println(jsonPayload);

#ifdef ESP32
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
#endif
}

void sendDoorAccessEvent(int headId, const char* headName) {
  String json = "{";
  json += "\"type\":\"door_access\",";
  json += "\"sensor_id\":" + String(headId) + ",";
  json += "\"sensor_name\":\"" + String(headName) + "\",";
  json += "\"state\":1";
  json += "}";

  sendEvent(json);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WACY Security Access (Independent 5-Sensor) ---");

  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    lastPinState[i] = digitalRead(SENSOR_PINS[i]);
  }

#ifdef ESP32
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
  } else {
    Serial.println("\n[WiFi Connection Timeout]");
  }
#endif
}

void loop() {
  unsigned long now = millis();

  // Read each sensor 100% independently
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
          // Trigger 1 Door Access Event independently
          sendDoorAccessEvent(i + 1, SENSOR_NAMES[i]);
        }
      }
    }
    lastPinState[i] = rawRead;
  }

  delay(10);
}