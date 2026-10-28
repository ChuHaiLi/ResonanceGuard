#pragma once
#include <stdint.h>
#include <string.h>
#include <math.h>

// Portable decision logic shared by ESP32 and native regression tests.
// Call only while holding controlMux on the ESP32.
struct MotorControl
{
    bool running = false;
    float duty = 0;
    uint32_t leaseUntil = 0;
    const char *stopReason = "boot";
    char lastCommandId[65] = {};
    char seen[32][65] = {};
    uint8_t seenNext = 0;

    void stop(const char *reason = "command_stop")
    {
        if (running)
        {
            stopReason = reason;
        }
        running = false;
        duty = 0;
    }

    void tick(uint32_t now, bool localStop, bool connected)
    {
        if (localStop)
        {
            stop("local_stop");
        }
        else if (!connected)
        {
            stop("mqtt_lost");
        }
        else if (running && (int32_t)(now - leaseUntil) >= 0)
        {
            stop("lease_expired");
        }
    }

    const char *command(const char *id, const char *action, bool correctBoot,
                        uint32_t deadline, float requested, uint32_t lease,
                        uint32_t now, bool localStop, bool connected)
    {
        for (const auto &previous : seen)
        {
            if (strcmp(previous, id) == 0)
            {
                return "duplicate_no_effect";
            }
        }
        strncpy(seen[seenNext++ % 32], id, 64);
        if (strcmp(action, "stop") == 0)
        {
            strncpy(lastCommandId, id, 64);
            stop("command_stop");
            return "stop_requested";
        }
        // Expiry wins over a renew arriving before the next control-task tick.
        tick(now, localStop, connected);
        if (!correctBoot)
        {
            return "wrong_boot";
        }
        if ((int32_t)(deadline - now) <= 0 || (int32_t)(deadline - now) > 5000)
        {
            return "expired_or_invalid_deadline";
        }
        if (localStop)
        {
            return "local_stop_held";
        }
        if (!connected)
        {
            return "mqtt_offline";
        }
        if ((strcmp(action, "start") != 0 && strcmp(action, "renew") != 0 && strcmp(action, "set_duty") != 0) ||
            !isfinite(requested) || requested < 0 || requested > 0.8f || lease < 500 || lease > 4000 ||
            (strcmp(action, "start") != 0 && !running))
        {
            return "invalid_command_or_motor_off";
        }
        running = true;
        strncpy(lastCommandId, id, 64);
        duty = requested;
        leaseUntil = now + lease;
        return "command_accepted_wait_for_rpm";
    }
};
