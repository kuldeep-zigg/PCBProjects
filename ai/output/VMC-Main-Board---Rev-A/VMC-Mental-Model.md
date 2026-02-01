# VMC Mental Model - VMC Main Board - Rev A
**Generated:** 2026-02-01T23:16:44.005Z

---

## Block Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VMC MAIN BOARD                             │
│                                                                     │
│  ┌──────────────┐          ┌──────────────┐      ┌──────────────┐ │
│  │   24V INPUT  │──────────│ BUCK 24V→5V  │──────│  LDO 5V→3.3V │ │
│  │  (Terminal)  │          │  (Switcher)  │      │   (Linear)   │ │
│  └──────┬───────┘          └──────┬───────┘      └──────┬───────┘ │
│         │                         │                     │         │
│         │ ┌───────────────────────┴─────────────────────┘         │
│         │ │                                                        │
│  [Fuse/PTC]                                                        │
│         │ │                                                        │
│         │ │              ┌─────────────────────┐                  │
│         │ └──────────────│   ESP32-WROOM-32   │                  │
│         │                │   (Wi-Fi + MCU)    │                  │
│         │                └──────┬──┬───┬───┬──┘                  │
│         │                       │  │   │   │                     │
│         │                    I2C│ PWM GPIO UART                  │
│         │                       │  │   │   │                     │
│    ┌────▼────┐            ┌────▼──▼───▼───▼──┐                  │
│    │  MOTOR  │            │    SENSORS       │                  │
│    │  POWER  │            │  - BME280 (I2C)  │                  │
│    │  RAIL   │            │  - IR Drop Det   │                  │
│    │ (Future)│            │  - Status LED    │                  │
│    └─────────┘            └──────────────────┘                  │
│         │                                                        │
│    ┌────▼────────┐                                              │
│    │  RS485 BUS  │──────────────────────────────────────────────┼──▶ To Tray Boards
│    │ (Master TX) │         (16-wire daisy-chain)                │     (6 trays)
│    └─────────────┘                                              │
│                                                                  │
│  DIRTY ZONE: Motor power, switching              CLEAN ZONE:   │
│  (left side of board)                             ESP32, sensors │
│                                                   (right side)   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Signal Flow

### Power Flow
1. **24V Input** → Fuse/PTC → Reverse polarity protection → Buck converter input
2. **Buck Converter** → 5V rail → Bulk cap (470µF) → LDO input + RS485 power
3. **LDO Regulator** → 3.3V rail → Bypass caps (100nF) → ESP32 + Sensors

**Power Tree:**
```
24V DC Input (from external PSU)
  └─▶ Buck Converter (e.g., LM2596, TPS54331)
       └─▶ 5V @ 1A
            ├─▶ LDO (e.g., AMS1117-3.3)
            │    └─▶ 3.3V @ 500mA
            │         ├─▶ ESP32 (250mA active)
            │         ├─▶ RS485 transceiver (50mA)
            │         ├─▶ BME280 sensor (5mA)
            │         └─▶ IR sensor (5mA)
            └─▶ RS485 5V supply (optional, if bus-powered)
```

### Data Flow
1. **ESP32** (Master) → UART → RS485 transceiver → Differential bus (A/B)
2. **RS485 Bus** → Daisy-chain to 6 tray boards (each with 10 motor drivers)
3. **Sensors** → I2C bus → ESP32 (temperature, drop detection)
4. **ESP32** → Wi-Fi → Cloud/Local server (telemetry, commands)

---

## Dirty/Clean Zone Strategy

### DIRTY ZONE (Left Side of Board)
**What goes here:**
- 24V input terminal block
- Buck converter (switching noise generator)
- Motor power rail (future expansion)
- RS485 terminal block (if near motor power)
- High-current traces (thick copper)

**Why separate:**
- Switching converters create high-frequency noise (100kHz-2MHz)
- Motor drivers (future) create voltage spikes and EMI
- Large di/dt currents cause ground bounce

**Protection:**
- Separate ground pour or star ground
- Ferrite bead between dirty and clean grounds (optional)
- Thick traces to minimize impedance

---

### CLEAN ZONE (Right Side of Board)
**What goes here:**
- ESP32 module (with antenna clearance)
- LDO regulator (low noise)
- Sensors (BME280, IR detector)
- I2C pull-up resistors
- Status LED (with current limit)

**Why separate:**
- ESP32 ADC and Wi-Fi are noise-sensitive
- I2C communication can glitch from ground bounce
- Sensors need stable reference voltage

**Protection:**
- Solid ground plane under this area
- 100nF bypass caps <5mm from every IC
- RC filters on analog sensor inputs (10kΩ + 100nF)

---

## Current Return Paths (Critical!)

**Bad Design (causes resets):**
```
Motor current ──────▶ GND plane ──────▶ ESP32 GND pin
                       ▲
                       │ (voltage drop from motor surge)
                       │
                     ESP32 sees "ground" bounce → brown-out reset!
```

**Good Design (star ground or split):**
```
Motor current ──────▶ Motor GND pour ──┐
                                        ├──▶ Single point GND (near PSU input)
ESP32 current ──────▶ Clean GND pour ──┘
```

**Rule:** Current flows in loops. High-current loops should not share copper with low-current loops.

---

## Trace Width Guidelines

| Net | Current (max) | Width (min) | Notes |
|-----|---------------|-------------|-------|
| 24V input | 2A | 1.0mm | From terminal to buck input |
| 5V rail | 1A | 0.8mm | Buck output to LDO + RS485 |
| 3V3 rail | 500mA | 0.5mm | LDO output to ESP32/sensors |
| Motor power (future) | 5A | 2.0mm | Heavy copper or multiple layers |
| Ground (all) | Max of above | 2.0mm+ | Solid pour preferred over traces |
| RS485 A/B | <10mA | 0.3mm | Differential pair, matched length |
| I2C (SDA/SCL) | <1mA | 0.3mm | Short traces, pull-ups near master |

**Tip:** Use [PCB trace width calculator](https://www.4pcb.com/trace-width-calculator.html) for 10°C rise at max current.

---

## Connector Pinouts (CRITICAL - No Mistakes Allowed)

### 24V Input Terminal Block (2-pin, 5.08mm)
```
Pin 1: +24V (RED wire)    ●─── Fuse ───▶ Buck input
Pin 2: GND  (BLACK wire)  ●────────────▶ Ground plane
```
**Silkscreen:** "24V IN  +24  GND" with + symbol

---

### RS485 Bus Terminal Block (4-pin, 5.08mm)
```
Pin 1: A  (Yellow/Green)  ●───▶ RS485_A (differential +)
Pin 2: B  (Blue/White)    ●───▶ RS485_B (differential -)
Pin 3: GND (Black)        ●───▶ Ground reference
Pin 4: +5V (Red) [opt]    ●───▶ 5V supply for remote boards
```
**Silkscreen:** "RS485  A  B  G  +5" with arrows showing data flow direction

---

### Sensor Connector (JST-XH 4-pin or similar)
```
Pin 1: +3.3V  ●───▶ Sensor power
Pin 2: GND    ●───▶ Sensor ground
Pin 3: SDA    ●───▶ I2C data
Pin 4: SCL    ●───▶ I2C clock
```
**Keyed connector** to prevent reverse insertion.

---

## Test Points (All Clearly Labeled)

Place these along board edge or in a 2.54mm grid for easy probing:
- **TP1:** VIN_24 (input voltage)
- **TP2:** 5V (buck output)
- **TP3:** 3V3 (LDO output)
- **TP4:** GND (clean ground reference)
- **TP5:** RS485_A (differential A)
- **TP6:** RS485_B (differential B)
- **TP7:** ESP32_TX (UART debug)
- **TP8:** ESP32_RX (UART debug)

**Bonus:** Add 0Ω jumper pads for:
- RS485 termination (120Ω resistor, DNP by default)
- RS485 bias resistors (680Ω pull-up/down, DNP by default)

---

## Top Risks (From VMC Hardware Experience)

1. **ESP32 resets during motor activity**
   - **Mitigation:** Separate grounds, bulk caps on 24V and 5V rails, RC filter on EN pin
   
2. **RS485 bus unreliable over long daisy-chain**
   - **Mitigation:** Proper termination, differential signaling, twisted pair cable
   
3. **Sensor false triggers from LED PWM**
   - **Mitigation:** Keep LED current path isolated, RC filter on sensor inputs
   
4. **Connector pinout confusion**
   - **Mitigation:** Use different connector families for different domains, clear silkscreen
   
5. **Thermal issues with buck converter**
   - **Mitigation:** Thermal vias, exposed pad soldering, heat sink if needed

---

## Next Actions

1. **Schematic capture:** Follow power tree and signal flow as documented
2. **Component selection:** See BOM + Blocks.md for exact parts
3. **Layout:** Follow dirty/clean zone placement strictly
4. **Review:** Walk through mental model with team before ordering boards

---

**Note:** This mental model should be treated as living documentation. Update it when you learn something new during bring-up or field deployment.
