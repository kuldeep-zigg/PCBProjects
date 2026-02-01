# IR Light Curtain System — Formal Requirements Document

**Project:** Dual-PCB IR Light Curtain for Object Detection  
**Revision:** 1.0  
**Date:** 2026-02-01  
**Author:** AI EasyEDA Compiler  
**Status:** Design Phase

---

## 1. FUNCTIONAL REQUIREMENTS

### 1.1 Primary Function
Design a two-PCB system for detecting thin, fast-moving objects using scanned infrared (IR) beams with high temporal resolution.

### 1.2 Detection Method
- **Topology:** Linear array of 10 IR transmitter/receiver pairs
- **Scanning:** Sequential activation of IR LEDs (one at a time)
- **Detection:** Any receiver detecting IR indicates beam interruption
- **Output:** 0–255 digital/analog signal proportional to detection confidence

### 1.3 System Architecture
- **PCB A (Logic + Receiver Board):**
  - Raspberry Pi Pico (RP2040) microcontroller
  - 10× TSOP4838 IR receiver modules (38kHz carrier)
  - Diode-OR bus for receiver output aggregation
  - 0–255 PWM/analog DATA_OUT signal
  - USB for power and debugging
  
- **PCB B (Transmitter Board):**
  - 74HC595 8-bit shift register (for 8 LEDs)
  - 2× direct GPIO outputs (for LEDs 9-10)
  - 10× TSAL6400 IR LEDs (940nm wavelength)
  - 10× MOSFET drivers (AO3400) for LED switching
  - Scanned beam control from PCB A via 5-pin cable
  - Optional independent USB power

### 1.4 Inter-Board Communication
- **Physical:** 5-conductor cable (<30cm length)
- **Signals:**
  - +5V (power)
  - GND (common ground)
  - TX_DATA (serial data, 3.3V CMOS)
  - TX_CLK (shift clock, 3.3V CMOS)
  - TX_LATCH (output latch, 3.3V CMOS)

---

## 2. ELECTRICAL REQUIREMENTS

### 2.1 Power Supply
| Parameter | Value | Notes |
|-----------|-------|-------|
| Input Voltage | 5V ± 5% | USB powered |
| Input Current (typical) | 250mA | One LED active |
| Input Current (max) | 500mA | All LEDs on (future) |
| Logic Voltage (MCU) | 3.3V | From Pico internal regulator |
| Power Source | USB Type-C or Micro-USB | On Pico board |

### 2.2 IR Transmitter Specifications
| Parameter | Value | Component |
|-----------|-------|-----------|
| Wavelength | 940nm | TSAL6400 |
| Forward Current | 62.5mA per LED | Limited by 56Ω resistor |
| Forward Voltage | ~1.5V @ 62.5mA | Typical |
| Modulation | 38kHz carrier | PWM from MCU |
| Duty Cycle (scan) | ~10% | One LED at a time |
| Beam Angle | ±20° | Half-intensity angle |

### 2.3 IR Receiver Specifications
| Parameter | Value | Component |
|-----------|-------|-----------|
| Wavelength | 940nm | TSOP4838 |
| Carrier Frequency | 38kHz | Matched to TX |
| Supply Voltage | 5V | TSOP VCC |
| Supply Current | 0.6mA typical | Per receiver |
| Output Type | Open collector | Active LOW |
| Output Logic | HIGH = no IR, LOW = IR detected | Via diode-OR |

### 2.4 Detection Range
| Parameter | Value | Notes |
|-----------|-------|-------|
| Operating Distance | 1.0 – 1.5 meters | Between PCB A and B |
| Alignment Tolerance | ±5° | Mechanical mounting |
| Detection Resolution | 10-15mm | LED/RX spacing |

### 2.5 Output Signal (DATA_OUT)
| Parameter | Value | Notes |
|-----------|-------|-------|
| Type | Analog (PWM-filtered) | RC low-pass filter |
| Range | 0 – 3.3V | Proportional to detection |
| Resolution | 8-bit (0–255) | PWM duty cycle |
| Update Rate | 100Hz | 10ms per full scan |
| Load Impedance | >10kΩ | External ADC or comparator |

---

## 3. MECHANICAL REQUIREMENTS

### 3.1 PCB Dimensions
| Board | Target Size | Constraints |
|-------|-------------|-------------|
| PCB A | 100mm × 50mm | Fit 10 receivers + Pico |
| PCB B | 100mm × 50mm | Fit 10 LEDs + driver circuit |
| Thickness | 1.6mm | Standard FR4 |

### 3.2 Component Placement
- **Receiver Array (PCB A):** 10-15mm spacing, aligned to edge
- **Transmitter Array (PCB B):** Match RX spacing exactly
- **Alignment:** PCBs must be parallel, 1-1.5m apart
- **Mounting:** 4× M3 mounting holes per board (corner placement)

### 3.3 Connectors
- **Board-to-board:** 5-pin 0.1" header or JST-XH
- **USB (Pico):** Micro-USB or Type-C (depends on Pico variant)
- **DATA_OUT:** 3-pin header (GND, DATA_OUT, 3V3)

### 3.4 Enclosure Compatibility
- **PCB A:** Window or slots for IR receivers (if enclosed)
- **PCB B:** Window or slots for IR LEDs (if enclosed)
- **Cable routing:** Strain relief for 5-pin cable
- **Indicator LEDs:** Optional status LEDs on PCB A

---

## 4. ENVIRONMENTAL REQUIREMENTS

### 4.1 Operating Conditions
| Parameter | Value | Notes |
|-----------|-------|-------|
| Temperature | -40°C to +85°C | Industrial range (target) |
| Humidity | 20% – 80% RH | Non-condensing |
| Altitude | 0 – 2000m | Standard atmospheric |
| Ambient Light | Indoor/outdoor | IR filter in TSOP4838 rejects visible light |

### 4.2 Reliability
- **MTBF Target:** >50,000 hours
- **Operating Life:** 10 years (estimated)
- **Cycle Count:** 100+ board-to-board connector mating cycles

### 4.3 Emissions & Immunity
- **EMI Compliance:** FCC Part 15 Class B (target)
- **ESD Protection:** ±2kV contact, ±4kV air (IEC 61000-4-2)
- **EFT Immunity:** ±1kV (IEC 61000-4-4)

---

## 5. MANUFACTURING REQUIREMENTS

### 5.1 PCB Fabrication
- **Manufacturer:** JLCPCB (or equivalent)
- **Layers:** 2-layer (top + bottom with ground plane)
- **Copper Weight:** 1oz (35µm)
- **Surface Finish:** HASL or ENIG
- **Solder Mask:** Green (or customer choice)
- **Silkscreen:** White, component designators on top

### 5.2 Component Sourcing
- **Supplier:** LCSC.com (primary)
- **Priority:** Basic parts (green tag) for cost savings
- **Alternates:** Extended parts (orange tag) acceptable if needed
- **Availability:** Verify >1000 units in stock before ordering

### 5.3 Assembly
- **Method:** SMT assembly service (JLCPCB) + manual TH soldering
- **SMT Side:** Top only (cost savings)
- **Through-Hole:** Pico, connectors, TSOP4838, TSAL6400 (manual)
- **Testing:** Basic continuity and power-on test per board

### 5.4 BOM Documentation
- **Format:** Markdown table
- **Required Columns:** Designator, Component, Value, Package, Description, LCSC Part #, Qty, Notes
- **Alternates:** List 2-3 alternate part numbers where applicable
- **Cost Estimate:** Include unit cost and total BOM cost

---

## 6. FUTURE SCALABILITY REQUIREMENTS

### 6.1 Channel Expansion
- **Current Design:** 10 channels
- **Target Expansion:** 16 channels, 32 channels
- **Method:** Cascaded 74HC595 shift registers
- **Constraints:**
  - Power budget: Maintain <500mA for USB power (scanned mode)
  - PCB size: May increase proportionally
  - Cable: Same 5-pin interface (shift registers share CLK/LATCH)

### 6.2 Modular Architecture
- **Board Stacking:** Vertical or horizontal array of PCB pairs
- **Address Assignment:** No addressing needed (shift register cascade)
- **Software:** Single MCU controls all boards via shift register chain

### 6.3 Enhanced Features (Future)
- **Simultaneous LED Drive:** Requires external 5V power supply (>1A)
- **Wireless Communication:** Replace cable with wireless link (e.g., ESP-NOW)
- **Edge Detection:** Firmware algorithms for object size/speed
- **Display Interface:** OLED or LCD for status/diagnostics

---

## 7. SOFTWARE/FIRMWARE REQUIREMENTS

### 7.1 Firmware Platform
- **SDK:** Raspberry Pi Pico SDK (C/C++)
- **IDE:** VS Code with Pico extension, or Arduino IDE
- **Toolchain:** GCC ARM cross-compiler

### 7.2 Core Functionality
- **IR LED Scanning:**
  - Sequential activation via 74HC595
  - 38kHz PWM modulation per LED
  - 1ms dwell time per LED (10ms full scan = 100Hz update rate)
  
- **Receiver Monitoring:**
  - Poll RX_BUS (GP10) during each LED activation
  - Detect LOW = beam interrupted
  - Build detection map (10-bit array)

- **Output Generation:**
  - DATA_OUT (GP15): 8-bit PWM proportional to detection
  - Formula: PWM duty cycle = (detections / 10) × 255
  - RC filter smooths to analog 0-3.3V

### 7.3 Optional Features
- **USB Serial Debug:** Print detection map to terminal
- **Configuration:** Adjustable scan rate, LED current, detection threshold
- **Calibration:** Auto-calibration for ambient IR noise

---

## 8. TESTING & VALIDATION REQUIREMENTS

### 8.1 Power-On Self-Test (POST)
1. Verify +5V rail: 4.75–5.25V
2. Verify 3.3V rail: 3.2–3.4V
3. Check current consumption: <500mA

### 8.2 Functional Tests
1. **Shift Register:** Verify all 8 outputs sequence correctly
2. **IR Transmission:** IR camera confirms 940nm emission
3. **IR Reception:** Block beam → RX_BUS LOW
4. **DATA_OUT:** 0-3.3V output when beam blocked/unblocked
5. **Scan Rate:** Measure 100Hz update rate (10ms per scan)

### 8.3 Performance Tests
1. **Detection Range:** Verify 1.0–1.5m operation
2. **Alignment Tolerance:** Test ±5° misalignment
3. **Response Time:** Measure latency from object entry to DATA_OUT change
4. **Ambient Light Rejection:** Test under bright sunlight

### 8.4 Reliability Tests
1. **Thermal:** 24-hour burn-in at 50°C
2. **Vibration:** 10Hz–100Hz sweep, 1g amplitude
3. **Connector Cycling:** 100 mating cycles
4. **ESD:** ±2kV contact discharge on exposed metal

---

## 9. DOCUMENTATION DELIVERABLES

### 9.1 Hardware Documentation
- [ ] Schematic PDF (Board A + Board B)
- [ ] PCB Gerber files (fabrication)
- [ ] PCB assembly drawings (top view with designators)
- [ ] BOM (LCSC-ready, Markdown + CSV)
- [ ] EasyEDA JSON (schematic, importable)

### 9.2 Mechanical Documentation
- [ ] Mechanical drawing (board dimensions, mounting holes)
- [ ] 3D STEP model (if available)
- [ ] Enclosure requirements (if applicable)

### 9.3 Software Documentation
- [ ] Firmware source code (GitHub repository)
- [ ] Build instructions
- [ ] Flashing guide
- [ ] API documentation (if exposing interfaces)

### 9.4 User Documentation
- [ ] Quick start guide
- [ ] Assembly instructions
- [ ] Troubleshooting guide
- [ ] Safety warnings (IR eye safety, power supply)

---

## 10. COMPLIANCE & SAFETY

### 10.1 Electrical Safety
- **USB Power:** Follow USB 2.0 specification (5V, 500mA max)
- **Overcurrent Protection:** USB port self-limiting or external fuse
- **Reverse Polarity:** Optional Schottky diode on +5V input

### 10.2 IR Eye Safety
- **Wavelength:** 940nm (near-infrared, invisible to human eye)
- **Power Density:** <1mW/cm² at 10cm distance (Class 1 laser equivalent)
- **Exposure Limit:** Continuous exposure acceptable per IEC 60825-1
- **Warning Label:** "Do not stare into LED" (precautionary)

### 10.3 RoHS Compliance
- All components must be RoHS compliant (lead-free)
- Verify LCSC parts have RoHS certification

---

## 11. PROJECT CONSTRAINTS

### 11.1 Cost Constraints
- **Target BOM Cost:** <$15 per complete system (qty 10)
- **PCB Fabrication:** <$5 per system (2 boards)
- **Total Cost:** <$20 per system (excludes tooling, NRE)

### 11.2 Schedule Constraints
- **Design Phase:** 1 week
- **Prototyping:** 2 weeks (PCB fab + assembly)
- **Testing & Validation:** 1 week
- **Total Time to First Article:** 4 weeks

### 11.3 Technical Constraints
- **Must use LCSC components** (for JLCPCB assembly)
- **Prefer 0805 SMD passives** (cost/availability)
- **No BGA or fine-pitch ICs** (assembly complexity)
- **Two-layer PCB only** (cost)

---

## 12. SUCCESS CRITERIA

### 12.1 Performance Metrics
- [ ] Detection range: 1.0–1.5m ± 10%
- [ ] Detection resolution: 10-15mm
- [ ] Scan rate: 100Hz ± 10%
- [ ] Output accuracy: DATA_OUT within ±5% of expected
- [ ] Power consumption: <500mA (USB compatible)

### 12.2 Reliability Metrics
- [ ] No component failures during 24-hour burn-in
- [ ] No false detections under bright ambient light
- [ ] 100+ connector mating cycles without mechanical failure

### 12.3 Manufacturing Metrics
- [ ] First-pass assembly yield: >90%
- [ ] DFM (Design for Manufacturing) approval from JLCPCB
- [ ] BOM cost within target ($15/system)
- [ ] Lead time <3 weeks for qty 10

---

## 13. RISK ASSESSMENT

### 13.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IR interference (ambient sunlight) | Medium | Medium | TSOP4838 has built-in daylight filter |
| Misalignment between PCBs | High | High | Mechanical alignment jig or brackets |
| Shift register clock glitches | Low | High | Good PCB layout, decoupling, short cable |
| MOSFET overheating | Low | Medium | Thermal vias, derating (62.5mA < 100mA max) |

### 13.2 Supply Chain Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LCSC part obsolescence | Low | High | List alternate parts in BOM |
| Long lead time for Pico | Medium | Medium | Order early, consider RP2040 bare chip |
| TSOP4838 out of stock | Low | Medium | Alternate: TSOP38238, TSOP4838 |

### 13.3 Project Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Design iteration required | High | Medium | Budget 2-3 PCB iterations |
| Firmware debugging delays | Medium | Medium | Modular firmware, unit tests |
| Mechanical enclosure mismatch | Medium | Low | 3D print prototype enclosure early |

---

## 14. APPROVAL & SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Lead | | | |
| Hardware Engineer | | | |
| Software Engineer | | | |
| Test Engineer | | | |
| Manufacturing Engineer | | | |

---

**END OF FORMAL REQUIREMENTS DOCUMENT**

**Next Steps:**
1. Generate detailed schematic (EasyEDA)
2. Create LCSC BOM with verified part numbers
3. Layout PCBs (Board A + Board B)
4. Submit for DFM review
5. Order prototype (qty 5-10)
6. Test and validate
7. Iterate as needed
