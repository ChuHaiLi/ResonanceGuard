#pragma once
#include <stddef.h>
#include <stdint.h>

// Repeat an identical application ACK once. MQTT PUBACK covers only the
// publisher-to-broker hop; it is not confirmation from the backend.
// This schedule never executes a motor command or modifies its lease.
struct AckDelivery
{
    uint8_t attempts = 0;
    uint32_t nextAt = 0;

    void reset(uint32_t now) { attempts = 0; nextAt = now; }
    bool ready(uint32_t now) const { return attempts < 2 && (int32_t)(now - nextAt) >= 0; }
    bool sent(uint32_t now)
    {
        ++attempts;
        // Allow the next 1-second web renew to arrive before repeating.
        nextAt = now + 750;
        return attempts >= 2;
    }
};

// ArduinoMqttClient.available() is remaining payload length, not buffered TCP bytes.
// A failed read must return to the caller instead of retrying forever on that length.
template <typename Stream, typename Text>
bool readMqttPayload(Stream &stream, Text &text, size_t limit)
{
    while (stream.available() > 0)
    {
        int value = stream.read();
        if (value < 0 || text.length() >= limit)
        {
            return false;
        }
        text += (char)value;
    }
    return true;
}

inline uint32_t mqttNamespaceHash(const char *prefix)
{
    uint32_t hash = 2166136261UL;
    while (*prefix)
    {
        hash = (hash ^ (uint8_t)*prefix++) * 16777619UL;
    }
    return hash;
}
