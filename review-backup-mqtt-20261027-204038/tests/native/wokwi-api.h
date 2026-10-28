#pragma once
#include <stdint.h>
#include <stdbool.h>
// Test double for the documented Wokwi C API. This is not the simulator runtime.
typedef uint32_t pin_t;
typedef uint32_t timer_t;
enum { LOW, HIGH, INPUT, OUTPUT_LOW, BOTH };
typedef struct
{
    int edge;
    void (*pin_change)(void *, pin_t, uint32_t);
    void *user_data;
} pin_watch_config_t;
typedef struct
{
    void (*callback)(void *);
    void *user_data;
} timer_config_t;
uint64_t get_sim_nanos(void);
pin_t pin_init(const char *, uint32_t);
uint32_t pin_read(pin_t);
void pin_write(pin_t, uint32_t);
void pin_watch(pin_t, pin_watch_config_t *);
timer_t timer_init(timer_config_t *);
void timer_start(timer_t, uint32_t, bool);
