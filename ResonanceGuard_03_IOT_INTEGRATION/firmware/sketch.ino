#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <ArduinoMqttClient.h>
#include <ArduinoJson.h>
#include <esp_arduino_version.h>
#include "config.h"
#include "motor_control.h"
#include "rpm_reader.h"
#include "mqtt_support.h"

// SIMULATION ONLY. Not approved for powering physical motors.
constexpr int PIN_TACH = 26;
constexpr int PIN_PWM = 25;
constexpr int PIN_EN = 33;
constexpr int PIN_RUN = 27;
constexpr int PIN_STOP = 19;
constexpr uint8_t IMU = 0x68;
class DiagnosticWiFiClient : public WiFiClient
{
public:
    using WiFiClient::write;
    uint32_t pings = 0;
    uint32_t lastPingAt = 0;
    uint32_t lastReadAt = 0;
    using WiFiClient::read;
    int read() override
    {
        int value = WiFiClient::read();
        if (value >= 0)
        {
            lastReadAt = millis();
        }
        return value;
    }
    size_t write(const uint8_t *bytes, size_t count) override
    {
        size_t written = WiFiClient::write(bytes, count);
        if (count == 2 && bytes[0] == 0xc0 && bytes[1] == 0)
        {
            ++pings;
            lastPingAt = millis();
            Serial.printf("MQTT PINGREQ t_ms=%lu written=%u/2\n", (unsigned long)lastPingAt, (unsigned)written);
        }
        return written;
    }
};
DiagnosticWiFiClient transport;
MqttClient mqtt(transport);
String bootId;
String clientId;
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
const char *appliedReason = "boot";
char appliedCommandId[65] = {};
portMUX_TYPE tachMux = portMUX_INITIALIZER_UNLOCKED;
bool imuConfigured = false;

void disconnectMotor(const char *detail)
{
    portENTER_CRITICAL(&controlMux);
    networkConnected = false;
    motor.stop("mqtt_lost");
    portEXIT_CRITICAL(&controlMux);
    Serial.printf("MQTT DOWN t_ms=%lu detail=%s wifi=%d tcp=%d pings=%lu last_ping_ms=%lu rx_idle_device_ms=%lu pending_ack=%u\n",
        (unsigned long)millis(), detail, (int)WiFi.status(), (int)transport.connected(),
        (unsigned long)transport.pings, (unsigned long)transport.lastPingAt,
        (unsigned long)(millis() - transport.lastReadAt), ackCount);
    for (uint8_t i = 0; i < ackCount; ++i)
    {
        JsonDocument ack;
        deserializeJson(ack, ackQueue[(ackHead + i) % 8]);
        Serial.printf("ACK DROP id=%s reason=mqtt_disconnect_before_confirmed_publish\n", ack["command_id"] | "?");
    }
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
        const char *reason = on ? "command_accepted" : motor.stopReason;
        char id[65];
        memcpy(id, motor.lastCommandId, sizeof(id));
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
        appliedReason = reason;
        memcpy(appliedCommandId, id, sizeof(id));
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
    const char *reason = appliedReason;
    char id[65];
    memcpy(id, appliedCommandId, sizeof(id));
    portEXIT_CRITICAL(&controlMux);
    if (revision != reported)
    {
        // Logging stays outside the control task; a blocked Serial cannot delay OFF.
        Serial.printf("OUTPUT t_ms=%lu RUN=%d PWM=%u/255 reason=%s command_id=%s skipped=%lu source=synthetic\n",
            (unsigned long)changedAt, on, pwm, reason, id, (unsigned long)(revision - reported - 1));
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
    bool isAck = strcmp(suffix, "ack") == 0;
    uint8_t qos = isAck ? 1 : 0;
    uint32_t startedAt = millis();
    const char *id = doc["command_id"] | "-";
    if (isAck)
    {
        Serial.printf("ACK PUBLISH id=%s seq=%lu t_ms=%lu bytes=%u qos=1\n", id,
            (unsigned long)doc["seq"].as<uint32_t>(), (unsigned long)startedAt, (unsigned)body.length());
    }
    // Explicit known byte length streams the payload without the 256-byte buffer.
    if (!mqtt.beginMessage(topic, (unsigned long)body.length(), false, qos))
    {
        Serial.printf("PUBLISH FAIL kind=%s id=%s phase=begin\n", suffix, id);
        disconnectMotor("publish_begin_failed");
        return false;
    }
    size_t written = mqtt.write((const uint8_t *)body.c_str(), body.length());
    if (written != body.length())
    {
        Serial.printf("PUBLISH FAIL kind=%s id=%s phase=write written=%u/%u dt_device_ms=%lu\n",
            suffix, id, (unsigned)written, (unsigned)body.length(), (unsigned long)(millis() - startedAt));
        disconnectMotor("publish_short_write");
        return false;
    }
    int ended = mqtt.endMessage();
    if (ended != 1 || !mqtt.connected())
    {
        Serial.printf("PUBLISH FAIL kind=%s id=%s phase=end result=%d dt_device_ms=%lu\n",
            suffix, id, ended, (unsigned long)(millis() - startedAt));
        disconnectMotor("publish_end_failed_or_puback_timeout");
        return false;
    }
    if (isAck)
    {
        Serial.printf("ACK BROKER_CONFIRMED id=%s dt_device_ms=%lu (not backend/frontend confirmation)\n",
            id, (unsigned long)(millis() - startedAt));
    }
    return true;
}

void onMessage(int size)
{
    String topic = mqtt.messageTopic();
    bool retained = mqtt.messageRetain();
    String text;
    if (size <= 0 || size > 1024)
    {
        disconnectMotor("invalid_command_packet_size");
        return;
    }
    text.reserve(size);
    if (!readMqttPayload(mqtt, text, 1024) || text.length() != (size_t)size)
    {
        disconnectMotor("command_read_failed_or_truncated");
        return;
    }
    if (retained || topic != String(PREFIX) + "/cmd/motor")
    {
        Serial.println("COMMAND DROP reason=retained_or_wrong_topic");
        return;
    }
    JsonDocument cmd;
    if (deserializeJson(cmd, text) || !cmd.is<JsonObject>())
    {
        Serial.println("COMMAND DROP reason=invalid_json");
        return;
    }
    String id = cmd["command_id"] | "";
    String action = cmd["action"] | "";
    if (id.isEmpty() || id.length() > 64 || !cmd["command_id"].is<const char *>())
    {
        return;
    }
    bool accepted = false;
    uint32_t commandAt = millis();
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
            commandAt = millis();
            const char *result = motor.command(id.c_str(), action.c_str(), correctBoot,
                cmd["not_after_device_ms"] | 0U, cmd["duty"] | -1.0f, cmd["lease_ms"] | 0U,
                commandAt, held, networkConnected);
            portEXIT_CRITICAL(&controlMux);
            reason = result;
            accepted = reason == "stop_requested" || reason == "command_accepted_wait_for_rpm";
        }
        else
        {
            reason = "invalid_numeric_fields";
        }
    }
    portENTER_CRITICAL(&controlMux);
    uint32_t leaseDeadline = motor.leaseUntil;
    portEXIT_CRITICAL(&controlMux);
    Serial.printf("COMMAND t_ms=%lu action=%s id=%s boot=%s accepted=%d reason=%s lease_until=%lu deadline=%lu source=synthetic\n",
        (unsigned long)commandAt, action.c_str(), id.c_str(), bootId.c_str(), accepted, reason.c_str(),
        (unsigned long)leaseDeadline, (unsigned long)(cmd["not_after_device_ms"] | 0U));
    JsonDocument ack;
    envelope(ack);
    ack["command_id"] = id;
    ack["accepted"] = accepted;
    ack["reason"] = reason;
    ack["command_t_device_ms"] = commandAt;
    ack["lease_until_device_ms"] = leaseDeadline;
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
        Serial.printf("ACK QUEUED id=%s seq=%lu t_ms=%lu depth=%u\n", id.c_str(),
            (unsigned long)ack["seq"].as<uint32_t>(), (unsigned long)ack["t_device_ms"].as<uint32_t>(), ackCount);
    }
    else
    {
        portENTER_CRITICAL(&controlMux);
        motor.stop("ack_queue_full");
        portEXIT_CRITICAL(&controlMux);
        Serial.println("ACK queue full: motor OFF");
    }
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
    char nonce[17];
    snprintf(nonce, sizeof(nonce), "%08lx%08lx", (unsigned long)esp_random(), (unsigned long)esp_random());
    bootId = nonce;
    clientId = "rg-esp-" + String(mqttNamespaceHash(PREFIX), HEX) + "-" + bootId;
    mqtt.setId(clientId);
    mqtt.setCleanSession(true);
    mqtt.setConnectionTimeout(1000);
    mqtt.setKeepAliveInterval(10000);
    mqtt.onMessage(onMessage);
    Serial.println("03_IOT_INTEGRATION · WOKWI ONLY · source=synthetic");
    Serial.printf("BOOT %s client_id=%s · outputs OFF · PWM 1000Hz/8bit · PPR=1\n", bootId.c_str(), clientId.c_str());
    Serial.println(imuConfigured ? "IMU configuration OK" : "IMU configuration FAILED");
    Serial.println("Web owns START/PWM. Local red STOP remains active. Green button and pot are unused.");
    WiFi.begin("Wokwi-GUEST", "", 6);
}

void loop()
{
    reportOutput();
    static uint32_t lastConnect = 0;
    static uint32_t lastTelemetry = 0;
    static uint32_t attempts = 0;
    bool connected = WiFi.status() == WL_CONNECTED && mqtt.connected();
    portENTER_CRITICAL(&controlMux);
    bool wasConnected = networkConnected;
    networkConnected = connected;
    if (!connected)
    {
        motor.stop("mqtt_lost");
    }
    portEXIT_CRITICAL(&controlMux);
    if (wasConnected && !connected)
    {
        disconnectMotor("connection_check_failed");
    }
    if (!connected)
    {
        if (WiFi.status() == WL_CONNECTED && millis() - lastConnect >= 3000)
        {
            lastConnect = millis();
            Serial.printf("MQTT CONNECT t_ms=%lu attempt=%lu client_id=%s keepalive_ms=10000 timeout_ms=1000\n",
                (unsigned long)millis(), (unsigned long)++attempts, clientId.c_str());
            if (mqtt.connect(BROKER, BROKER_PORT))
            {
                int result = mqtt.subscribe(String(PREFIX) + "/cmd/motor", 1);
                Serial.printf("MQTT SUBACK result=%d granted_qos=%d dt_device_ms=%lu\n", result,
                    mqtt.subscribeQoS(), (unsigned long)(millis() - lastConnect));
                if (result != 1)
                {
                    disconnectMotor("subscribe_failed");
                }
                else
                {
                    Serial.printf("MQTT connected t_ms=%lu attempt=%lu client_id=%s\n",
                        (unsigned long)millis(), (unsigned long)attempts, clientId.c_str());
                }
            }
            else
            {
                Serial.printf("MQTT failed: %d\n", mqtt.connectError());
            }
        }
        delay(5);
        return;
    }
    uint32_t pollStartedAt = millis();
    mqtt.poll();
    if (millis() - pollStartedAt > 250)
    {
        Serial.printf("MQTT POLL SLOW dt_device_ms=%lu\n", (unsigned long)(millis() - pollStartedAt));
    }
    if (!mqtt.connected())
    {
        disconnectMotor("poll_disconnected_no_mqtt3_reason_code");
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
        const char *stopReason = appliedReason;
        char commandId[65];
        memcpy(commandId, appliedCommandId, sizeof(commandId));
        portEXIT_CRITICAL(&controlMux);
        state["running"] = on;
        state["duty"] = output;
        state["stop_reason"] = on ? "none" : stopReason;
        state["last_command_id"] = commandId;
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
