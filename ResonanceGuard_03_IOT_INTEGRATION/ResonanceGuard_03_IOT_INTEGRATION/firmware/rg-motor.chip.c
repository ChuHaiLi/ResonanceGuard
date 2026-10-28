#include "wokwi-api.h"
#include <stdlib.h>
#include <stdbool.h>
#include <stdint.h>

// SIMPLIFIED MOTOR MODEL ONLY, not a TB6612FNG electrical model.
// PWM duty 0..100% -> steady 0..1800 RPM with a first-order lag.
// TACH output: one digital pulse per model shaft revolution.
// RPM has inertia: stopping EN does not instantly stop the virtual rotor.

typedef struct
{
  pin_t pwm;
  pin_t en;
  pin_t tach;
  timer_t update_timer;
  uint64_t last_rising_ns;
  uint64_t last_falling_ns;
  uint64_t last_edge_ns;
  double duty;
  double rpm;
  double turns;
} chip_state_t;

static void pwm_edge(void *user_data, pin_t pin, uint32_t value)
{
  (void)pin;
  chip_state_t *s = (chip_state_t *)user_data;
  uint64_t now = get_sim_nanos();
  s->last_edge_ns = now;
  if (value == HIGH)
  {
    if (s->last_rising_ns > 0)
    {
      uint64_t cycle = now - s->last_rising_ns;
      uint64_t high = s->last_falling_ns > s->last_rising_ns
        ? s->last_falling_ns - s->last_rising_ns : 0;
      if (cycle > 0 && high <= cycle)
      {
        s->duty = (double)high / (double)cycle;
      }
    }
    s->last_rising_ns = now;
  }
  else
  {
    s->last_falling_ns = now;
  }
}

static void update_motor(void *user_data)
{
  chip_state_t *s = (chip_state_t *)user_data;
  uint64_t now = get_sim_nanos();
  // Handles steady HIGH/LOW (100% and 0% duty) with no new PWM edges.
  if (now - s->last_edge_ns > 100000000ULL)
  {
    s->duty = pin_read(s->pwm) == HIGH ? 1.0 : 0.0;
  }
  double target = 0.0;
  if (pin_read(s->en) == HIGH && s->duty > 0.06)
  {
    target = (s->duty - 0.06) / 0.94 * 1800.0;
  }
  if (target < 0)
  {
    target = 0;
  }
  if (target > 1800)
  {
    target = 1800;
  }
  // tau about 180ms at 1ms time step. Toy inertia, not experimentally calibrated.
  s->rpm += (target - s->rpm) / 180.0;
  if (s->rpm < 0.5 && target == 0.0)
  {
    s->rpm = 0;
  }
  s->turns += s->rpm / 60000.0; // revolutions in 1 ms
  if (s->turns >= 1.0)
  {
    s->turns -= (uint32_t)s->turns;
  }
  pin_write(s->tach, (s->rpm >= 5.0 && s->turns < 0.1) ? HIGH : LOW);
}

void chip_init()
{
  chip_state_t *s = (chip_state_t *)calloc(1, sizeof(chip_state_t));
  s->pwm = pin_init("PWM", INPUT);
  s->en = pin_init("EN", INPUT);
  s->tach = pin_init("TACH", OUTPUT_LOW);
  pin_watch_config_t watch_config = {
    .edge = BOTH,
    .pin_change = pwm_edge,
    .user_data = s,
  };
  pin_watch(s->pwm, &watch_config);
  timer_config_t timer_config = {
    .callback = update_motor,
    .user_data = s,
  };
  s->update_timer = timer_init(&timer_config);
  timer_start(s->update_timer, 1000, true);
}
