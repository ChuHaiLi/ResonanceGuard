#pragma once
#include <stdint.h>
#include <math.h>

// PPR=1. Access under tachMux, including from the pulse ISR.
struct RpmReader
{
    uint32_t lastEdge = 0;
    uint32_t period = 0;
    uint32_t pulses = 0;
    bool haveEdge = false;

    void pulse(uint32_t now)
    {
        uint32_t elapsed = now - lastEdge;
        period = haveEdge && elapsed < 2000000UL ? elapsed : 0;
        lastEdge = now;
        haveEdge = true;
        ++pulses;
    }

    float rpm(uint32_t now) const
    {
        if (!haveEdge || period == 0 || now - lastEdge >= 2000000UL)
        {
            return NAN;
        }
        return 60000000.0f / period;
    }
};
