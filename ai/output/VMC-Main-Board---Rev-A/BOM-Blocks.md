# BOM + Blocks - VMC Main Board - Rev A
**Generated:** 2026-02-01T23:16:44.006Z

---

## Power Supply Block

### Buck Converter (24V → 5V)

**Primary Choice:**
| Part Number | Manufacturer | Package | Output | Efficiency | Price | Source |
|-------------|--------------|---------|--------|------------|-------|--------|
| LM2596S-5.0 | Texas Instruments | TO-263 | 5V @ 3A | ~85% | $2-3 | DigiKey, Mouser |

**Alternate:**
| Part Number | Manufacturer | Package | Output | Efficiency | Price | Source |
|-------------|--------------|---------|--------|------------|-------|--------|
| TPS54331DR | Texas Instruments | SOIC-8 | 5V @ 3A | ~90% | $3-4 | DigiKey, LCSC |

**Supporting Components:**
- Inductor: 100µH, 3A, shielded (e.g., Wurth 744773210)
- Input cap: 100µF/50V electrolytic
- Output cap: 220µF/16V electrolytic
- Feedback resistors: 10kΩ, 3.3kΩ (0805)
- Schottky diode: SS34 or integrated in IC

---

### LDO Regulator (5V → 3.3V)

**Primary Choice:**
| Part Number | Manufacturer | Package | Output | Dropout | Quiescent | Price | Source |
|-------------|--------------|---------|--------|---------|-----------|-------|--------|
| AMS1117-3.3 | Advanced Monolithic Systems | SOT-223 | 3.3V @ 1A | 1.3V | 5mA | $0.20 | LCSC, DigiKey |

**Alternate:**
| Part Number | Manufacturer | Package | Output | Dropout | Quiescent | Price | Source |
|-------------|--------------|---------|--------|---------|-----------|-------|--------|
| LD1117S33TR | STMicroelectronics | SOT-223 | 3.3V @ 800mA | 1.2V | 5mA | $0.30 | DigiKey, Mouser |

**Supporting Components:**
- Input cap: 10µF/16V ceramic (X7R, 0805)
- Output cap: 22µF/10V ceramic (X7R, 0805)

---

## MCU Block

### ESP32 Module

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| ESP32-WROOM-32 | Espressif | SMD Module | Wi-Fi, BT, 4MB Flash | $3-4 | LCSC, DigiKey |

**Alternate:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| ESP32-WROOM-32U | Espressif | SMD Module | Wi-Fi, BT, U.FL antenna | $4-5 | DigiKey, Mouser |

**Supporting Components:**
- Decoupling caps: 10µF + 100nF (X7R, 0805)
- EN pull-up: 10kΩ (0805)
- BOOT button: Tactile switch (6x6mm)
- RESET button: Tactile switch (6x6mm)
- Boot resistor: 10kΩ pull-up on GPIO0 (optional)

---

### USB-to-Serial (Programming)

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| CP2102-GMR | Silicon Labs | QFN-28 | USB UART, 3.3V/5V | $2 | DigiKey, LCSC |

**Alternate:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| CH340C | WCH | SOIC-16 | USB UART, 3.3V | $0.50 | LCSC, AliExpress |

**Supporting Components:**
- USB connector: Micro-USB or USB-C (through-hole)
- Decoupling cap: 100nF (0805)
- Auto-reset circuit: 2x 10kΩ, 2x 100nF (0805)

---

## Communication Block

### RS485 Transceiver

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| MAX3485CSA+ | Maxim | SOIC-8 | Half-duplex, ±15kV ESD | $2 | DigiKey, Mouser |

**Alternate:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| SN65HVD75DR | Texas Instruments | SOIC-8 | Half-duplex, fail-safe | $1.50 | DigiKey, LCSC |

**Supporting Components:**
- Termination resistor: 120Ω (0805, DNP footprint)
- Bias resistors: 680Ω pull-up/down (0805, DNP footprints)
- TVS diodes: SMAJ36CA (bidirectional, 36V) for A/B lines
- Decoupling cap: 100nF (0805)

---

## Sensor Block

### Temperature & Humidity Sensor (I2C)

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| BME280 | Bosch | LGA-8 | T, RH, P, I2C/SPI | $5 | DigiKey, Adafruit module |

**Alternate:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| SHT31-DIS-B | Sensirion | DFN-8 | T, RH, I2C | $4 | DigiKey, Mouser |

**Supporting Components:**
- I2C pull-ups: 4.7kΩ (0805) on SDA/SCL to 3.3V
- Decoupling cap: 100nF (0805)

---

### IR Drop Detection Sensor

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| TCRT5000 | Vishay | Through-hole | Reflective, analog | $1 | DigiKey, LCSC |

**Alternate:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| ITR20001/T | Everlight | SMD | Reflective, analog | $0.50 | LCSC, Mouser |

**Supporting Components:**
- RC filter: 10kΩ + 100nF (0805) on analog input
- LED current resistor: 220Ω (0805)

---

## Protection & Passive Components

### Reverse Polarity Protection

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| IRLML6344 | Infineon | SOT-23 | P-MOSFET, -30V, -5A | $0.50 | DigiKey, Mouser |

**Alternate (simpler):**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| SS34 | Various | SMA | Schottky, 40V, 3A | $0.10 | LCSC, DigiKey |

---

### Fuse / PTC

**Primary Choice:**
| Part Number | Manufacturer | Package | Features | Price | Source |
|-------------|--------------|---------|----------|-------|--------|
| 0ZCJ0050FF2G | Bel Fuse | Radial | PTC, 0.5A hold, 1A trip | $0.50 | DigiKey |

---

### Bypass Capacitors (Standard Stock)

| Value | Voltage | Package | Quantity | Price (each) | Source |
|-------|---------|---------|----------|--------------|--------|
| 100nF | 50V | 0805 X7R | 20 | $0.05 | LCSC, DigiKey |
| 10µF | 16V | 0805 X7R | 10 | $0.10 | LCSC, DigiKey |
| 100µF | 50V | Electrolytic | 5 | $0.20 | LCSC, DigiKey |

---

### Resistors (Standard Stock)

| Value | Power | Package | Quantity | Price (each) | Source |
|-------|-------|---------|----------|--------------|--------|
| 10kΩ | 0.125W | 0805 | 20 | $0.01 | LCSC |
| 4.7kΩ | 0.125W | 0805 | 10 | $0.01 | LCSC |
| 220Ω | 0.125W | 0805 | 10 | $0.01 | LCSC |
| 680Ω | 0.125W | 0805 | 5 | $0.01 | LCSC |
| 120Ω | 0.125W | 0805 | 5 | $0.01 | LCSC |

---

## Connectors

### 24V Input Terminal Block

**Primary Choice:**
| Part Number | Manufacturer | Pitch | Pins | Wire Gauge | Price | Source |
|-------------|--------------|-------|------|------------|-------|--------|
| 691322110002 | Wurth | 5.08mm | 2 | 12-22 AWG | $0.50 | DigiKey, Mouser |

**Alternate:**
| Part Number | Manufacturer | Pitch | Pins | Wire Gauge | Price | Source |
|-------------|--------------|-------|------|------------|-------|--------|
| 282834-2 | TE Connectivity | 5.08mm | 2 | 12-24 AWG | $0.40 | DigiKey |

---

### RS485 Bus Terminal Block

**Primary Choice:**
| Part Number | Manufacturer | Pitch | Pins | Wire Gauge | Price | Source |
|-------------|--------------|-------|------|------------|-------|--------|
| 691322110004 | Wurth | 5.08mm | 4 | 12-22 AWG | $0.80 | DigiKey, Mouser |

---

### Sensor Connector (JST-XH or similar)

**Primary Choice:**
| Part Number | Manufacturer | Pitch | Pins | Features | Price | Source |
|-------------|--------------|-------|------|----------|-------|--------|
| B4B-XH-A | JST | 2.54mm | 4 | Keyed, locking | $0.20 | DigiKey, LCSC |

**Mating Connector:**
| Part Number | Manufacturer | Features | Price | Source |
|-------------|--------------|----------|-------|--------|
| XHP-4 | JST | Housing + crimp pins | $0.30 | DigiKey |

---

## Indicators

### Status LED

**Primary Choice:**
| Part Number | Manufacturer | Package | Color | Vf | Price | Source |
|-------------|--------------|---------|-------|----|----|--------|
| LTST-C170GKT | Lite-On | 0805 | Green | 2.2V | $0.10 | DigiKey, LCSC |

**Alternate:**
| Part Number | Manufacturer | Package | Color | Vf | Price | Source |
|-------------|--------------|---------|-------|----|----|--------|
| 19-217/GHC-YR1S2/3T | Everlight | 0805 | Green | 2.1V | $0.05 | LCSC |

---

## Total BOM Cost Estimate

| Block | Cost (USD) |
|-------|------------|
| Power Supply | $6 |
| MCU (ESP32 + USB) | $6 |
| RS485 Communication | $3 |
| Sensors | $6 |
| Passives (caps, resistors) | $3 |
| Connectors | $2 |
| Protection (fuse, diodes) | $2 |
| PCB (prototype, 5 boards) | $20 |
| **Total per board (batch of 5)** | **~$50** |

**Note:** Prices drop significantly at 20+ quantity. Expect <$30/board at volume.

---

## Component Knowledge Integration

### BME280
- Sources: N/A
- Knowledge available in: `knowledge-base/web-scraped/BME280_complete.json`

### ESP32-WROOM-32
- Sources: N/A
- Knowledge available in: `knowledge-base/web-scraped/ESP32-WROOM-32_complete.json`

### esp32
- Sources: allDataSheet, github, publicAPIs, webScrape
- Knowledge available in: `knowledge-base/web-scraped/esp32_complete.json`

### LM358
- Sources: N/A
- Knowledge available in: `knowledge-base/web-scraped/LM358_complete.json`

### MAX3232
- Sources: N/A
- Knowledge available in: `knowledge-base/web-scraped/MAX3232_complete.json`

---

## Sourcing Strategy

1. **Primary:** LCSC (low cost, integrated with JLCPCB assembly)
2. **Backup:** DigiKey (fast shipping, reliable stock)
3. **Last resort:** Mouser, Arrow, Newark

**Tip:** Always check stock levels before finalizing design. If a part is on backorder, use the alternate immediately.

---

## Next Steps

1. Cross-reference this BOM with schematic symbols in EasyEDA/KiCad library
2. Create alternates footprints for DNP components (termination, bias resistors)
3. Generate Octopart or FindChips BOM for multi-source pricing
4. Order samples of critical ICs (buck converter, LDO) for breadboard testing

