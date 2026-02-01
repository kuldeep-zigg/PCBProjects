# Design Checklist - VMC Main Board - Rev A
**Generated:** 2026-02-01T23:36:51.846Z
**Board:** VMC Main Board - Rev A
**Revision:** Rev-A (Initial prototype)

---

## ✓ Schematic Design

### Power Supply
- [ ] 24V input reverse polarity protection (P-MOSFET or Schottky diode)
- [ ] Buck converter 24V→5V (min 1A capacity)
- [ ] LDO 5V→3.3V (min 500mA for ESP32 + sensors)
- [ ] Bulk capacitors near input: 100-1000µF electrolytic
- [ ] 100nF ceramic bypass capacitors near EVERY IC power pin
- [ ] Test points: VIN_24, 5V, 3V3, GND (all labeled)

### MCU (ESP32)
- [ ] ESP32-WROOM-32 module with antenna clearance
- [ ] Clean 3.3V rail (separate from motor/LED switching)
- [ ] EN (enable) pull-up resistor 10kΩ
- [ ] BOOT button (GPIO0 to GND) for programming
- [ ] RESET button (EN to GND)
- [ ] USB-to-serial chip (CP2102/CH340) with auto-reset circuit
- [ ] Decoupling: 10µF + 100nF near ESP32 VDD pin
- [ ] Boot/reset/program test pads accessible

### Communication (RS485)
- [ ] RS485 transceiver (MAX3485/SN65HVD75)
- [ ] 120Ω termination resistor (DNP footprint, 0Ω link option)
- [ ] 680Ω bias resistors (DNP footprints for A/B pull-up/down)
- [ ] TVS diodes on A/B lines for ESD protection
- [ ] Test points: RS485_A, RS485_B, GND
- [ ] Clear silkscreen labels on terminal block

### Sensors
- [ ] I2C temperature sensor (BME280/SHT31)
- [ ] I2C pull-ups: 4.7kΩ to 3.3V
- [ ] IR drop sensor with RC filter (10kΩ + 100nF)
- [ ] Sensor ground isolated from motor/LED switching ground

### LED & Indicators
- [ ] Status LED with current-limiting resistor (220Ω-1kΩ)
- [ ] PWM control from ESP32 GPIO
- [ ] LED current path NOT through sensor ground

### Connectors
- [ ] 24V input: 2-pin pluggable terminal block (5.08mm pitch)
- [ ] RS485 bus: 4-pin terminal block (A, B, GND, +5V optional)
- [ ] Sensor connector: JST-XH or similar (different from power)
- [ ] All connectors physically different OR clearly labeled
- [ ] Polarity markings on silkscreen (+/- symbols)

### Protection & Safety
- [ ] Fuse or PTC on 24V input
- [ ] TVS diode on 24V input (36V breakdown)
- [ ] Flyback diodes if any relay/solenoid loads
- [ ] Ground plane coverage >80%

---

## ✓ PCB Layout

### Layer Stack
- [ ] 2-layer board (4-layer if noise issues appear)
- [ ] Top: components + signal routing
- [ ] Bottom: solid ground plane (interrupted only for traces)

### Power Routing
- [ ] 24V traces: minimum 1mm width (2-3A capacity)
- [ ] 5V traces: minimum 0.8mm width
- [ ] 3V3 traces: minimum 0.5mm width
- [ ] Ground plane: full copper pour, stitching vias

### Dirty/Clean Separation
- [ ] Motor/LED power area physically separated from ESP32/sensors
- [ ] Buck converter placed near 24V input
- [ ] LDO placed between 5V and ESP32
- [ ] Sensors in quietest corner of board
- [ ] Star ground point or single-point ground strategy

### Component Placement
- [ ] Bypass capacitors <5mm from IC power pins
- [ ] Bulk capacitors near power input and buck output
- [ ] ESP32 antenna area: no ground plane for 5-10mm
- [ ] Test points along board edge or clearly accessible
- [ ] Connector placement: no two identical connectors adjacent

### Thermal Management
- [ ] Buck converter thermal relief if using exposed pad package
- [ ] Thermal vias under power devices
- [ ] Clearance for heat sinking if needed

---

## ✓ Design for Manufacturing (DFM)

- [ ] Minimum trace width: 0.2mm (0.3mm preferred)
- [ ] Minimum clearance: 0.2mm (0.3mm preferred)
- [ ] All parts available from LCSC/DigiKey/Mouser
- [ ] Prefer 0805 passives (not 0402/0201)
- [ ] No BGA or QFN in Rev-A (use SOIC/TSSOP)
- [ ] Silkscreen labels: all connectors, test points, polarities
- [ ] Board dimensions allow for mounting holes and clearance

---

## ✓ Design for Testing (DFT)

- [ ] Test points for all critical nets (VIN, 5V, 3V3, GND, RS485)
- [ ] Access to UART TX/RX for serial debugging
- [ ] Boot/reset pads accessible without disassembly
- [ ] LED visible without enclosure
- [ ] Jumpers/DNP for tuning (termination, bias, filters)

---

## ✓ Bring-Up Plan

### Pre-Power Checks
- [ ] Visual inspection: solder bridges, missing parts, polarity
- [ ] Continuity: VIN to GND (should be high resistance, >10kΩ)
- [ ] Continuity: 5V to GND (should be high resistance)
- [ ] Continuity: 3V3 to GND (should be high resistance)

### First Power-Up (Current-Limited Supply)
- [ ] Set current limit to 100mA
- [ ] Apply 24V, observe current draw
- [ ] Measure VIN_24 test point (should be 24V ±1V)
- [ ] Measure 5V test point (should be 5V ±0.25V)
- [ ] Measure 3V3 test point (should be 3.3V ±0.1V)
- [ ] If any rail incorrect, power off and debug

### MCU Boot Test
- [ ] Connect USB-to-serial
- [ ] Open serial monitor (115200 baud)
- [ ] Press RESET button
- [ ] Verify ESP32 boot messages appear
- [ ] Test Wi-Fi connection (connect to AP)

### Communication Test
- [ ] Connect logic analyzer to RS485_A, RS485_B
- [ ] Send test packet from ESP32
- [ ] Verify differential signal on bus
- [ ] Loop-back test (short A-B if possible, verify error detection)

### Sensor Test
- [ ] Read I2C temperature sensor (verify sane values)
- [ ] Trigger IR sensor manually (verify GPIO change)
- [ ] Run sensors while toggling LED PWM (check for false triggers)

### Stress Test (30-60 min)
- [ ] Full load: Wi-Fi active, LED PWM, sensors polling
- [ ] Monitor temperatures (touch-test ICs)
- [ ] Power cycle 10 times (verify consistent boot)
- [ ] Measure rail voltages under load (should not droop >5%)

### Pass Criteria
- [ ] All rails stable ±5% under load
- [ ] ESP32 boots reliably every power cycle
- [ ] No resets during simulated motor noise (can inject on 24V line)
- [ ] Sensors read valid data consistently
- [ ] No components exceed 70°C at room temperature

---

## ✓ Documentation

- [ ] Complete schematic PDF exported
- [ ] PCB layout PDF exported (top/bottom layers)
- [ ] BOM exported (CSV with manufacturer part numbers)
- [ ] Assembly drawing (component placement + polarities)
- [ ] Test report template created in /ai/testing_reports/

---

## Applied VMC Hardware Rules





---

**Next Actions:**
1. Review this checklist with team
2. Start schematic capture in EasyEDA Pro / KiCad
3. Follow layout guidelines for dirty/clean separation
4. Order components for BOM
5. Schedule bring-up testing session

