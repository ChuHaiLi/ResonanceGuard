#include "wokwi-api.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "../../firmware/rg-motor.chip.c"

static uint64_t now;
static uint32_t pins[4];
static unsigned edges;
static pin_watch_config_t watch;
static timer_config_t timer;
uint64_t get_sim_nanos(void)
{
    return now;
}
pin_t pin_init(const char *name, uint32_t mode)
{
    (void)mode;
    return strcmp(name, "PWM") == 0 ? 1 : strcmp(name, "EN") == 0 ? 2 : 3;
}
uint32_t pin_read(pin_t pin)
{
    return pins[pin];
}
void pin_write(pin_t pin, uint32_t value)
{
    if (pin == 3 && value && !pins[pin])
    {
        ++edges;
    }
    pins[pin] = value;
}
void pin_watch(pin_t pin, pin_watch_config_t *config)
{
    (void)pin;
    watch = *config;
}
timer_t timer_init(timer_config_t *config)
{
    timer = *config;
    return 1;
}
void timer_start(timer_t id, uint32_t us, bool repeat)
{
    assert(id == 1 && us == 1000 && repeat);
}
static void run(unsigned milliseconds, double duty, bool enabled)
{
    pins[2] = enabled;
    for (unsigned i = 0; i < milliseconds; ++i)
    {
        if (duty > 0 && duty < 1)
        {
            pins[1] = HIGH;
            watch.pin_change(watch.user_data, 1, HIGH);
            now += (uint64_t)(duty * 1000000);
            pins[1] = LOW;
            watch.pin_change(watch.user_data, 1, LOW);
            now += 1000000 - (uint64_t)(duty * 1000000);
        }
        else
        {
            pins[1] = duty == 1;
            now += 1000000;
        }
        timer.callback(timer.user_data);
    }
}
int main(void)
{
    chip_init();
    chip_state_t *model = timer.user_data;
    run(3000, 0.05, true);
    assert(model->rpm == 0 && edges == 0);
    run(3000, 0.3, true);
    assert(model->rpm > 450 && model->rpm < 470);
    unsigned before = edges;
    run(1000, 0.3, true);
    assert(edges - before >= 7 && edges - before <= 9);
    run(3000, 0.6, true);
    assert(model->rpm > 1020 && model->rpm < 1040);
    before = edges;
    run(1000, 0.6, true);
    assert(edges - before >= 16 && edges - before <= 18);
    run(1, 0, false);
    assert(model->rpm > 0); // Coast-down is distinct from output OFF.
    run(3000, 0, false);
    assert(model->rpm == 0 && pins[3] == LOW);
    run(3000, 1, true);
    assert(model->rpm > 1790 && model->rpm <= 1800);
    free(model);
    puts("PASS: actual custom chip C model with stub API: dead band, PWM, RPM, PPR=1, EN, coast-down, steady HIGH/LOW");
}
