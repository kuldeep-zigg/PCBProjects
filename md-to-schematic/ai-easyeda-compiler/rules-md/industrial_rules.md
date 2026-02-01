# Industrial Design Rules — IR Light Curtain System

**Document Version:** 1.0  
**Date:** 2026-02-01  
**System:** AI EasyEDA Compiler  
**Target:** Dual-PCB IR Detection System (Scalable to 16/32 Channels)

---

## 1. COMPONENT SELECTION STANDARDS

### 1.1 Passive Components

#### Resistors
- **Preferred Package:** 0805 SMD (1206 for power resistors >0.25W)
- **Tolerance:**
  - Signal paths (pull-ups, dividers): ±1%
  - LED current limiting: ±5%
  - Gate resistors: ±5%
- **Power Rating:**
  - General use: ≥0.125W (1/8W)
  - LED drive: ≥0.5W (use 1206 package)
  - Gate resistors: ≥0.125W
- **Temperature Coefficient:** ≤100ppm/°C
- **LCSC Priority:** Basic parts preferred

#### Capacitors
- **Decoupling (per IC):**
  - 0.1µF (100nF) ceramic X7R, 0805, within 5mm of VCC pin
  - 10µF ceramic X7R, 1206, shared per power rail
- **IR Receiver Decoupling (per TSOP4838):**
  - 100nF ceramic, 0805
  - 4.7µF ceramic, 1206
- **Bulk Filtering:**
  - Input: 22µF ceramic X7R, 1206
  - Output: 10µF ceramic X7R, 1206
- **Voltage Rating:** Minimum 2× operating voltage (16V for 5V rail)
- **Dielectric:** X7R or better (avoid Y5V)
- **LCSC Priority:** Basic parts preferred

#### Diodes
- **Signal (OR Network):**
  - Type: Fast switching diode (1N4148 or equivalent)
  - Package: SOD-323 or SOD-123
  - VF: ≤1.0V @ 10mA
  - Reverse voltage: ≥75V
- **Protection:**
  - TVS diodes on power input
  - Schottky diodes for reverse polarity protection

---

### 1.2 Active Components

#### Microcontrollers
- **Primary:** Raspberry Pi Pico (RP2040)
  - Industrial temperature range: -40°C to +85°C
  - LCSC part number: Module form factor
  - Must support USB debugging
  - 3.3V I/O with 5V tolerance where needed

#### Shift Registers
- **Primary:** 74HC595
  - Package: SOIC-16 or TSSOP-16
  - Operating voltage: 2-6V (5V nominal)
  - Output current: 35mA per pin (continuous)
  - Cascadable for 16/32 channel expansion
  - LCSC part number required

#### IR Components
- **Transmitters (TSAL6400):**
  - Wavelength: 940nm
  - Forward voltage: ~1.5V
  - Forward current: 100mA continuous, 1A peak
  - Viewing angle: ±20°
  - LCSC part number: C125887 or equivalent
  
- **Receivers (TSOP4838):**
  - Wavelength: 940nm
  - Carrier frequency: 38kHz
  - Supply voltage: 2.5V–5.5V
  - Output: Active LOW when IR detected
  - LCSC part number: C15676 or equivalent

#### MOSFETs
- **Primary:** AO3400 N-Channel
  - VDS: ≥30V
  - ID: ≥5A (continuous)
  - RDS(on): ≤50mΩ @ VGS=4.5V
  - VGS(th): 1.5V–2.5V
  - Package: SOT-23
  - LCSC part number: C20917
  
- **Alternative:** 2N7002
  - VDS: ≥60V
  - ID: ≥300mA
  - Lower performance but acceptable for LED switching

---

### 1.3 Voltage Regulation

#### LDO Regulators (if needed)
- Use for <500mA loads
- Minimum 20% current headroom
- Input TVS and reverse polarity protection mandatory
- Decoupling: 10µF input, 22µF output

#### Power Architecture
- **Primary Rail:** +5V from USB
- **Logic Rail:** 3.3V from Pico onboard regulator
- **Current Budget:**
  - Pico: ~100mA
  - 10× TSOP4838: 10mA
  - 10× TSAL6400 (one at a time): 100mA
  - Total: ~250mA (well within USB 500mA limit)

---

## 2. LAYOUT CONSTRAINTS

### 2.1 PCB Stack-Up
- **Layers:** 2-layer preferred (cost optimization)
- **Top Layer:** Components + signal routing
- **Bottom Layer:** Ground plane (>80% coverage)
- **Copper Weight:** 1oz (35µm)

### 2.2 Trace Width Guidelines
- **Power (+5V):** 20 mil minimum (0.5mm)
- **Ground:** Pour/plane
- **Signal (3.3V logic):** 10 mil (0.25mm)
- **High-speed (SPI, UART):** 10 mil, impedance controlled if >6 inches

### 2.3 Clearances
- **Trace-to-trace:** 10 mil (0.25mm)
- **Trace-to-pad:** 8 mil (0.2mm)
- **Pad-to-pad:** 10 mil (0.25mm)
- **Board edge keep-out:** 5mm minimum

### 2.4 Via Specifications
- **Signal vias:** 0.3mm drill, 0.6mm pad
- **Power vias:** 0.4mm drill, 0.8mm pad
- **Thermal vias:** Multiple 0.3mm under MOSFETs

---

## 3. EMI/ESD RULES

### 3.1 Grounding
- **Single-point star ground** for analog/digital separation (if applicable)
- **Ground plane** on bottom layer
- **Ground stitching vias** every 10mm around board perimeter
- **Keep ground path short** for high-frequency signals

### 3.2 Decoupling Strategy
- **Every IC:** 0.1µF within 5mm of VCC pin
- **Every IR receiver:** 100nF + 4.7µF within 10mm
- **Board input:** 10µF bulk capacitor at power entry
- **Placement:** Decoupling caps as close as physically possible

### 3.3 EMI Mitigation
- **IR LED drive:** Keep MOSFET switching traces short
- **Shift register outputs:** Series resistors (220Ω) to reduce ringing
- **External connectors:** ESD protection on data lines (optional but recommended)
- **38kHz PWM:** Keep traces short to avoid radiation

### 3.4 ESD Protection
- **External I/O:** TVS diodes on USB data lines (optional)
- **Board-to-board connector:** Robust GND connection (Pin 2)
- **Handling:** All exposed metal tied to GND or protected

---

## 4. POWER INTEGRITY RULES

### 4.1 Power Distribution
- **+5V Rail:**
  - USB input → Board A
  - Optional USB input → Board B
  - Board-to-board connector: Pin 1
  - Minimum trace width: 20 mil
  - Star topology from input connector

- **3.3V Rail:**
  - Generated by Pico onboard regulator
  - Do NOT export to Board B
  - Used for: Pico I/O, pull-ups, DATA_OUT

- **GND:**
  - Continuous plane on bottom layer
  - Multiple ground vias near every component
  - Board-to-board connector: Pin 2 (robust connection)

### 4.2 Current Budget
| Rail | Load | Current | Notes |
|------|------|---------|-------|
| +5V | Pico | 100mA | Typical |
| +5V | 10× TSOP4838 | 10mA | 1mA each |
| +5V | 1× TSAL6400 (active) | 100mA | Scanned, one at a time |
| +5V | 74HC595 | 10mA | Negligible |
| +5V | 10× MOSFET | <1mA | Gate drive only |
| **Total** | | **~250mA** | USB 500mA limit OK |

### 4.3 Protection
- **Reverse Polarity:** Schottky diode or MOSFET (optional for USB)
- **Overcurrent:** USB port self-protecting
- **TVS Diode:** Optional on +5V rail (recommended for industrial)

---

## 5. LCSC SOURCING POLICY

### 5.1 Component Priority
1. **Basic Parts** (green tag on LCSC)
   - Lowest assembly cost
   - Preferred for all passives
   - Faster lead time

2. **Extended Parts** (orange tag)
   - Use only if Basic not available
   - Flag in BOM with note
   - May increase assembly cost

3. **Alternates**
   - Provide 2-3 alternate LCSC part numbers
   - Verify footprint compatibility
   - Document in BOM notes

### 5.2 Stock Verification
- **Before finalizing design:** Check LCSC stock levels
- **Target:** >1000 units in stock for Basic parts
- **Obsolescence:** Verify active status, not NRND

### 5.3 Cost Optimization
- **Prefer 0805 passives** (cheaper than 0603)
- **Standard resistor values:** E12 series (10Ω, 22Ω, 47Ω, 100Ω, etc.)
- **Standard capacitor values:** 100nF, 1µF, 4.7µF, 10µF, 22µF
- **Bulk purchasing:** Consolidate similar values

---

## 6. EXPANDABILITY RULES (16/32 Channel Scalability)

### 6.1 Shift Register Cascading
- **Current Design:** 1× 74HC595 (8 outputs + 2 GPIO direct = 10 LEDs)
- **16 Channel:** 2× 74HC595 cascaded
- **32 Channel:** 4× 74HC595 cascaded

**Cascading Method:**
- Q7' (Pin 9) of U1 → DS (Pin 14) of U2
- Share CLK, LATCH, GND, +5V
- Each register adds 8 channels

### 6.2 Receiver Expansion
- **Current:** 10× TSOP4838 with diode-OR network
- **16 Channel:** 16× diodes to single RX_BUS
- **32 Channel:** 32× diodes to single RX_BUS
- **Pull-up scaling:** 10kΩ adequate for up to 32 diodes

### 6.3 Power Scaling
| Channels | IR LEDs Active | Current (5V) | Notes |
|----------|----------------|--------------|-------|
| 10 | 1 | ~250mA | USB OK |
| 16 | 1 | ~300mA | USB OK |
| 32 | 1 | ~400mA | USB OK (scanned mode) |
| 32 | 10 simultaneous | ~1.2A | **Requires external 5V supply** |

**Expansion Rule:** Keep scanned mode (one LED at a time) for USB power.

### 6.4 Modular PCB Design
- **Connector standardization:** Use consistent pinout
- **Board stacking:** Design for vertical or horizontal expansion
- **Address assignment:** Use shift register cascading (no addressing needed)

---

## 7. MANUFACTURING REQUIREMENTS

### 7.1 JLCPCB Standard
- **Minimum trace/space:** 6/6 mil (150µm) – use 10 mil for safety margin
- **Minimum drill:** 0.3mm (avoid smaller)
- **Solder mask:** Green standard (or customer choice)
- **Silkscreen:** White, component designators on top
- **Surface finish:** HASL or ENIG

### 7.2 Assembly Ready
- **SMT components:** Top side only (cost savings)
- **Through-hole:** Minimize (Pico, connectors only)
- **Fiducial marks:** 3× per board (1mm copper circles)
- **Tooling holes:** 2× minimum, 3mm diameter
- **Panel design:** V-score or tab routing

### 7.3 Testing Points
- **Essential nets:**
  - +5V: Test pad
  - GND: Test pad
  - TX_DATA, TX_CLK, TX_LATCH: Test pads
  - RX_BUS: Test pad
  - DATA_OUT: Test pad
- **Size:** 1mm diameter minimum
- **Location:** Accessible after assembly

---

## 8. DESIGN VALIDATION CHECKLIST

### 8.1 Schematic Review
- [ ] All ICs have decoupling capacitors
- [ ] All power nets properly labeled (+5V, 3V3, GND)
- [ ] All GPIO connections match pinout table
- [ ] Pull-ups/pull-downs on critical inputs
- [ ] LED current limiting resistors calculated correctly
- [ ] MOSFET gate resistors present (220Ω + 10kΩ pull-down)
- [ ] Shift register enable (OE) tied to GND
- [ ] Shift register reset (MR) tied to +5V

### 8.2 Layout Review
- [ ] Ground plane >80% coverage on bottom
- [ ] Decoupling caps within 5mm of IC VCC pins
- [ ] Power traces ≥20 mil
- [ ] Signal traces ≥10 mil
- [ ] No acute angles (use 45° corners)
- [ ] Board edge keep-out 5mm observed
- [ ] Mounting holes present (if needed)
- [ ] Connector placement accessible

### 8.3 BOM Review
- [ ] All LCSC part numbers verified
- [ ] Stock levels checked (>1000 units)
- [ ] Basic parts preferred
- [ ] Alternate parts documented
- [ ] Cost estimation complete
- [ ] Lead time acceptable

### 8.4 Design Rule Check (DRC)
- [ ] EasyEDA DRC passed
- [ ] No clearance violations
- [ ] No unconnected nets
- [ ] All footprints correct
- [ ] Silkscreen no overlap with pads

---

## 9. THERMAL MANAGEMENT

### 9.1 MOSFET Thermal Design
- **AO3400 in SOT-23:** Adequate for 100mA LED drive (no heatsink)
- **Thermal vias:** 2-3× 0.3mm vias under MOSFET drain pad
- **Copper pour:** Connect drain to ground plane via thermal vias
- **Worst case:** 100mA × 1.5V × 0.05Ω = 7.5mW (negligible)

### 9.2 IR LED Thermal
- **TSAL6400 thermal resistance:** Junction to ambient
- **Duty cycle:** <5% (scanned mode) – no thermal issues
- **Continuous mode (future):** May require heatsinking or lower current

### 9.3 General Thermal
- **Ambient rating:** -40°C to +85°C (industrial)
- **Hotspot monitoring:** None required for this design
- **Ventilation:** Passive cooling adequate

---

## 10. RELIABILITY & LONGEVITY

### 10.1 Component Derating
- **Voltage:** Use 2× voltage rating for capacitors
- **Current:** Size MOSFETs for 2× expected current
- **Power:** Use 0.5W resistors for LED drive (actual ~0.4W)

### 10.2 Connector Reliability
- **Board-to-board:** Use shrouded headers or locking connectors
- **Mating cycles:** 100+ cycles for development, 10+ for production
- **Wire gauge:** 22-24 AWG for board-to-board power

### 10.3 Soldering
- **Reflow profile:** Follow JLCPCB standard
- **Hand soldering:** Pico, connectors only
- **Rework:** All SMT components reworkable with hot air

---

## 11. DOCUMENTATION REQUIREMENTS

### 11.1 Schematic
- **Title block:** Project name, revision, date, author
- **Net labels:** Global labels for inter-board signals
- **Component values:** All passives labeled
- **Notes:** Critical design decisions documented

### 11.2 BOM
- **Format:** Markdown table
- **Columns:** Designator, Component, Value, Package, Description, LCSC, Qty, Notes
- **Sorting:** By reference designator
- **Alternates:** Listed in notes column

### 11.3 Assembly Drawings
- **Top view:** Component placement
- **Bottom view:** If needed
- **Connector pinouts:** Clearly labeled
- **Polarity marks:** For LEDs, diodes

---

## 12. COST TARGETS

### 12.1 Component Cost (10 Units)
| Item | Qty | Est. Cost | Notes |
|------|-----|-----------|-------|
| Raspberry Pi Pico | 1 | $4.00 | Module |
| TSOP4838 | 10 | $3.00 | $0.30 each |
| TSAL6400 | 10 | $2.50 | $0.25 each |
| 74HC595 | 1 | $0.15 | Basic part |
| AO3400 MOSFET | 10 | $0.50 | $0.05 each |
| Passives (all) | - | $2.00 | Bulk |
| Connectors | 2 | $0.50 | Headers |
| **Total (2 boards)** | | **$12.65** | Per system |

### 12.2 PCB Cost (JLCPCB, 10 Units)
- **PCB fabrication:** $2 per board × 2 = $4
- **Assembly:** $8 per board × 2 = $16 (if using SMT service)
- **Shipping:** ~$20
- **Total:** ~$40 for 10 complete systems = **$4/system**

### 12.3 Total Cost per System
- **Components:** $12.65
- **PCB + Assembly:** $4.00
- **Total:** **~$17 per system** (qty 10)

---

## 13. REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-01 | AI EasyEDA Compiler | Initial release |

---

**END OF INDUSTRIAL DESIGN RULES**
