#pragma once
#include <stddef.h>
#include <stdint.h>

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
