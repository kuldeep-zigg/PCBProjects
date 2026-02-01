# IR Light Curtain System (Two-PCB Design)

## Requirements

Design a dual-PCB IR light curtain system for detecting thin, fast-moving objects using scanned IR beams.

- PCB A: Logic + IR Receiver Board
  - Raspberry Pi Pico (RP2040)
  - 10x TSOP4838 IR receivers
  - Diode-OR bus for receiver outputs
  - 0–255 digital / PWM DATA_OUT signal
  - USB for power and debugging

- PCB B: IR Transmitter Board
  - 74HC595 shift register
  - 10x TSAL6400 IR LEDs
  - MOSFET drivers for each LED
  - Scanned beam control from PCB A
  - Optional USB for power

- Communication between boards:
  - +5V
  - GND
  - TX_DATA
  - TX_CLK
  - TX_LATCH

---

## Specifications

- Supply Voltage: 5V
- Logic Voltage: 3.3V (MCU I/O)
- IR Wavelength: 940 nm
- Carrier Frequency: 38 kHz
- Detection Range: 1–1.5 meters
- Output Signal: 0–255 PWM / Digital level
- IR LEDs per board: 10
- IR Receivers per board: 10

---

## Design Constraints

- Use only LCSC available components
- Prefer 0805 SMD passive components
- LED resistors minimum 0.5W rating
- Separate TX and RX boards for EMI control
- Ground plane on bottom layer
- Antenna keep-out zone for Pico W compatibility
- Decoupling capacitor on every IR receiver
- MOSFET driver per LED (no direct MCU drive)

---

## Global Net Labels

| Net Name   | Description |
|-----------|-------------|
| +5V       | Main power rail |
| GND       | Ground |
| 3V3       | MCU logic rail |
| TX_DATA  | Serial data to shift register |
| TX_CLK   | Shift clock |
| TX_LATCH | Latch control |
| RX_BUS   | OR’d receiver output |
| DATA_OUT | 0–255 output signal |

---

# PCB A — Logic + IR Receiver Board

## MCU

- Board: Raspberry Pi Pico (RP2040)
- Power:
  - VSYS → +5V
  - GND → GND
  - 3V3(OUT) → 3V3

## MCU GPIO Mapping

| GPIO | Net | Function |
|------|-----|----------|
| GP2  | TX_DATA | Shift register data |
| GP3  | TX_CLK | Shift clock |
| GP4  | TX_LATCH | Output latch |
| GP10 | RX_BUS | Receiver input |
| GP15 | DATA_PWM | PWM output (0–255) |

---

## IR Receiver Wiring (Repeat x10)

### TSOP4838 Pinout

| Pin | Name | Net |
|-----|------|-----|
| 1 | OUT | RXn_OUT |
| 2 | GND | GND |
| 3 | VCC | +5V |

### Electrical Connections

| From | To |
|------|----|
| PIN3 (VCC) | +5V |
| PIN2 (GND) | GND |
| PIN1 (OUT) | Diode Anode |

### Diode OR Network

| Component | Connection |
|-----------|------------|
| Diode Cathode | RX_BUS |
| RX_BUS | 10kΩ pull-up to 3V3 |
| RX_BUS | MCU GP10 |

### Decoupling (Per Receiver)

| Capacitor | Value | Connection |
|-----------|-------|------------|
| C1 | 100nF | +5V → GND |
| C2 | 4.7µF | +5V → GND |

---

## DATA Output Stage

| From | To |
|------|----|
| GP15 | 1kΩ Resistor |
| Resistor | DATA_OUT |
| DATA_OUT | 10µF Capacitor → GND |

---

## Board-to-Board Connector (J1)

| Pin | Net |
|-----|-----|
| 1 | +5V |
| 2 | GND |
| 3 | TX_DATA |
| 4 | TX_CLK |
| 5 | TX_LATCH |

---

# PCB B — IR Transmitter Board

## Shift Register (74HC595)

### Pin Mapping

| Pin | Name | Net |
|-----|------|-----|
| 16 | VCC | +5V |
| 8 | GND | GND |
| 14 | DS | TX_DATA |
| 11 | SHCP | TX_CLK |
| 12 | STCP | TX_LATCH |
| 13 | OE | GND |
| 10 | MR | +5V |
| 15 | Q0 | TX1_GATE |
| 1 | Q1 | TX2_GATE |
| 2 | Q2 | TX3_GATE |
| 3 | Q3 | TX4_GATE |
| 4 | Q4 | TX5_GATE |
| 5 | Q5 | TX6_GATE |
| 6 | Q6 | TX7_GATE |
| 7 | Q7 | TX8_GATE |

---

## MOSFET Driver Stage (Repeat x10)

### MOSFET Pinout (AO3400 / 2N7002)

| Pin | Name | Net |
|-----|------|-----|
| 1 | Gate | TXn_GATE |
| 2 | Source | GND |
| 3 | Drain | LEDn_CATHODE |

### Wiring

| From | To |
|------|----|
| 74HC595 Qn | 220Ω → MOSFET Gate |
| Gate | 10kΩ → GND |
| +5V | 56Ω → LED Anode |
| LED Cathode | MOSFET Drain |
| MOSFET Source | GND |

---

## LED Electrical Design

### Current Formula

