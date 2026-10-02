/*
  Door Motion & Security Tracking System (5 Sensors)
  
  Sensor Placement Recommendation:
  - Sensor 1: Outside Door (ตรวจจับนอกห้อง)
  - Sensor 2: Outer Door Frame (ขอบประตูด้านนอก)
  - Sensor 3: Door Contact / Threshold (ตรงบานประตู/ธรณีประตู)
  - Sensor 4: Inner Door Frame (ขอบประตูด้านใน)
  - Sensor 5: Inside Room (ตรวจจับภายในห้อง)
  
  Features:
  - Debounced digital pin readings for 5 IR/PIR sensors
  - Direction detection (Entering vs Exiting room)
  - Output JSON via Serial at 115200 baud (Compatible with Node.js / React Dashboard)
  - Optional WiFi/HTTP POST for ESP32 / ESP8266 / Ethernet shield
*/

#include <Arduino.h>

// Sensor Pin Configuration (Adjust pins as needed for your board)
const int SENSOR_PINS[5] = {2, 3, 4, 5, 6};

// Pin Active State: LOW if Active-Low (IR Obstacle sensors usually output LOW on detection), 
// HIGH if Active-High (PIR motion sensors output HIGH on motion).
const int SENSOR_TRIGGER_STATE = LOW; 

// Names for each sensor location
const char* SENSOR_NAMES[5] = {
  "Outside Door (นอกประตู)",
  "Outer Frame (ขอบประตูนอก)",
  "Door Threshold (ธรณีประตู)",
  "Inner Frame (ขอบประตูใน)",
  "Inside Room (ในห้อง)"
};

// Debounce timing (ms)
const unsigned long DEBOUNCE_DELAY = 100;
const unsigned long PASSAGE_TIMEOUT = 3000; // max time window to track entry/exit sequence

// Sensor state tracking
int lastPinState[5] = {HIGH, HIGH, HIGH, HIGH, HIGH};
int currentSensorState[5] = {0, 0, 0, 0, 0};
unsigned long lastDebounceTime[5] = {0, 0, 0, 0, 0};

// Sequence tracking for Entry / Exit detection
int triggerSequence[5] = {0, 0, 0, 0, 0};
int sequenceCount = 0;
unsigned long firstSequenceTime = 0;

void sendJsonEvent(const char* eventType, int sensorId, const char* sensorName, int state) {
  unsigned long now = millis();
  Serial.print("{\"type\":\"");
  Serial.print(eventType);
  Serial.print("\",\"sensor_id\":");
  Serial.print(sensorId);
  Serial.print(",\"sensor_name\":\"");
  Serial.print(sensorName);
  Serial.print("\",\"state\":");
  Serial.print(state);
  Serial.print(",\"uptime_ms\":");
  Serial.print(now);
  Serial.println("}");
}

void sendPassageEvent(const char* direction) {
  unsigned long now = millis();
  Serial.print("{\"type\":\"passage_detected\",\"direction\":\"");
  Serial.print(direction);
  Serial.print("\",\"sequence_length\":");
  Serial.print(sequenceCount);
  Serial.print(",\"uptime_ms\":");
  Serial.print(now);
  Serial.println("}");
}

void evaluateSequence() {
  if (sequenceCount < 2) return;

  int first = triggerSequence[0];
  int last = triggerSequence[sequenceCount - 1];

  // Check if moving from outside (1 or 2) to inside (4 or 5) -> ENTRY
  if ((first == 1 || first == 2) && (last == 4 || last == 5)) {
    sendPassageEvent("ENTRY");
  } 
  // Check if moving from inside (4 or 5) to outside (1 or 2) -> EXIT
  else if ((first == 4 || first == 5) && (last == 1 || last == 2)) {
    sendPassageEvent("EXIT");
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Sensor Pins
  for (int i = 0; i < 5; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    lastPinState[i] = digitalRead(SENSOR_PINS[i]);
  }

  // System Startup Notification JSON
  Serial.println("{\"type\":\"system_status\",\"status\":\"READY\",\"sensors_count\":5,\"baud_rate\":115200}");
}

void loop() {
  unsigned long now = millis();

  // Reset passage sequence if timeout reached
  if (sequenceCount > 0 && (now - firstSequenceTime > PASSAGE_TIMEOUT)) {
    evaluateSequence();
    sequenceCount = 0;
  }

  // Read all 5 sensors
  for (int i = 0; i < 5; i++) {
    int rawRead = digitalRead(SENSOR_PINS[i]);

    if (rawRead != lastPinState[i]) {
      lastDebounceTime[i] = now;
    }

    if ((now - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
      int isTriggered = (rawRead == SENSOR_TRIGGER_STATE) ? 1 : 0;

      if (isTriggered != currentSensorState[i]) {
        currentSensorState[i] = isTriggered;

        // Broadcast Sensor State Change JSON over Serial
        sendJsonEvent("sensor_state", i + 1, SENSOR_NAMES[i], isTriggered);

        if (isTriggered == 1) {
          // Track sequence for direction calculation
          if (sequenceCount == 0) {
            firstSequenceTime = now;
          }
          if (sequenceCount < 5) {
            // Avoid duplicate consecutive sensor entries in sequence
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

  delay(10); // Small pause for stability
}
