# IR Light Curtain Reference Design

**System:** Dual-PCB IR Detection System  
**Application:** Object detection using scanned IR beams  
**Boards:** PCB A (Logic + RX), PCB B (TX)  
**Channels:** 10 (expandable to 16/32)

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                       PCB A                              │
│  ┌──────────────┐      ┌────────────────────────────┐   │
│  │ Raspberry Pi │──────│ 10× TSOP4838 Receivers     │   │
│  │ Pico         │      │ (Diode-OR Network)         │   │
│  │ (RP2040)     │      └────────────────────────────┘   │
│  │              │                                        │
│  │ GP2  ────────┼──TX_DATA──┐                          │
│  │ GP3  ────────┼──TX_CLK───┤                          │
│  │ GP4  ────────┼──TX_LATCH─┤                          │
│  │ GP10 ────────┼──RX_BUS    │                          │
│  │ GP15 ────────┼──DATA_OUT  │                          │
│  └──────────────┘            │                          │
└────────────────────────────┼─────────────────────────┘
                               │ Board-to-Board Cable
                               │ (5-pin: +5V, GND, DATA, CLK, LATCH)
                               ↓
┌──────────────────────────────────────────────────────────┐
│                       PCB B                               │
│  ┌─────────────┐       ┌───────────────────────────┐    │
│  │  74HC595    │───────│ 10× MOSFET Drivers        │    │
│  │  Shift Reg  │       │ 10× TSAL6400 IR LEDs      │    │
│  │             │       └───────────────────────────┘    │
│  │ Q0-Q7 ──────┼── TX1-TX8 (gate drive)                 │
│  │             │                                         │
│  └─────────────┘       ┌─ GP16, GP17 (direct drive)     │
│                        └─ TX9, TX10                      │
└──────────────────────────────────────────────────────────┘
```

---

## PCB A: LOGIC + IR RECEIVER BOARD

### Power Supply Design

#### Input Power
- **Source:** USB-C or Micro-USB on Pico
- **Voltage:** 5V
- **Current:** ~250mA typical
- **Connector:** Pico VSYS pin

#### Power Distribution
```
USB 5V ──→ VSYS (Pico Pin 39)
         ↓
         ├──→ Pico Internal 3.3V Regulator
         │    └──→ 3V3(OUT) (Pico Pin 36)
         │         └──→ Pull-ups, DATA_OUT stage
         │
         └──→ +5V Rail
              └──→ 10× TSOP4838 receivers
```

#### Decoupling
| Location | Capacitor | Value | Package | Notes |
|----------|-----------|-------|---------|-------|
| USB input | C_BULK | 10µF | 1206 | Near Pico VSYS |
| 3V3 output | C_3V3 | 10µF | 1206 | Near Pico 3V3 pin |
| Per TSOP4838 | C_RX_n | 100nF | 0805 | Within 10mm of VCC |
| Per TSOP4838 | C_RX_n_BULK | 4.7µF | 1206 | Near receiver |

---

### Microcontroller: Raspberry Pi Pico

#### Pinout
| Pico Pin | GPIO | Net | Function |
|----------|------|-----|----------|
| 39 | VSYS | +5V | Power input |
| 38 | GND | GND | Ground |
| 36 | 3V3(OUT) | 3V3 | Logic power out |
| 4 | GP2 | TX_DATA | Shift register data |
| 5 | GP3 | TX_CLK | Shift clock |
| 6 | GP4 | TX_LATCH | Output latch |
| 14 | GP10 | RX_BUS | Receiver bus input |
| 20 | GP15 | DATA_PWM | PWM output (0–255) |
| 21 | GP16 | TX9_GATE | Direct LED 9 drive |
| 22 | GP17 | TX10_GATE | Direct LED 10 drive |

#### Firmware Notes
```c
// RP2040 Configuration
- TX_DATA, TX_CLK, TX_LATCH: 3.3V push-pull outputs
- RX_BUS: 3.3V input with internal weak pull-down (external 10kΩ to 3V3)
- DATA_PWM: PWM output, RC filter to analog 0-3.3V
- TX9, TX10: GPIO outputs with 220Ω series resistors (if driving Board B MOSFETs)
```

---

### IR Receiver Array (10× TSOP4838)

#### Component: TSOP4838
- **Manufacturer:** Vishay
- **LCSC:** C15676
- **Description:** 38kHz IR receiver module
- **Package:** Through-hole (or SMD variant)

#### Electrical Specifications
| Parameter | Value | Notes |
|-----------|-------|-------|
| Supply Voltage | 2.5–5.5V | Use 5V |
| Supply Current | 0.4–1.5mA | Typical 0.6mA |
| Output Type | Open collector | Active LOW |
| Carrier Frequency | 38kHz | Matched to TSAL6400 |
| Wavelength | 940nm | IR wavelength |

#### Wiring Per Receiver (Repeat ×10)

**TSOP4838 Pinout:**
```
     ┌─────┐
 OUT │1   3│ VCC (+5V)
     │  2  │
 GND │  └──┘
```

**Connections:**
```
TSOP4838 Pin 3 (VCC) ──┬── C1 (100nF) ──┐
                       │                 │
                       ├── C2 (4.7µF) ───┤
                       │                 │
                       └─────────────────┴── GND
                       │
                       └────────────────── +5V


TSOP4838 Pin 2 (GND) ────────────────────── GND


TSOP4838 Pin 1 (OUT) ── D_RX_n (anode) ────→ Diode-OR network
```

---

### Diode-OR Network

#### Topology
```
RX1_OUT ──┤>├────┐
RX2_OUT ──┤>├────┤
RX3_OUT ──┤>├────┤
RX4_OUT ──┤>├────┼───── RX_BUS ──── R_PULLUP (10kΩ) ──── 3V3
RX5_OUT ──┤>├────┤               ↓
RX6_OUT ──┤>├────┤               └─── MCU GP10
RX7_OUT ──┤>├────┤
RX8_OUT ──┤>├────┤
RX9_OUT ──┤>├────┤
RX10_OUT ─┤>├────┘
```

#### Component: 1N4148 Diode
- **LCSC:** C81598 (or equivalent)
- **Package:** SOD-323 or SOD-123
- **VF:** ~0.7V @ 10mA
- **Function:** OR gate (any receiver active LOW pulls RX_BUS LOW)

#### Pull-up Resistor
- **Value:** 10kΩ
- **Package:** 0805
- **LCSC:** C17414
- **Function:** Pull RX_BUS HIGH when no IR detected

**Logic:**
- No IR detected → All TSOP outputs HIGH → RX_BUS HIGH (via pull-up)
- IR detected on any receiver → That TSOP outputs LOW → Diode conducts → RX_BUS LOW

---

### DATA_OUT Stage (PWM to Analog)

#### Purpose
Output 0–255 analog signal representing detection confidence

#### Circuit
```
MCU GP15 (PWM) ──── R_FILTER (1kΩ, 0805) ──┬─── DATA_OUT
                                            │
                                            C_FILTER (10µF, 1206)
                                            │
                                            GND
```

#### Component Values
| Component | Value | Package | LCSC | Notes |
|-----------|-------|---------|------|-------|
| R_FILTER | 1kΩ | 0805 | C17513 | RC time constant |
| C_FILTER | 10µF | 1206 | C19702 | Smooth PWM to DC |

#### Electrical Characteristics
- **Input:** 3.3V PWM, 0–100% duty cycle
- **Output:** 0–3.3V DC (proportional to PWM)
- **RC time constant:** 1kΩ × 10µF = 10ms
- **PWM frequency:** 1kHz recommended (>> 100Hz for smooth output)

---

### Board-to-Board Connector (J1)

#### Pinout
| Pin | Net | Direction | Notes |
|-----|-----|-----------|-------|
| 1 | +5V | OUT → Board B | Power supply |
| 2 | GND | Common | Ground reference |
| 3 | TX_DATA | OUT → Board B | Serial data |
| 4 | TX_CLK | OUT → Board B | Shift clock |
| 5 | TX_LATCH | OUT → Board B | Output latch |

#### Connector Type
- **Recommended:** 5-pin 0.1" header (2.54mm pitch)
- **Alternative:** JST-XH 5-pin
- **Cable:** Ribbon cable or individual wires, <30cm length

#### Signal Integrity
- **Voltage levels:** 3.3V CMOS (compatible with 5V 74HC595 VIH=3.5V @ VCC=5V)
- **Level shifting:** Not required if 74HC595 powered at 5V
- **Trace impedance:** Not critical for <30cm cable at <1MHz clock

---

## PCB B: IR TRANSMITTER BOARD

### Power Supply Design

#### Input Power Options
1. **From PCB A:** +5V via J1 Pin 1 (recommended)
2. **Independent USB:** Optional USB connector on Board B

#### Power Distribution
```
+5V (from J1 or USB) ──┬── C_BULK (10µF, 1206)
                       │
                       ├──→ 74HC595 VCC (Pin 16)
                       │
                       └──→ 10× LED current limiting resistors
                            └──→ TSAL6400 anodes
```

#### Current Budget
- **74HC595:** ~10mA
- **One IR LED active:** 100mA
- **Total (scanned mode):** ~110mA
- **Total (all LEDs on):** ~1A (requires external supply)

---

### Shift Register: 74HC595

#### Component
- **Part Number:** 74HC595
- **LCSC:** C5947 (SOIC-16) or C9676 (TSSOP-16)
- **Function:** 8-bit serial-to-parallel shift register
- **Operating Voltage:** 2-6V (5V nominal)

#### Pinout
| Pin | Name | Net | Function | Connection |
|-----|------|-----|----------|------------|
| 16 | VCC | +5V | Power | +5V rail |
| 8 | GND | GND | Ground | GND plane |
| 14 | DS | TX_DATA | Serial input | J1 Pin 3 |
| 11 | SHCP | TX_CLK | Shift clock | J1 Pin 4 |
| 12 | STCP | TX_LATCH | Storage latch | J1 Pin 5 |
| 13 | OE | GND | Output enable | Tied LOW (always enabled) |
| 10 | MR | +5V | Master reset | Tied HIGH (no reset) |
| 15 | Q0 | TX1_GATE | Output 0 | LED 1 gate drive |
| 1 | Q1 | TX2_GATE | Output 1 | LED 2 gate drive |
| 2 | Q2 | TX3_GATE | Output 2 | LED 3 gate drive |
| 3 | Q3 | TX4_GATE | Output 3 | LED 4 gate drive |
| 4 | Q4 | TX5_GATE | Output 4 | LED 5 gate drive |
| 5 | Q5 | TX6_GATE | Output 5 | LED 6 gate drive |
| 6 | Q6 | TX7_GATE | Output 6 | LED 7 gate drive |
| 7 | Q7 | TX8_GATE | Output 7 | LED 8 gate drive |
| 9 | Q7' | (NC) | Serial cascade | For 16/32 channel expansion |

#### Decoupling
- **C_SR:** 100nF ceramic, 0805, within 5mm of Pin 16

#### Operation
```c
// Scan sequence (one LED at a time)
1. Shift 8 bits: 0b00000001 (LED 1 ON, others OFF)
2. Pulse LATCH
3. Wait scan period (~1ms)
4. Shift 8 bits: 0b00000010 (LED 2 ON, others OFF)
5. Repeat...
```

---

### MOSFET Driver Stage (Repeat ×8 for shift register outputs)

#### Component: AO3400 N-Channel MOSFET
- **LCSC:** C20917
- **Package:** SOT-23
- **VDS:** 30V
- **ID:** 5.7A continuous
- **RDS(on):** 50mΩ @ VGS=4.5V
- **VGS(th):** 1.5–2.5V

#### Circuit (Per LED Channel)
```
74HC595 Qn ──── R_GATE (220Ω, 0805) ───┬──── MOSFET Gate (Pin 1)
                                        │
                                        R_PULLDOWN (10kΩ, 0805)
                                        │
                                        GND

+5V ──── R_LED (56Ω, 1206, 0.5W) ──── TSAL6400 Anode

TSAL6400 Cathode ──── MOSFET Drain (Pin 3)

MOSFET Source (Pin 2) ──── GND
```

#### Component Values
| Component | Value | Package | LCSC | Power | Notes |
|-----------|-------|---------|------|-------|-------|
| R_GATE | 220Ω | 0805 | C17914 | 1/8W | Gate series resistor |
| R_PULLDOWN | 10kΩ | 0805 | C17414 | 1/8W | Ensure MOSFET OFF |
| R_LED | 56Ω | 1206 | C4338 | 0.5W | Current limiting |
| Q_TX | AO3400 | SOT-23 | C20917 | N/A | N-channel MOSFET |

---

### IR LED: TSAL6400

#### Component Specifications
- **Part Number:** TSAL6400
- **LCSC:** C125887
- **Wavelength:** 940nm
- **Viewing Angle:** ±20°
- **Forward Voltage:** ~1.5V @ 100mA
- **Max Continuous Current:** 100mA
- **Max Peak Current:** 1A (pulsed)

#### Current Limiting Calculation
```
R_LED = (VCC - VF_LED) / I_LED
      = (5V - 1.5V) / 0.1A
      = 3.5V / 0.1A
      = 35Ω

Use 56Ω standard value (derates to ~62mA for margin)

Actual current:
I = (5V - 1.5V) / 56Ω = 62.5mA

Power dissipation:
P = I² × R = (0.0625)² × 56 = 0.22W

Use 0.5W resistor (1206 package)
```

#### Thermal Considerations
- **Duty cycle:** ~10% (scanned mode, one LED at a time)
- **Average current per LED:** 6.25mA
- **Thermal rise:** Negligible

---

### GPIO Direct Drive (LEDs 9-10)

If PCB A has additional GPIOs (GP16, GP17), can directly drive 2 more LEDs:

#### Circuit (Per LED)
```
MCU GPn (3.3V) ── R_GATE (220Ω) ──┬── MOSFET Gate
                                   │
                                   10kΩ
                                   │
                                   GND

Same MOSFET + LED circuit as shift register channels
```

---

### Board-to-Board Connector (J2)

Mating connector to PCB A J1:
- Same 5-pin pinout
- Can be male header if J1 is female, or vice versa

---

## COMPONENT LIBRARY (BOM PREVIEW)

### Active Components
| Component | Part Number | LCSC | Package | Qty (System) | Notes |
|-----------|-------------|------|---------|--------------|-------|
| Microcontroller | Raspberry Pi Pico | Module | Through-hole | 1 | Board A |
| IR Receiver | TSOP4838 | C15676 | TH or SMD | 10 | Board A |
| IR LED | TSAL6400 | C125887 | 5mm TH | 10 | Board B |
| Shift Register | 74HC595 | C5947 | SOIC-16 | 1 | Board B |
| MOSFET | AO3400 | C20917 | SOT-23 | 10 | Board B |
| Diode | 1N4148 | C81598 | SOD-323 | 10 | Board A (OR network) |

### Passive Components
| Type | Value | Package | LCSC | Qty | Application |
|------|-------|---------|------|-----|-------------|
| Resistor | 56Ω | 1206 (0.5W) | C4338 | 10 | LED current limiting |
| Resistor | 220Ω | 0805 | C17914 | 10 | MOSFET gate series |
| Resistor | 1kΩ | 0805 | C17513 | 1 | DATA_OUT filter |
| Resistor | 10kΩ | 0805 | C17414 | 11 | Pull-up/down |
| Capacitor | 100nF | 0805 | C49678 | 12 | Decoupling |
| Capacitor | 4.7µF | 1206 | C19666 | 10 | RX bulk decoupling |
| Capacitor | 10µF | 1206 | C19702 | 4 | Power bulk, filter |

---

## NET LIST

### Global Nets (Board A)
| Net Name | Description | Voltage Level |
|----------|-------------|---------------|
| +5V | Main power rail | 5V |
| GND | Ground | 0V |
| 3V3 | Logic rail (from Pico) | 3.3V |
| TX_DATA | Shift register data | 3.3V |
| TX_CLK | Shift clock | 3.3V |
| TX_LATCH | Latch control | 3.3V |
| RX_BUS | OR'd receiver output | 3.3V (pulled up) |
| DATA_OUT | Analog output 0-3.3V | 0-3.3V |

### Global Nets (Board B)
| Net Name | Description | Voltage Level |
|----------|-------------|---------------|
| +5V | Main power rail | 5V |
| GND | Ground | 0V |
| TX_DATA | Shift register data | 3.3V |
| TX_CLK | Shift clock | 3.3V |
| TX_LATCH | Latch control | 3.3V |
| TX1_GATE – TX8_GATE | MOSFET gate drives | 5V (shift register outputs) |

---

## MANUFACTURING NOTES

### PCB A Layout
- **Ground plane:** Bottom layer, continuous
- **Keep-out zone:** 5mm from board edge
- **Receiver spacing:** 10-15mm apart for 1-1.5m detection range
- **Connector placement:** Edge of board for easy cable routing

### PCB B Layout
- **Ground plane:** Bottom layer, continuous
- **LED spacing:** Match receiver spacing on Board A (10-15mm)
- **Power trace width:** 20 mil for +5V to LED resistors
- **Thermal vias:** 2-3 per MOSFET drain pad

### Assembly Notes
- **Pico:** Through-hole, hand solder
- **Connectors:** Through-hole, hand solder
- **TSOP4838:** May be TH or SMD depending on variant
- **TSAL6400:** Through-hole, ensure correct polarity (flat side = cathode)
- **All SMD:** Reflow or hand solder

---

## TESTING & VALIDATION

### Power-On Tests
1. **Visual:** No smoke, no hot components
2. **Voltage rails:**
   - +5V rail: 4.75–5.25V
   - 3V3 rail: 3.2–3.4V
3. **Current consumption:**
   - Idle (no IR): ~100-150mA
   - One LED active: ~200-250mA

### Functional Tests
1. **Shift register:** Serial data → verify all 8 outputs sequence
2. **IR transmission:** Point IR camera at LEDs, verify 940nm emission
3. **IR reception:** Block beam, verify RX_BUS goes LOW
4. **DATA_OUT:** Verify 0-3.3V output when beam blocked/unblocked

### Scan Test
```c
// Test firmware
for (int i = 0; i < 10; i++) {
  activateLED(i);         // Turn on LED i
  delay(10);              // Wait 10ms
  int rxValue = readRXBus();  // Read receiver bus
  printf("LED %d: RX = %d\n", i, rxValue);
  deactivateLED(i);
}
// Expected: RX_BUS LOW when corresponding LED aimed at receiver
```

---

## EXPANSION TO 16/32 CHANNELS

### 16 Channels
- **Board A:** 16× TSOP4838, 16× diodes, same RX_BUS
- **Board B:** 2× 74HC595 cascaded, 16× MOSFETs, 16× LEDs
- **Connector:** Same 5-pin (data lines shared)
- **Power:** ~300mA (one LED at a time)

### 32 Channels
- **Board A:** 32× TSOP4838, 32× diodes, same RX_BUS
- **Board B:** 4× 74HC595 cascaded, 32× MOSFETs, 32× LEDs
- **Connector:** Same 5-pin
- **Power:** ~400mA (one LED at a time), or external 5V supply for simultaneous

### Cascading 74HC595
```
U1 Q7' (Pin 9) ──→ U2 DS (Pin 14)
U2 Q7' (Pin 9) ──→ U3 DS (Pin 14)
U3 Q7' (Pin 9) ──→ U4 DS (Pin 14)

All share: CLK, LATCH, GND, +5V
```

---

**END OF REFERENCE DESIGN**
