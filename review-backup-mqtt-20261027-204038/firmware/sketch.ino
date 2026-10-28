#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>
#include <esp_arduino_version.h>
#include "config.h"
#include "motor_control.h"
#include "rpm_reader.h"

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
String ackQueue[8];
uint8_t ackHead = 0;
uint8_t ackCount = 0;
uint32_t seq = 0;
RpmReader encoder;
portMUX_TYPE controlMux = portMUX_INITIALIZER_UNLOCKED;
MotorControl motor;
bool networkConnected = false;
bool appliedRunning = false;
float appliedDuty = 0;
uint32_t outputRevision = 0;
uint32_t outputChangedAt = 0;
portMUX_TYPE tachMux = portMUX_INITIALIZER_UNLOCKED;
bool imuConfigured = false;

void disconnectMotor()
{
    portENTER_CRITICAL(&controlMux);
    networkConnected = false;
    motor.stop();
    portEXIT_CRITICAL(&controlMux);
    ackCount = 0;
    mqtt.stop();
}

void IRAM_ATTR onPulse()
{
    uint32_t now = micros();
    portENTER_CRITICAL_ISR(&tachMux);
    encoder.pulse(now);
    portEXIT_CRITICAL_ISR(&tachMux);
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
        motor.tick(millis(), stopPressed, networkConnected);
        bool on = motor.running;
        float output = on ? motor.duty : 0;
        portEXIT_CRITICAL(&controlMux);
        digitalWrite(PIN_EN, on ? HIGH : LOW);
        digitalWrite(PIN_RUN, on ? HIGH : LOW);
        uint8_t pwm = (uint8_t)roundf(output * 255);
        writePwm(pwm);
        portENTER_CRITICAL(&controlMux);
        float quantized = pwm / 255.0f;
        if (appliedRunning != on || appliedDuty != quantized)
        {
            ++outputRevision;
            outputChangedAt = millis();
        }
        appliedRunning = on;
        appliedDuty = quantized;
        portEXIT_CRITICAL(&controlMux);
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void reportOutput()
{
    static uint32_t reported = 0;
    portENTER_CRITICAL(&controlMux);
    uint32_t revision = outputRevision;
    uint32_t changedAt = outputChangedAt;
    bool on = appliedRunning;
    uint8_t pwm = (uint8_t)roundf(appliedDuty * 255);
    portEXIT_CRITICAL(&controlMux);
    if (revision != reported)
    {
        // Logging stays outside the control task; a blocked Serial cannot delay OFF.
        Serial.printf("OUTPUT t_ms=%lu RUN=%d PWM=%u/255 source=synthetic\n",
            (unsigned long)changedAt, on, pwm);
        reported = revision;
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
        disconnectMotor();
        return false;
    }
    size_t written = mqtt.write((const uint8_t *)body.c_str(), body.length());
    if (written != body.length() || mqtt.endMessage() != 1)
    {
        disconnectMotor();
        return false;
    }
    return true;
}

void onMessage(int size)
{
    String topic = mqtt.messageTopic();
    bool retained = mqtt.messageRetain();
    String text;
    while (mqtt.available())
    {
        int value = mqtt.read();
        if (text.length() < 1024)
        {
            text += (char)value;
        }
    }
    if (size > 1024 || retained || topic != String(PREFIX) + "/cmd/motor")
    {
        return;
    }
    JsonDocument cmd;
    if (deserializeJson(cmd, text) || !cmd.is<JsonObject>())
    {
        return;
    }
    String id = cmd["command_id"] | "";
    String action = cmd["action"] | "";
    if (id.isEmpty() || id.length() > 64 || !cmd["command_id"].is<const char *>())
    {
        return;
    }
    bool accepted = false;
    String reason = "invalid_command";
    if (cmd["schema_version"].is<int>() && cmd["schema_version"].as<int>() == 1 &&
             String(cmd["device_id"] | "") == "rg01" &&
             String(cmd["source"] | "") == "synthetic" && cmd["action"].is<const char *>())
    {
        bool validNumbers = cmd["not_after_device_ms"].is<uint32_t>() &&
            cmd["lease_ms"].is<uint32_t>() && cmd["duty"].is<float>();
        if (action == "stop" || validNumbers)
        {
            bool held = digitalRead(PIN_STOP) == LOW;
            bool correctBoot = String(cmd["boot_id"] | "") == bootId;
            portENTER_CRITICAL(&controlMux);
            const char *result = motor.command(id.c_str(), action.c_str(), correctBoot,
                cmd["not_after_device_ms"] | 0U, cmd["duty"] | -1.0f, cmd["lease_ms"] | 0U,
                millis(), held, networkConnected);
            portEXIT_CRITICAL(&controlMux);
            reason = result;
            accepted = reason == "stop_requested" || reason == "command_accepted_wait_for_rpm";
        }
        else
        {
            reason = "invalid_numeric_fields";
        }
    }
    JsonDocument ack;
    envelope(ack);
    ack["command_id"] = id;
    ack["accepted"] = accepted;
    ack["reason"] = reason;
    portENTER_CRITICAL(&controlMux);
    bool on = motor.running;
    portEXIT_CRITICAL(&controlMux);
    ack["running"] = on;
    if (ackCount < 8)
    {
        String &slot = ackQueue[(ackHead + ackCount) % 8];
        slot = "";
        serializeJson(ack, slot);
        ++ackCount;
    }
    else
    {
        portENTER_CRITICAL(&controlMux);
        motor.stop();
        portEXIT_CRITICAL(&controlMux);
        Serial.println("ACK queue full: motor OFF");
    }
    Serial.printf("COMMAND action=%s id=%s boot=%s accepted=%d reason=%s source=synthetic\n",
        action.c_str(), id.c_str(), bootId.c_str(), accepted, reason.c_str());
}

void setup()
{
    Serial.begin(115200);
    pinMode(PIN_EN, OUTPUT);
    pinMode(PIN_RUN, OUTPUT);
    pinMode(PIN_STOP, INPUT_PULLUP);
    pinMode(PIN_TACH, INPUT);
    bool pwmReady = true;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    pwmReady = ledcAttach(PIN_PWM, 1000, 8);
#else
    pwmReady = ledcSetup(0, 1000, 8) > 0;
    ledcAttachPin(PIN_PWM, 0);
#endif
    digitalWrite(PIN_EN, LOW);
    writePwm(0);
    digitalWrite(PIN_RUN, LOW);
    if (!pwmReady || xTaskCreate(controlTask, "motor-control", 3072, nullptr, 2, nullptr) != pdPASS)
    {
        Serial.println("FATAL: PWM/control task unavailable. Outputs remain OFF.");
        while (true)
        {
            delay(1000);
        }
    }
    attachInterrupt(digitalPinToInterrupt(PIN_TACH), onPulse, RISING);
    Wire.begin(21, 22);
    Wire.setTimeOut(50);
    bool ok = writeRegister(0x6B, 0);
    ok = writeRegister(0x1C, 0x08) && ok;
    // Read back the scale before using 8192 LSB/g (±4g).
    Wire.beginTransmission(IMU);
    Wire.write(0x1C);
    ok = Wire.endTransmission(false) == 0 && Wire.requestFrom((int)IMU, 1) == 1 && ok;
    imuConfigured = ok && ((Wire.read() & 0x18) == 0x08);
    bootId = String((uint32_t)esp_random(), HEX);
    mqtt.setId("rg-esp-" + bootId);
    mqtt.setCleanSession(true);
    mqtt.setConnectionTimeout(1000);
    mqtt.setKeepAliveInterval(10000);
    mqtt.onMessage(onMessage);
    Serial.println("03_IOT_INTEGRATION · WOKWI ONLY · source=synthetic");
    Serial.printf("BOOT %s · outputs OFF · PWM 1000Hz/8bit · PPR=1\n", bootId.c_str());
    Serial.println(imuConfigured ? "IMU configuration OK" : "IMU configuration FAILED");
    Serial.println("Web owns START/PWM. Local red STOP remains active. Green button and pot are unused.");
    WiFi.begin("Wokwi-GUEST", "", 6);
}

void loop()
{
    reportOutput();
    static uint32_t lastConnect = 0;
    static uint32_t lastTelemetry = 0;
    bool connected = WiFi.status() == WL_CONNECTED && mqtt.connected();
    portENTER_CRITICAL(&controlMux);
    networkConnected = connected;
    if (!connected)
    {
        motor.stop();
    }
    portEXIT_CRITICAL(&controlMux);
    if (!connected)
    {
        if (WiFi.status() == WL_CONNECTED && millis() - lastConnect >= 3000)
        {
            lastConnect = millis();
            if (mqtt.connect(BROKER, BROKER_PORT))
            {
                mqtt.subscribe(String(PREFIX) + "/cmd/motor", 1);
                Serial.println("MQTT connected");
            }
            else
            {
                Serial.printf("MQTT failed: %d\n", mqtt.connectError());
            }
        }
        delay(5);
        return;
    }
    mqtt.poll();
    if (!mqtt.connected())
    {
        disconnectMotor();
        return;
    }
    while (ackCount > 0)
    {
        JsonDocument ack;
        deserializeJson(ack, ackQueue[ackHead]);
        if (!publishDocument("ack", ack))
        {
            return;
        }
        ackHead = (ackHead + 1) % 8;
        --ackCount;
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
        if (!publishDocument("state", state))
        {
            return;
        }

        JsonDocument vibration;
        envelope(vibration);
        float ax, ay, az;
        bool ok = imuConfigured && readImu(ax, ay, az);
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
        if (!publishDocument("telemetry/vibration", vibration))
        {
            return;
        }

        portENTER_CRITICAL(&tachMux);
        float speed = encoder.rpm(micros());
        uint32_t count = encoder.pulses;
        portEXIT_CRITICAL(&tachMux);
        bool valid = isfinite(speed);
        JsonDocument rpm;
        envelope(rpm);
        if (valid)
        {
            rpm["rpm"] = speed;
        }
        else
        {
            rpm["rpm"] = nullptr;
        }
        rpm["ppr"] = 1;
        rpm["pulses"] = count;
        rpm["quality"] = valid ? "valid_model_pulses" : "no_recent_pulses";
        publishDocument("telemetry/rpm", rpm);
    }
    delay(1);
}
