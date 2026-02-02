# VMC Power Section – Complete Design & 4-Layer PCB Layout Guide

Author: Kuldeep Malviya

This document consolidates the full engineering conversation into a **single, production-ready reference** for designing, laying out, and manufacturing the **VMC (Vending Machine Controller) Power Section** using **EasyEDA**.

---

# Table of Contents

1. Overview
2. Electrical Architecture Summary
3. Power Flow (Functional Chain)
4. MOSFET Reverse Protection + Gate Network
5. Star Ground System
6. LM2596 Buck Regulator – Pin & Stability Guide
7. EMI Filtering & Ferrite Beads
8. 4-Layer PCB Stack Configuration
9. Design Rules (Track Width, Clearance)
10. Exact Component Placement (X/Y Coordinates)
11. Routing Order & EMI Rules
12. Thermal Vias & Heat Management
13. Test Points & Bring-Up
14. Manufacturing Settings
15. Final Checklist

---

# 1. Overview

This guide documents a **professional-grade, industrial VMC power front end** supporting:

* 24V vending motors
* EMI/ESD/hot-plug protection
* Reverse polarity protection
* Star-ground noise control
* Stable +5V logic rail via LM2596 buck regulator

Designed for:

* ESP32 MCU
* Shift register motor matrix
* Sensor ADCs
* Industrial vending machine environments

---

# 2. Electrical Architecture Summary

## Primary Power Chain

```
J1 → F1 → MOV + TVS → P-MOSFET (Q2)
   → FB1 → FB2 → L1 → Bulk Caps → +24V_FILT
                                      ↓
                                  LM2596 → +5V_LOGIC
```

## Ground Architecture

```
GND_IN
   \
    → GND_STAR (C3 negative)
   /
GND_DIGITAL
```

This ensures:

* Motor noise stays in power ground
* MCU and ADC get clean ground

---

# 3. Power Flow (Functional Chain)

| Stage          | Function                        |
| -------------- | ------------------------------- |
| J1             | 24V Input Connector             |
| F1             | Overcurrent Protection          |
| MOV1           | Surge Protection                |
| D3 (TVS)       | Fast Transient Clamp            |
| Q2             | Reverse Polarity Protection     |
| FB1 + FB2 + L1 | EMI Filter                      |
| C3 + C4 + C5   | Bulk + High-Frequency Smoothing |
| LM2596         | 24V → 5V Buck Conversion        |

---

# 4. MOSFET Reverse Protection + Gate Network

## Components

| Ref | Value               | Purpose                     |
| --- | ------------------- | --------------------------- |
| Q2  | DOD40P03 (P-MOSFET) | Reverse polarity protection |
| R1  | 100kΩ               | Gate pull-down              |
| R2  | 10Ω                 | Gate speed limiter          |
| D4  | 1N4148              | Gate clamp diode            |

## Gate Network Concept

```
MOSFET Gate
     |
  R_GATE (10Ω)
     |
  ● Gate Node
   /      \
 R1        D4
100kΩ    1N4148
  |         |
 GND     Source
```

## Why

* Prevents gate ringing during hot-plug
* Reduces EMI
* Protects MOSFET gate oxide

---

# 5. Star Ground System

## Nets

* GND_IN = Dirty motor ground
* GND_DIGITAL = MCU + logic ground
* GND_STAR = Single connection point

## Star Point

**C3 negative terminal**

## EasyEDA Method

1. Leave all original GND nets
2. Cut ground wire at C3 negative
3. Place NetLabel `GND_STAR`
4. Connect:

   * GND_IN → GND_STAR
   * GND_DIGITAL → GND_STAR
   * LM2596 GND → GND_STAR
   * MOSFET GND → GND_STAR

This forces a **single low-impedance noise junction**.

---

# 6. LM2596 Buck Regulator – Pin & Stability Guide

## Pin Mapping

| Pin | Name        | Connection               |
| --- | ----------- | ------------------------ |
| 1   | VIN         | +24V_FILT                |
| 2   | OUT         | D2 → L2                  |
| 3   | GND         | GND_DIGITAL              |
| 4   | FB          | Output Sense (+5V_LOGIC) |
| 5   | ON/OFF      | R4 → VIN                 |
| EP  | Thermal Pad | GND_DIGITAL Plane        |

## EP Pad Layout Rule

* Must connect to GND plane
* Add 4–6 thermal vias
* Copper pour under IC

## Input Stability Caps

| Ref | Value  | Placement          |
| --- | ------ | ------------------ |
| C7  | 100nF  | Closest to VIN pin |
| C8  | 10µF   | Second closest     |
| C6  | 1000µF | Bulk input buffer  |

---

# 7. EMI Filtering & Ferrite Beads

| Component | Purpose                     |
| --------- | --------------------------- |
| FB1       | Kill conducted EMI          |
| FB2       | High-frequency suppression  |
| L1        | Low-frequency ripple filter |
| C2        | Filter capacitor            |

## Recommended Part

**BLM31PG121SN1L**

* 1206
* 6A rated
* Shielded

---

# 8. 4-Layer PCB Stack Configuration

## Target Stack

```
Top (L1)    → Signals + Power (2oz copper)
Inner1 (L2) → GND_DIGITAL Plane
Inner2 (L3) → +24V_FILT Plane
Bottom (L4) → Signals (2oz copper)
Board Thickness = 1.6mm
```

## EasyEDA Settings

| Layer  | Thickness     |
| ------ | ------------- |
| Top    | 0.07mm (2oz)  |
| Inner1 | 0.035mm (1oz) |
| Inner2 | 0.035mm (1oz) |
| Bottom | 0.07mm (2oz)  |

---

# 9. Design Rules (DRC)

## Track Width

| Net       | Width   |
| --------- | ------- |
| VIN_24    | ≥ 3.5mm |
| +24V_FILT | ≥ 3.0mm |
| +5V_LOGIC | ≥ 2.0mm |
| Buck Loop | ≥ 2.5mm |
| Signals   | 0.25mm  |

## Clearance

| Rule          | Value |
| ------------- | ----- |
| Power-Power   | 1.0mm |
| Power-Signal  | 1.2mm |
| Signal-Signal | 0.2mm |

---

# 10. Exact Component Placement (mm Coordinates)

## Reference Origin

**(0,0) = Bottom-left of power section**

## Input Zone

| Part     | X  | Y  |
| -------- | -- | -- |
| J1       | 5  | 45 |
| F1       | 18 | 45 |
| MOV1     | 30 | 55 |
| D3 (TVS) | 30 | 35 |
| C1       | 35 | 45 |

## MOSFET Zone

| Part | X  | Y  |
| ---- | -- | -- |
| Q2   | 50 | 45 |
| R1   | 50 | 58 |
| R2   | 58 | 58 |
| D4   | 54 | 38 |

## EMI Filter Zone

| Part | X   | Y  |
| ---- | --- | -- |
| FB1  | 70  | 45 |
| C2   | 70  | 32 |
| FB2  | 85  | 45 |
| L1   | 100 | 45 |

## Star Ground Zone

| Part    | X   | Y  |
| ------- | --- | -- |
| C3      | 120 | 45 |
| C4      | 125 | 55 |
| C5      | 125 | 35 |
| LED1+R3 | 140 | 45 |

## Buck Zone

| Part    | X   | Y  |
| ------- | --- | -- |
| U1      | 120 | 15 |
| C7      | 112 | 20 |
| C8      | 108 | 15 |
| C6      | 100 | 20 |
| R4      | 128 | 15 |
| D2      | 120 | 5  |
| L2      | 135 | 5  |
| C9      | 150 | 5  |
| C10     | 150 | 15 |
| LED2+R5 | 150 | 25 |

---

# 11. Routing Order & EMI Rules

## Routing Order

1. GND Plane (L2)
2. +24V_FILT Plane (L3)
3. High-current loops (L1)
4. Signals (L4)

## Critical Buck Loop

```
U1 OUT → D2 → L2 → C9 → U1 GND
```

Keep this loop **as small as possible**.

## EMI Rules

| Rule                  | Value |
| --------------------- | ----- |
| FB trace length       | <20mm |
| Power crossing signal | Never |
| Copper under FB       | No    |

---

# 12. Thermal Vias & Heat Management

## LM2596 EP Pad

* Via Drill: 0.3mm
* Via Diameter: 0.6mm
* Count: 6

## Inductor L2

* 4 vias to GND plane

---

# 13. Test Points & Bring-Up

Add these pads:

| Label | Net       |
| ----- | --------- |
| TP1   | VIN_24    |
| TP2   | +24V_FILT |
| TP3   | +5V_LOGIC |
| TP4   | GND_STAR  |

---

# 14. Manufacturing Settings

| Setting   | Value                 |
| --------- | --------------------- |
| Layers    | 4                     |
| Thickness | 1.6mm                 |
| Copper    | 2oz outer / 1oz inner |
| Finish    | ENIG                  |
| Mask      | Green or Black        |

Order Note:

> “4-layer board, 1.6mm thick, 2oz outer copper, 1oz inner copper”

---

# 15. Final Checklist

✔ Reverse polarity protection
✔ Surge protection
✔ EMI filtering
✔ Star grounding
✔ Buck thermal vias
✔ Thick copper power layers
✔ Test points

---

# 16. Professional Notes

This layout style is used in:

* CNC motor drivers
* PLC power modules
* EV control boards

You are now designing **industrial-grade hardware**, not hobby electronics.

---

# 17. Next Steps

* Generate Gerbers
* Panelization
* Factory bring-up checklist
* Load testing with motors

If needed, request:

> “VMC Factory Test Procedure”

---

End of Document
