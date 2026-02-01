# VMC PCB Master Document
**Project:** Vending Machine Controller Platform
**Company:** Tiny Startup (5 units → 20-40 batch production)
**Last Updated:** 2026-02-01

---

## 🎯 Project Goals

1. Design reliable, serviceable VMC PCBs fast
2. Prioritize reliability > serviceability > debug speed > size > cost
3. Use only popular, easily procurable components
4. Maintain complete audit trail in markdown
5. Support 6 trays x 10 motors = 60 motors total

---

## 📐 Hardware Standards (MUST FOLLOW)

### Component Selection
- **Passives:** 0805 (rework-friendly, not 0402/0201)
- **ICs:** SOIC, TSSOP, SOT-23, SOT-223 (avoid QFN/BGA in early revisions)
- **Connectors:** Through-hole/pluggable terminal blocks for field wiring
- **Sourcing:** LCSC primary, DigiKey backup, Mouser last resort

### Design Rules
- **Decoupling:** 100nF ceramic cap near every IC power pin (<5mm)
- **Bulk caps:** 100-1000µF near motor power and PSU input
- **Ground:** Solid plane on bottom layer (2-layer board), star ground for mixed signals
- **Zones:** Separate dirty (motors, LEDs, switching) from clean (MCU, sensors)
- **Trace width:** 1mm for 24V/2A, 0.8mm for 5V/1A, 0.5mm for 3V3/500mA
- **Test points:** VIN, 5V, 3V3, GND, critical signals (all labeled)
- **Boot/Reset:** Always accessible without disassembly

### Safety & Protection
- **24V input:** Reverse polarity protection (P-MOSFET or Schottky)
- **Fuse/PTC:** On input power
- **TVS diodes:** On RS485 A/B lines, any long external cables
- **Flyback:** On all inductive loads (motors, relays, solenoids)

### Manufacturing
- **Silkscreen:** Label all connectors, polarities, test points, revision number
- **DFM:** Minimum 0.3mm trace/space (0.5mm preferred)
- **Mounting:** Holes for standoffs, clearance for enclosure
- **Alternate footprints:** DNP resistors for tuning (termination, bias, filters)

---

## 🔧 System Architecture

### Main Board
- **MCU:** ESP32-WROOM-32 (Wi-Fi + BT)
- **Power:** 24V input → Buck 5V → LDO 3.3V
- **Communication:** RS485 master (to tray boards)
- **Sensors:** I2C temperature, IR drop detection
- **Expansion:** MDB, SPI/I2C OLED, buzzer

### Tray Boards (x6)
- **Motors:** 10x DC motors per tray
- **Driver:** Motor driver ICs with flyback protection
- **Communication:** RS485 slave (receive commands from main board)
- **Power:** 24V from daisy-chain bus

### Bus System
- **16-wire cable:** Power (24V, GND), RS485 (A, B, GND), expansion
- **Topology:** Daisy-chain through 6 trays
- **Termination:** 120Ω at far end (configurable)

---

## 📋 Revision History

(Entries added automatically by vmc-pcb-copilot.js)


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 9 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 9 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 9 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 9 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 9 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 0 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 0 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.


---

## 📅 2026-02-01 - VMC Main Board - Rev A

### What Changed
- Generated automated design artifacts for VMC Main Board - Rev A
- Applied 0 learned VMC hardware rules
- Created Design Checklist, Mental Model, and BOM + Blocks
- Generated netlist specification for manual entry

### Design Standards Update
- **Confirmed:** Always use 100nF bypass caps near every IC power pin
- **Confirmed:** Separate dirty (motor/switching) from clean (MCU/sensor) zones
- **Confirmed:** Use pluggable terminal blocks for all field wiring
- **New:** Added explicit test point requirements (VIN_24, 5V, 3V3, GND, RS485_A/B)
- **New:** Added RC filter standard for analog sensor inputs (10kΩ + 100nF)

### Revision Log
| Revision | Date | Status | Changes |
|----------|------|--------|---------|
| Rev-A (Initial prototype) | 2026-02-01 | Design | Initial schematic and layout planning |

### Open Questions
1. Buck converter thermal performance under continuous 1A load?
2. RS485 bus length limit with 16-wire daisy-chain?
3. ESP32 antenna performance near metal enclosure?
4. Sensor false trigger threshold during motor switching?

### Next Actions
- [ ] Review Design Checklist with team
- [ ] Start schematic capture in EasyEDA Pro
- [ ] Order BOM components from LCSC/DigiKey
- [ ] Prepare breadboard prototype for power supply testing
- [ ] Schedule design review meeting

---

## 💡 Daily Improvement Note

**Today's Learning:**
Based on VMC hardware rules and field experience, today's improvement is:

**"Always design with 0Ω jumper pads for tuning parameters"**

Why?
- RS485 termination may or may not be needed (depends on cable length and bus topology)
- RS485 bias resistors may cause issues with some transceivers
- RC filter values on sensors may need adjustment based on noise environment
- Having DNP (Do Not Populate) footprints with 0Ω jumper options allows field tuning without board redesign

Implementation:
- Add 0Ω jumper footprints in parallel with termination/bias resistors
- Default populate: 0Ω jumper (bypass)
- If tuning needed: Remove 0Ω, install actual resistor value
- Document in silkscreen: "R_TERM (120Ω or 0Ω)"

This single practice has saved us from multiple board respins.

