# VMC Main Board - Rev A
**Date:** 2026-02-01
**Revision:** Rev-A (Initial prototype)

## Requirements
- **Input Power:** 24V DC (from PSU)
- **MCU:** ESP32-WROOM-32 (Wi-Fi enabled)
- **Communication:** RS485 master (to tray boards)
- **Bus:** 16-wire daisy-chain to 6 tray boards
- **Sensors:**
  - Temperature sensor (I2C)
  - IR drop detection sensor
- **LED:** Status LED with PWM control
- **Expansion:** Footprints for MDB, I2C OLED, buzzer

## Constraints
- Must use pluggable terminal blocks for all field wiring
- 24V input must have reverse polarity protection
- ESP32 must have clean, well-decoupled 3.3V rail
- All motor power must be isolated from sensor/MCU ground
- Must include test points: VIN_24, 5V, 3V3, GND, RS485_A, RS485_B
- Boot/reset/program pads must be accessible

## Current Calculations
- ESP32 Wi-Fi active: ~250mA @ 3.3V
- RS485 transceiver: ~50mA @ 3.3V
- Sensors (BME280 + IR): ~10mA @ 3.3V
- LED (max PWM): ~20mA @ 3.3V
- Total 3.3V rail: ~350mA
- 5V rail (for LDO input): ~500mA
- 24V quiescent (no motors): ~100mA

## Risks & Unknowns
1. Motor noise coupling into ESP32 reset line
2. RS485 bus reliability over 6 tray daisy-chain
3. Thermal management of buck converter
4. Connector pinout confusion (need clear silkscreen)
5. Ground loop potential between tray boards

## Design Goals
- Pass first power-up test without smoke
- Survive reverse polarity on 24V input
- ESP32 must not reset during motor activity
- All connectors must be physically different to prevent wrong insertion
- Board must be large enough for clear labeling and test points

## Success Criteria
- [ ] Powers up with correct voltage rails
- [ ] ESP32 boots and connects to Wi-Fi
- [ ] RS485 communication verified with logic analyzer
- [ ] Sensors read valid data
- [ ] No resets during simulated motor noise
- [ ] All test points accessible with probe
- [ ] 30-minute thermal soak at full load passes
