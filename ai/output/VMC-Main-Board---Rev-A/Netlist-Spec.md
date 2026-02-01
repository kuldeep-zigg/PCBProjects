# Netlist Specification - VMC Main Board - Rev A
**Generated:** 2026-02-01T23:16:44.006Z
**Format:** EasyEDA Pro / KiCad compatible

---

## Nets and Connections

### Power Nets
```
NET: VIN_24
  - J1.1 (24V Terminal Block, Pin 1)
  - F1.1 (Fuse/PTC, input)
  - D1.A (Reverse polarity protection, anode)
  - U1.VIN (Buck converter, input)

NET: GND
  - J1.2 (24V Terminal Block, Pin 2)
  - F1.2 (Fuse/PTC, return)
  - D1.C (Reverse polarity protection, cathode)
  - U1.GND (Buck converter, ground)
  - U2.GND (LDO, ground)
  - U3.GND (ESP32, ground pins)
  - U4.GND (RS485, ground)
  - U5.GND (BME280, ground)
  - C1.2, C2.2, C3.2... (all bypass cap grounds)
  - TP4 (Test point)

NET: +5V
  - U1.VOUT (Buck converter, output)
  - C2.1 (Bulk cap, 220µF)
  - U2.VIN (LDO, input)
  - U4.VCC (RS485, power)
  - J2.4 (RS485 terminal, optional 5V out)
  - TP2 (Test point)

NET: +3V3
  - U2.VOUT (LDO, output)
  - C3.1 (Bypass cap, 10µF)
  - U3.VDD (ESP32, power)
  - U5.VDD (BME280, power)
  - R1.1 (I2C pull-up, 4.7kΩ to SDA)
  - R2.1 (I2C pull-up, 4.7kΩ to SCL)
  - TP3 (Test point)
```

### Communication Nets
```
NET: RS485_A
  - U4.A (RS485 transceiver, A pin)
  - R10.1 (TVS diode, anode)
  - J2.1 (RS485 terminal, A)
  - TP5 (Test point)
  - R_TERM.1 (120Ω termination, DNP)

NET: RS485_B
  - U4.B (RS485 transceiver, B pin)
  - R11.1 (TVS diode, cathode)
  - J2.2 (RS485 terminal, B)
  - TP6 (Test point)
  - R_TERM.2 (120Ω termination, DNP)

NET: UART_TX
  - U3.GPIO1 (ESP32, TX pin)
  - U4.DI (RS485 transceiver, data input)
  - TP7 (Test point)

NET: UART_RX
  - U3.GPIO3 (ESP32, RX pin)
  - U4.RO (RS485 transceiver, receiver output)
  - TP8 (Test point)
```

### Sensor Nets (I2C)
```
NET: I2C_SDA
  - U3.GPIO21 (ESP32, SDA)
  - U5.SDA (BME280, data)
  - R1.2 (Pull-up resistor, 4.7kΩ)
  - J3.3 (Sensor connector, SDA)

NET: I2C_SCL
  - U3.GPIO22 (ESP32, SCL)
  - U5.SCL (BME280, clock)
  - R2.2 (Pull-up resistor, 4.7kΩ)
  - J3.4 (Sensor connector, SCL)
```

### Control Signals
```
NET: ESP32_EN
  - U3.EN (ESP32, enable pin)
  - R3.1 (Pull-up resistor, 10kΩ to +3V3)
  - SW1.1 (Reset button)
  - C10.1 (RC filter, 100nF to GND)

NET: ESP32_GPIO0
  - U3.GPIO0 (ESP32, boot pin)
  - SW2.1 (Boot button)
  - R4.1 (Pull-up resistor, 10kΩ to +3V3)

NET: LED_PWM
  - U3.GPIO2 (ESP32, PWM output)
  - R5.1 (Current limit resistor, 220Ω)
  - D2.A (Status LED, anode)
```

---

## Component List with Footprints

| Designator | Value | Footprint | Description |
|------------|-------|-----------|-------------|
| U1 | LM2596S-5.0 | TO-263-5 | Buck converter 24V→5V |
| U2 | AMS1117-3.3 | SOT-223-3 | LDO 5V→3.3V |
| U3 | ESP32-WROOM-32 | ESP32-WROOM-32 | MCU + Wi-Fi |
| U4 | MAX3485 | SOIC-8 | RS485 transceiver |
| U5 | BME280 | LGA-8 | Temp/humidity sensor |
| J1 | Terminal 2-pin | 5.08mm Pitch | 24V input |
| J2 | Terminal 4-pin | 5.08mm Pitch | RS485 bus |
| J3 | JST-XH 4-pin | 2.54mm Pitch | Sensor connector |
| C1 | 100µF | Radial 8x12mm | Input bulk cap |
| C2 | 220µF | Radial 8x12mm | 5V bulk cap |
| C3 | 10µF | 0805 | 3V3 decoupling |
| C4-C10 | 100nF | 0805 | Bypass caps |
| R1, R2 | 4.7kΩ | 0805 | I2C pull-ups |
| R3, R4 | 10kΩ | 0805 | ESP32 pull-ups |
| R5 | 220Ω | 0805 | LED current limit |
| R10, R11 | TVS diode | SMA | RS485 protection |
| R_TERM | 120Ω | 0805 | RS485 termination (DNP) |
| D1 | SS34 | SMA | Reverse polarity |
| D2 | LED Green | 0805 | Status indicator |
| SW1, SW2 | Tactile | 6x6mm | Reset/Boot buttons |
| F1 | PTC 0.5A | Radial | Input protection |
| TP1-TP8 | Test point | 1.5mm pad | Debug access |

---

## PCB Stackup

**2-Layer Board:**
- **Layer 1 (Top):** Components + signal routing
- **Layer 2 (Bottom):** Ground plane (solid copper pour)

**Copper weight:** 1 oz (35µm)
**Board thickness:** 1.6mm
**Minimum trace width:** 0.3mm (0.5mm preferred)
**Minimum clearance:** 0.3mm

---

## Next Steps for Manual Entry

### EasyEDA Pro:
1. Create new project: "VMC-MainBoard-RevA"
2. Add components from library (use part numbers from BOM)
3. Place components following mental model layout
4. Connect nets according to netlist above
5. Add copper pours: GND on bottom layer
6. Place test points along board edge
7. Add silkscreen labels for all connectors
8. Run DRC (Design Rule Check)
9. Export Gerbers + BOM + Pick-and-Place

### KiCad:
1. Create new project
2. Schematic editor: Place symbols, wire connections
3. Annotate components (U1, U2, R1...)
4. Assign footprints from libraries
5. Generate netlist
6. PCB editor: Import netlist
7. Place components, route traces
8. Add ground plane (fill zones)
9. Run DRC
10. Export Gerbers

---

**Estimated time for manual entry:** 4-6 hours for experienced user, 8-12 hours for beginner.

