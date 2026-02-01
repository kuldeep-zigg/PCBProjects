# Common Resistor & Capacitor Reference Datasheet

Author: Kuldeep Malviya  
Use Case: Industrial VMC, Motor Control, Power Electronics, ESP32, ADC, EMI/ESD Protected Boards

This document lists **most-used, regularly-used, and rare/special-use resistors and capacitors** with **electrical purpose, package, tolerance, voltage rating, and typical use cases**. This is designed to act as a **personal datasheet + BOM reference** for schematic and PCB design.

---

# 1. Resistor Selection Reference

## 1.1 Most Commonly Used Resistors (90% of Designs)

| Value | Package | Power | Tolerance | Voltage Rating | Typical Use | Notes |
|---------|-------------|-----------|---------------|----------------------|-------------------|-----------|
| 10Ω | 0805 | 0.125W | 1% | 50V | MOSFET gate resistor, EMI damping | Controls switching speed |
| 100Ω | 0805 | 0.125W | 1% | 50V | Signal protection, LED current limit | Limits GPIO current |
| 330Ω | 0805 | 0.125W | 1% | 50V | LED series resistor | Most common LED value |
| 1kΩ | 0805 | 0.125W | 1% | 50V | Pull-ups, logic series | Noise protection |
| 4.7kΩ | 0805 | 0.125W | 1% | 50V | I2C pull-ups, LED | Industry standard |
| 10kΩ | 0805 | 0.125W | 1% | 50V | Pull-ups, pull-downs, EN pins | Default logic resistor |
| 47kΩ | 0805 | 0.125W | 1% | 50V | Bias networks | Low leakage |
| 100kΩ | 0805 | 0.125W | 1% | 50V | Gate pull-down, high-Z sensing | Low power draw |

---

## 1.2 Regularly Used (Analog + Power Designs)

| Value | Package | Power | Tolerance | Voltage Rating | Typical Use | Notes |
|---------|-------------|-----------|---------------|----------------------|-------------------|-----------|
| 0Ω | 0805 | 0.125W | — | 50V | Jumper, net isolate | Debug routing |
| 22Ω | 0805 | 0.125W | 1% | 50V | Signal damping | SPI, UART lines |
| 220Ω | 0805 | 0.125W | 1% | 50V | Protection resistor | ADC inputs |
| 2.2kΩ | 0805 | 0.125W | 1% | 50V | Pull-up networks | Low-speed buses |
| 33kΩ | 0805 | 0.125W | 1% | 50V | Feedback dividers | Buck regulators |
| 56kΩ | 0805 | 0.125W | 1% | 50V | ADC scaling | Voltage sensing |
| 200kΩ | 0805 | 0.125W | 1% | 50V | High-impedance bias | Low leakage systems |

---

## 1.3 Rare / Special Use Resistors

| Type | Value | Package | Power | Use Case | Notes |
|---------|-----------|-------------|-----------|------------------|-----------|
| Shunt | 0.01Ω–0.1Ω | 2512 | 1–3W | Current sensing | Kelvin routing needed |
| High Voltage | 1MΩ+ | 1206 | 0.25W | HV dividers | Use series chain |
| NTC | 10kΩ | 0805 | — | Temperature sensing | ADC input |
| PTC | 100Ω | 1206 | — | Resettable fuse | Signal protection |

---

# 2. Capacitor Selection Reference

## 2.1 Most Commonly Used Capacitors

| Value | Type | Package | Voltage | Tolerance | Typical Use | Notes |
|---------|--------|-------------|--------------|---------------|------------------|-----------|
| 100nF | MLCC X7R | 0805 | 50V | ±10% | Decoupling | Place near every IC |
| 1µF | MLCC X7R | 0805 | 25V | ±10% | Rail smoothing | Local supply buffer |
| 10µF | MLCC X7R | 0805 | 25V | ±20% | Bulk decoupling | Power rails |
| 47µF | Electrolytic | Radial/SMD | 35V | ±20% | Bulk input/output | Power entry |
| 100µF | Electrolytic | Radial/SMD | 35V | ±20% | Load buffering | Motors, relays |

---

## 2.2 Regularly Used (Power + EMI + Buck)

| Value | Type | Package | Voltage | Use Case | Notes |
|---------|--------|-------------|--------------|------------------|-----------|
| 4.7nF | MLCC X7R | 0805 | 100V | EMI suppression | Power entry |
| 10nF | MLCC X7R | 0805 | 100V | Noise filtering | ADC reference |
| 22µF | MLCC X7R | 1206 | 25V | Buck output | Low ESR |
| 330µF | Electrolytic | SMD | 16V | Buck output | Ripple smoothing |
| 1000µF | Electrolytic | Radial/SMD | 35V | Bulk storage | Motor loads |

---

## 2.3 Rare / Special Use Capacitors

| Type | Value | Voltage | Use Case | Notes |
|---------|-----------|--------------|------------------|-----------|
| Y-Cap | 1nF–4.7nF | 250VAC | EMI safety | Earth reference |
| Supercap | 0.1F–1F | 5.5V | Backup power | RTC, SRAM |
| Film | 100nF–1µF | 100V | Snubber | MOSFET protection |
| Tantalum | 10µF–100µF | 16V | Stable rails | Low ESR |

---

# 3. Voltage Rating Rule (Golden Rule)

| Circuit Voltage | Min Capacitor Rating |
|------------------------|----------------------------|
| 3.3V | 10V |
| 5V | 16V |
| 12V | 25V |
| 24V | 50V |

---

# 4. Package Recommendation (Industrial)

| Component | Package | Reason |
|----------------|-------------|-------------|
| Resistors | 0805 | Hand repair friendly |
| Ceramic Caps | 0805/1206 | Better voltage stability |
| Bulk Caps | Radial/SMD | High ripple rating |

---

# 5. Decoupling Placement Rules

| Rule | Description |
|--------|------------------|
| Rule 1 | 100nF per IC, <5mm from VCC pin |
| Rule 2 | 10µF per power rail per section |
| Rule 3 | Bulk cap at rail entry |

---

# 6. Industrial Design Tips

- Always use **1% resistors** for logic and ADC paths
- Use **X7R ceramics** (not X5R) for stability
- Never use **6.3V capacitors on 5V rails**
- Prefer **50V caps on 24V systems**

---

# 7. BOM Stocking Strategy

## Keep These Always in Stock

### Resistors
- 10Ω, 100Ω, 330Ω, 1kΩ, 4.7kΩ, 10kΩ, 47kΩ, 100kΩ

### Capacitors
- 100nF (50V)
- 1µF (25V)
- 10µF (25V)
- 47µF (35V)
- 100µF (35V)
- 1000µF (35V)

---

# 8. Quick Design Reference

## Pull-Up / Pull-Down Defaults

| Use | Value |
|--------|-----------|
| GPIO pull-up | 10kΩ |
| I2C pull-up | 4.7kΩ |
| MOSFET gate pull-down | 100kΩ |

## LED Current Limit

| LED Voltage | Resistor |
|-------------------|--------------|
| 3.3V rail | 330Ω |
| 5V rail | 470Ω–1kΩ |
| 24V rail | 4.7kΩ–10kΩ |

---

# 9. Quality Checklist

✔ 1% resistors on logic & ADC
✔ X7R ceramic capacitors
✔ 50V rating on 24V rails
✔ Bulk caps near power entry
✔ Decoupling at every IC

---

# 10. Professional Note

This resistor & capacitor reference is suitable for:
- Industrial motor controllers
- PLC I/O boards
- Vending machine electronics
- Automotive auxiliary modules

---

# 11. Next Step

If needed, I can generate:

- Full **Inductor & Ferrite Bead Reference**
- **TVS, MOV, and ESD Diode Selection Guide**
- **Industrial BOM Template (Excel / CSV)**

Just say:
> “Generate Industrial BOM Templates”

---

End of Document

