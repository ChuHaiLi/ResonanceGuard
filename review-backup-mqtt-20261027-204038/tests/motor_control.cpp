#include <assert.h>
#include <stdio.h>
#include "../firmware/motor_control.h"
#include "../firmware/rpm_reader.h"

int main()
{
    MotorControl motor;
    assert(!motor.running && motor.duty == 0);
    auto send = [&](const char *id, const char *action, uint32_t now, bool boot = true,
                    bool stop = false, bool connected = true, float duty = 0.3f,
                    uint32_t lease = 4000, uint32_t deadline = 0)
    {
        return motor.command(id, action, boot, deadline ? deadline : now + 3000,
            duty, lease, now, stop, connected);
    };
    assert(strcmp(send("start", "start", 100), "command_accepted_wait_for_rpm") == 0);
    assert(motor.running && motor.duty == 0.3f);
    const uint32_t expiry = motor.leaseUntil;
    assert(strcmp(send("start", "start", 1000), "duplicate_no_effect") == 0);
    assert(motor.leaseUntil == expiry);
    send("pwm", "set_duty", 1000, true, false, true, 0.6f);
    assert(motor.duty == 0.6f);
    send("stop", "stop", 1100, false, true, false);
    assert(!motor.running && motor.duty == 0);
    send("renew-off", "renew", 1200);
    assert(!motor.running);
    send("held", "start", 1300, true, true);
    assert(!motor.running);
    send("wrong-boot", "start", 1400, false);
    assert(!motor.running);
    send("expired", "start", 1500, true, false, true, 0.3f, 4000, 1499);
    send("future", "start", 1500, true, false, true, 0.3f, 4000, 8000);
    send("invalid-duty", "start", 1600, true, false, true, NAN);
    send("invalid-lease", "start", 1600, true, false, true, 0.3f, 4001);
    assert(!motor.running);
    send("new-start", "start", 2000);
    motor.tick(2001, true, true);
    assert(!motor.running);
    send("local-renew", "renew", 2002);
    assert(!motor.running);
    send("again", "start", 3000);
    send("expiry-race", "renew", 7000);
    assert(!motor.running); // Renew at the deadline cannot revive a timed-out lease.
    motor.tick(8000, false, true);
    assert(!motor.running);
    send("network-start", "start", 9000);
    motor.tick(9001, false, false);
    motor.tick(9002, false, true);
    send("network-renew", "renew", 9003);
    assert(!motor.running);
    send("wrap-start", "start", 0xfffffff0U);
    assert(motor.running);
    motor.tick(100, false, true);
    assert(motor.running);
    motor.tick(3984, false, true);
    assert(!motor.running);
    RpmReader encoder;
    assert(isnan(encoder.rpm(0)));
    encoder.pulse(0);
    assert(isnan(encoder.rpm(0)));
    encoder.pulse(100000);
    assert(encoder.rpm(100000) == 600);
    assert(encoder.pulses == 2);
    assert(isnan(encoder.rpm(2100000)));
    encoder.pulse(2200000);
    assert(isnan(encoder.rpm(2200000))); // First pulse after a timeout is insufficient.
    encoder.pulse(2300000);
    assert(encoder.rpm(2300000) == 600);
    RpmReader wrap;
    wrap.pulse(0xffff0000U);
    wrap.pulse(0x000086a0U);
    assert(wrap.rpm(0x000086a0U) == 600);
    puts("PASS: boot OFF; START/PWM/STOP; duplicate; expiry; wrong boot; local STOP; disconnect; no auto restart; uint32 wrap");
    puts("PASS: actual RPM reader: two edges, PPR=1, 600 RPM, timeout, restart and micros wrap");
}
