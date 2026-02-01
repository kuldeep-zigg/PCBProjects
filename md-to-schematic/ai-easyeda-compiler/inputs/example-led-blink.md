# ESP32 LED Blink Board

## Description

Design a simple PCB with ESP32-WROOM-32 that blinks an LED.

## Features

- ESP32-WROOM-32 microcontroller
- Single LED indicator
- USB power supply (5V)
- 3.3V voltage regulator (AMS1117-3.3)
- Reset button
- Boot button
- Status LED

## Components

- ESP32-WROOM-32 (main MCU)
- AMS1117-3.3 (voltage regulator)
- LED (status indicator)
- 330Ω resistor (LED current limiting)
- 10kΩ resistors (pull-up/pull-down)
- 10µF capacitors (power filtering)
- Micro USB connector (power input)

## GPIO Usage

- GPIO2: LED output
- GPIO0: Boot button (pull-up)
- EN: Reset button (pull-up)

## Power Requirements

- Input: 5V via USB
- MCU: 3.3V
- LED: 3.3V with 330Ω resistor

## Notes

- Keep design simple for testing
- Use standard 0805 passives
- Single-sided PCB preferred
