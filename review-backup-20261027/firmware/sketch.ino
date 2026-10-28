#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>
#include <esp_arduino_version.h>
#include "config.h"

// SIMULATION ONLY. Not approved for powering physical motors.
constexpr int PIN_TACH = 26;
constexpr int PIN_PWM = 25;
constexpr int PIN_EN = 33;
constexpr int PIN_RUN = 27;
constexpr int PIN_STOP = 19;
constexpr uint8_t IMU = 0x68;
WiFiClient transport;
MqttClient mqtt(transport);
String bootId;
String pendingAck;
String seen[32];
uint8_t seenNext = 0;
uint32_t seq = 0;
volatile uint32_t pulseUs = 0;
volatile uint32_t periodUs = 0;
volatile uint32_t pulseCount = 0;
portMUX_TYPE controlMux = portMUX_INITIALIZER_UNLOCKED;
bool running = false;
float duty = 0;
uint32_t leaseUntil = 0;
bool appliedRunning = false;
float appliedDuty = 0;

void IRAM_ATTR onPulse()
{
    uint32_t now = micros();
    if (pulseUs != 0)
    {
        periodUs = now - pulseUs;
    }
    pulseUs = now;
    ++pulseCount;
}

void writePwm(uint8_t value)
{
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWrite(PIN_PWM, value);
#else
    ledcWrite(0, value);
#endif
}

// Kept independent of blocking connect/publish calls in the Arduino loop.
void controlTask(void *)
{
    for (;;)
    {
        bool stopPressed = digitalRead(PIN_STOP) == LOW;
        portENTER_CRITICAL(&controlMux);
        if (stopPressed || (running && (int32_t)(millis() - leaseUntil) >= 0))
        {
            running = false;
            duty = 0;
        }
        bool on = running;
        float output = on ? duty : 0;
        portEXIT_CRITICAL(&controlMux);
        digitalWrite(PIN_EN, on ? HIGH : LOW);
        digitalWrite(PIN_RUN, on ? HIGH : LOW);
        writePwm((uint8_t)roundf(output * 255));
        portENTER_CRITICAL(&controlMux);
        appliedRunning = on;
        appliedDuty = output;
        portEXIT_CRITICAL(&controlMux);
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

bool writeRegister(uint8_t reg, uint8_t value)
{
    Wire.beginTransmission(IMU);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
}

bool readImu(float &ax, float &ay, float &az)
{
    Wire.beginTransmission(IMU);
    Wire.write(0x3B);
    if (Wire.endTransmission(false) != 0 || Wire.requestFrom((int)IMU, 6) != 6)
    {
        return false;
    }
    // Separate reads avoid unspecified operand evaluation order.
    int16_t values[3];
    for (int i = 0; i < 3; ++i)
    {
        uint8_t high = Wire.read();
        uint8_t low = Wire.read();
        values[i] = (int16_t)((uint16_t(high) << 8) | low);
    }
    ax = values[0] / 8192.0f * 9.80665f;
    ay = values[1] / 8192.0f * 9.80665f;
    az = values[2] / 8192.0f * 9.80665f;
    return true;
}

void envelope(JsonDocument &doc)
{
    doc["schema_version"] = 1;
    doc["device_id"] = "rg01";
    doc["source"] = "synthetic";
    doc["boot_id"] = bootId;
    doc["seq"] = seq++;
    doc["t_device_ms"] = millis();
}

bool publishDocument(const char *suffix, JsonDocument &doc)
{
    String body;
    serializeJson(doc, body);
    String topic = String(PREFIX) + "/" + suffix;
    // Explicit known byte length streams the payload without the 256-byte buffer.
    if (!mqtt.beginMessage(topic, (unsigned long)body.length(), false, 0))
    {
        return false;
    }
    size_t written = mqtt.write((const uint8_t *)body.c_str(), body.length());
    int result = mqtt.endMessage();
    return written == body.length() && result == 1;
}

void onMessage(int size)
{
    String topic = mqtt.messageTopic();
    bool retained = mqtt.messageRetain();
    String text;
    while (mqtt.available())
    {
        int value = mqtt.read();
        if (text.length() < 1024) text += (char)value;
    }
    if (size > 1024 || retained || topic != String(PREFIX) + "/cmd/motor") return;
    JsonDocument cmd;
    if (deserializeJson(cmd, text)) return;
    String id = cmd["command_id"] | "";
    String action = cmd["action"] | "";
    if (id.isEmpty() || id.length() > 64) return;
    bool accepted = false;
    String reason = "invalid_command";
    bool duplicate = false;
    for (const String &previous : seen)
    {
        if (previous == id) duplicate = true;
    }
    if (duplicate)
    {
        reason = "duplicate_no_effect";
    }
    else if (cmd["schema_version"].as<int>() == 1 &&
             String(cmd["device_id"] | "") == "rg01" &&
             String(cmd["source"] | "") == "synthetic")
    {
        seen[seenNext++ % 32] = id;
        if (action == "stop")
        {
            portENTER_CRITICAL(&controlMux);
            running = false;
            duty = 0;
            portEXIT_CRITICAL(&controlMux);
            accepted = true;
            reason = "stop_requested";
        }
        else if (String(cmd["boot_id"] | "") != bootId)
        {
            reason = "wrong_boot";
        }
        else if (cmd["not_after_device_ms"].isNull() ||
                 (int32_t)(cmd["not_after_device_ms"].as<uint32_t>() - millis()) <= 0 ||
                 (int32_t)(cmd["not_after_device_ms"].as<uint32_t>() - millis()) > 5000)
        {
            reason = "expired_or_invalid_deadline";
        }
        else if (digitalRead(PIN_STOP) == LOW)
        {
            reason = "local_stop_held";
        }
        else
        {
            float requested = cmd["duty"] | -1.0f;
            uint32_t lease = cmd["lease_ms"] | 0;
            portENTER_CRITICAL(&controlMux);
            if ((action == "start" || action == "renew" || action == "set_duty") &&
                isfinite(requested) && requested >= 0 && requested <= 0.8f &&
                lease >= 500 && lease <= 4000 && (action == "start" || running))
            {
                running = true;
                duty = requested;
                leaseUntil = millis() + lease;
                accepted = true;
                reason = "command_accepted_wait_for_rpm";
            }
            portEXIT_CRITICAL(&controlMux);
        }
    }
    JsonDocument ack;
    envelope(ack);
    ack["command_id"] = id;
    ack["accepted"] = accepted;
    ack["reason"] = reason;
    portENTER_CRITICAL(&controlMux);
    bool on = running;
    portEXIT_CRITICAL(&controlMux);
    ack["running"] = on;
    pendingAck = "";
    serializeJson(ack, pendingAck);
    Serial.printf("COMMAND %s: %s\n", action.c_str(), reason.c_str());
}

void setup()
{
    Serial.begin(115200);
    pinMode(PIN_EN, OUTPUT);
    pinMode(PIN_RUN, OUTPUT);
    pinMode(PIN_STOP, INPUT_PULLUP);
    pinMode(PIN_TACH, INPUT);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttach(PIN_PWM, 1000, 8);
#else
    ledcSetup(0, 1000, 8);
    ledcAttachPin(PIN_PWM, 0);
#endif
    digitalWrite(PIN_EN, LOW);
    writePwm(0);
    xTaskCreate(controlTask, "motor-control", 3072, nullptr, 2, nullptr);
    attachInterrupt(digitalPinToInterrupt(PIN_TACH), onPulse, RISING);
    Wire.begin(21, 22);
    bool ok = writeRegister(0x6B, 0);
    ok = writeRegister(0x1C, 0x08) && ok;
    bootId = String((uint32_t)esp_random(), HEX);
    mqtt.setId("rg-esp-" + bootId);
    mqtt.setCleanSession(true);
    mqtt.setConnectionTimeout(1000);
    mqtt.setKeepAliveInterval(10000);
    mqtt.onMessage(onMessage);
    Serial.println("03_IOT_INTEGRATION · WOKWI ONLY · source=synthetic");
    Serial.println(ok ? "IMU configuration OK" : "IMU configuration FAILED");
    Serial.println("Web owns START/PWM. Local red STOP remains active. Green button and pot are unused.");
    WiFi.begin("Wokwi-GUEST", "", 6);
}

void loop()
{
    static uint32_t lastConnect = 0;
    static uint32_t lastTelemetry = 0;
    if (!mqtt.connected())
    {
        portENTER_CRITICAL(&controlMux);
        running = false;
        duty = 0;
        portEXIT_CRITICAL(&controlMux);
        if (WiFi.status() == WL_CONNECTED && millis() - lastConnect >= 3000)
        {
            lastConnect = millis();
            if (mqtt.connect(BROKER, BROKER_PORT))
            {
                mqtt.subscribe(String(PREFIX) + "/cmd/motor", 1);
                Serial.println("MQTT connected");
            }
            else Serial.printf("MQTT failed: %d\n", mqtt.connectError());
        }
        delay(5);
        return;
    }
    mqtt.poll();
    if (!pendingAck.isEmpty())
    {
        JsonDocument ack;
        deserializeJson(ack, pendingAck);
        publishDocument("ack", ack);
        pendingAck = "";
    }
    if (millis() - lastTelemetry >= 250)
    {
        lastTelemetry = millis();
        JsonDocument state;
        envelope(state);
        portENTER_CRITICAL(&controlMux);
        bool on = appliedRunning;
        float output = appliedDuty;
        portEXIT_CRITICAL(&controlMux);
        state["running"] = on;
        state["duty"] = output;
        publishDocument("state", state);

        JsonDocument vibration;
        envelope(vibration);
        float ax, ay, az;
        bool ok = readImu(ax, ay, az);
        if (ok)
        {
            vibration["ax"] = ax;
            vibration["ay"] = ay;
            vibration["az"] = az;
        }
        else
        {
            vibration["ax"] = nullptr;
            vibration["ay"] = nullptr;
            vibration["az"] = nullptr;
        }
        vibration["unit"] = "m/s2";
        vibration["quality"] = ok ? "wokwi_i2c" : "imu_read_failed";
        publishDocument("telemetry/vibration", vibration);

        noInterrupts();
        uint32_t pulse = pulseUs;
        uint32_t period = periodUs;
        uint32_t count = pulseCount;
        interrupts();
        bool valid = pulse != 0 && period != 0 && micros() - pulse < 2000000UL;
        JsonDocument rpm;
        envelope(rpm);
        if (valid) rpm["rpm"] = 60000000.0 / period;
        else rpm["rpm"] = nullptr;
        rpm["ppr"] = 1;
        rpm["pulses"] = count;
        rpm["quality"] = valid ? "valid_model_pulses" : "no_recent_pulses";
        publishDocument("telemetry/rpm", rpm);
    }
    delay(1);
}
