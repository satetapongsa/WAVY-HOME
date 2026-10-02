/*
  WACY Security Access - ESP32 & Arduino 5-Head Integrated Sensor Code
  
  Target Deployment: https://wavy-home.vercel.app/
  Target Endpoint:   https://wavy-home.vercel.app/api/sensor-event
  
  WiFi Configured:
  - SSID: T5
  - Password: iloveanmum
  
  Hardware Pinouts (Sensor 5-Head Module OUT 1..5):
  - OUT 1 -> ESP32 GPIO 13 (Arduino UNO Pin D2)
  - OUT 2 -> ESP32 GPIO 12 (Arduino UNO Pin D3)
  - OUT 3 -> ESP32 GPIO 14 (Arduino UNO Pin D4)
  - OUT 4 -> ESP32 GPIO 27 (Arduino UNO Pin D5)
  - OUT 5 -> ESP32 GPIO 26 (Arduino UNO Pin D6)
*/

#ifdef ESP32
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiClientSecure.h>

  // WiFi & Server Configuration for ESP32
  const char* WIFI_SSID = "T5";
  const char* WIFI_PASSWORD = "iloveanmum";
  const char* VERCEL_SERVER_URL = "https://wavy-home.vercel.app/api/sensor-event";

  // ESP32 GPIO Pins for Sensor Heads OUT 1..5
  const int SENSOR_PINS[5] = {13, 12, 14, 27, 26};
#else
  // Arduino UNO Digital Pins for Sensor Heads OUT 1..5
  const int SENSOR_PINS[5] = {2, 3, 4, 5, 6};
#endif

// Active state: LOW for Active-Low IR Sensors (Most 5-head modules output LOW on detection)
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

void sendEvent(String jsonPayload) {
  Serial.println(jsonPayload);

#ifdef ESP32
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure *client = new WiFiClientSecure;
    if (client) {
      client->setInsecure(); // Bypass SSL certificate check for Vercel
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
#endif
}

void sendDoorOpenEvent(int headId, const char* headName) {
  String json = "{";
  json += "\"type\":\"sensor_state\",";
  json += "\"sensor_id\":" + String(headId) + ",";
  json += "\"sensor_name\":\"" + String(headName) + "\",";
  json += "\"state\":1";
  json += "}";

  sendEvent(json);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- WACY Security Access (wavy-home.vercel.app) ---");

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
    Serial.print("Target Server: ");
    Serial.println(VERCEL_SERVER_URL);
  } else {
    Serial.println("\n[WiFi Connection Timeout] Please check router status.");
  }
#endif
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
          // Send instant event to Vercel when OUT 1..5 is triggered
          sendDoorOpenEvent(i + 1, SENSOR_NAMES[i]);
        }
      }
    }
    lastPinState[i] = rawRead;
  }

  delay(10);
}
