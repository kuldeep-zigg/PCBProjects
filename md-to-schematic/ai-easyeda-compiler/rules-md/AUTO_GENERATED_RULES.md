# Auto-Generated Design Rules

**Generated:** 2026-02-01T05:55:16.737Z
**Based on:** 3 components

---

## Component Selection Rules

### Validated Components (Use These)

#### IND
- **Package:** N/A
- **Voltage:** ? - ?
- **Use Count:** 0 designs
- **Status:** ✅ Approved

#### LM358
- **Package:** 8-pin DIP, SOIC, SMT
- **Voltage:** 3V - 32V
- **Use Count:** 0 designs
- **Status:** ✅ Approved

#### WROOM-32
- **Package:** WLCSP-24
- **Voltage:** 3.6V - 4.2V
- **Use Count:** 0 designs
- **Status:** ✅ Approved


### Deprecated Components (Avoid These)

---
**AUTO-GENERATED - Updates on every learning cycle**

## Rule added 2026-02-01T22:18:07.922Z

use bypass capacitors near ICs

---

## Rule added 2026-02-01T22:23:30.432Z

[Reference] 24→5 module (TSR 1-2450 / OKI-78SR), 5→3.3 LDO (AP2112K), reset supervisor (MAX809)

---

## Rule added 2026-02-01T22:25:31.769Z

VMC Hardware Edition | Always use 100nF bypass capacitors near every IC power pin; Understand why bulk capacitors (100-1000uF) are needed near motors; Learn difference between bypass vs bulk capacitors; Always design with a solid ground plane; Learn current return paths (not just signal paths); Know which traces must be wide (power, motors, ground); Separate dirty (motors, LEDs) from clean (MCU, sensors) areas; Learn why motors cause resets and how to stop them; Always add flyback protection for motors and coils; Learn what ground bounce is and why it causes randomness; Never power MCU directly from 24V (learn buck -> LDO strategy); Learn brownout reset vs watchdog reset; Always make power connectors keyed and polarity-safe; Never use two identical swappable connectors on the same board; Use different connector families per voltage domain; Learn why silkscreen labels save field support time; Always include test points for every power rail; Learn how test points speed up debugging 10x; Always expose reset, boot, and programming pins; Learn why 0Ω resistors are debugging tools; Design DNP (Do Not Populate) option footprints; Learn why modular boards beat monolithic boards in low volume; Understand why salary cost > BOM cost in startups; Learn how over-rating components improves reliability; Understand motor inrush vs running vs stall current; Design hardware for worst case, enable features in firmware later; Learn why starting motors 100ms apart reduces problems; Learn why ESP32 Wi-Fi causes current spikes; Always give ESP32 a clean, well-decoupled 3.3V rail; Learn antenna keepout rules for ESP32 modules; Prefer ESP32 modules over bare chips as a beginner; Learn why RS485 is better than GPIO spaghetti for trays; Understand bus vs point-to-point wiring; Learn how addressing (jumpers/DIP) simplifies multi-tray systems; Always plan fault isolation per tray or per bank; Learn how protected motor drivers reduce field failures; Understand why current sensing helps jam detection; Learn why analog sensors need RC filters; Learn why digital sensors are more noise-resistant; Always keep LED PWM currents out of sensor ground paths; Learn why EMI/ESD protection matters inside cabinets; Learn why reverse polarity protection is mandatory; Always leave space and headers for future features; Learn why big boards are faster to iterate than tiny boards; Prefer 0805 parts for speed and reworkability; Avoid QFN/BGA until designs are stable; Learn how assembly mistakes happen and how to prevent them; Always design so a mistake is easy to diagnose and fix; Learn to think in “what will fail in the field?”; Optimize for reliability, serviceability, and learning speed — not size

---

## Rule added 2026-02-01T22:28:37.209Z

Always use 100nF bypass capacitors near every IC power pin

---

## Rule added 2026-02-01T22:28:37.850Z

Understand why bulk capacitors (100–1000µF) are needed near motors

---

## Rule added 2026-02-01T22:28:38.495Z

Learn difference between bypass vs bulk capacitors

---

## Rule added 2026-02-01T22:28:39.132Z

Always design with a solid ground plane

---

## Rule added 2026-02-01T22:29:01.161Z

[Reference] Learn current return paths (not just signal paths)

---

## Rule added 2026-02-01T22:29:21.035Z

[Reference] Know which traces must be wide (power, motors, ground)

---

## Rule added 2026-02-01T22:29:38.491Z

[Reference] Separate dirty (motors, LEDs) from clean (MCU, sensors) areas

---

## Rule added 2026-02-01T22:29:39.150Z

Learn why motors cause resets and how to stop them

---

## Rule added 2026-02-01T22:29:39.799Z

Always add flyback protection for motors and coils

---

## Rule added 2026-02-01T22:29:40.444Z

Learn what ground bounce is and why it causes randomness

---

## Rule added 2026-02-01T22:29:41.092Z

Never power MCU directly from 24V (learn buck → LDO strategy)

---

## Rule added 2026-02-01T22:29:54.434Z

[Reference] Learn brownout reset vs watchdog reset

---

## Rule added 2026-02-01T22:29:55.102Z

Always make power connectors keyed and polarity-safe

---

## Rule added 2026-02-01T22:29:55.745Z

Never use two identical swappable connectors on the same board

---

## Rule added 2026-02-01T22:29:56.386Z

Use different connector families per voltage domain

---

## Rule added 2026-02-01T22:29:57.033Z

Learn why silkscreen labels save field support time

---

## Rule added 2026-02-01T22:29:57.679Z

Always include test points for every power rail

---

## Rule added 2026-02-01T22:29:58.321Z

[Reference] Learn how test points speed up debugging 10×

---

## Rule added 2026-02-01T22:29:58.943Z

Always expose reset, boot, and programming pins

---

## Rule added 2026-02-01T22:29:59.589Z

Learn why 0Ω resistors are debugging tools

---

## Rule added 2026-02-01T22:30:00.235Z

Design DNP (Do Not Populate) option footprints

---

## Rule added 2026-02-01T22:30:00.876Z

Learn why modular boards beat monolithic boards in low volume

---

## Rule added 2026-02-01T22:30:01.522Z

Understand why salary cost > BOM cost in startups

---

## Rule added 2026-02-01T22:30:16.439Z

[Reference] Learn how over-rating components improves reliability

---

## Rule added 2026-02-01T22:30:30.372Z

[Reference] Understand motor inrush vs running vs stall current

---

## Rule added 2026-02-01T22:30:31.026Z

Design hardware for worst case, enable features in firmware later

---

## Rule added 2026-02-01T22:30:31.664Z

Learn why starting motors 100ms apart reduces problems

---

## Rule added 2026-02-01T22:30:32.315Z

Learn why ESP32 Wi-Fi causes current spikes

---

## Rule added 2026-02-01T22:30:32.960Z

Always give ESP32 a clean, well-decoupled 3.3V rail

---

## Rule added 2026-02-01T22:30:54.455Z

[Reference] Learn antenna keepout rules for ESP32 modules

---

## Rule added 2026-02-01T22:31:15.445Z

[Reference] Prefer ESP32 modules over bare chips as a beginner

---

## Rule added 2026-02-01T22:31:16.102Z

Learn why RS485 is better than GPIO spaghetti for trays

---

## Rule added 2026-02-01T22:31:32.997Z

[Reference] Understand bus vs point-to-point wiring

---

## Rule added 2026-02-01T22:31:58.848Z

[Reference] Learn how addressing (jumpers/DIP) simplifies multi-tray systems

---

## Rule added 2026-02-01T22:31:59.505Z

Always plan fault isolation per tray or per bank

---

## Rule added 2026-02-01T22:32:14.580Z

[Reference] Learn how protected motor drivers reduce field failures

---

## Rule added 2026-02-01T22:32:15.226Z

Understand why current sensing helps jam detection

---

## Rule added 2026-02-01T22:32:15.872Z

Learn why analog sensors need RC filters

---

## Rule added 2026-02-01T22:32:16.497Z

Learn why digital sensors are more noise-resistant

---

## Rule added 2026-02-01T22:32:17.145Z

Always keep LED PWM currents out of sensor ground paths

---

## Rule added 2026-02-01T22:32:17.773Z

Learn why EMI/ESD protection matters inside cabinets

---

## Rule added 2026-02-01T22:32:18.419Z

Learn why reverse polarity protection is mandatory

---

## Rule added 2026-02-01T22:32:19.050Z

Always leave space and headers for future features

---

## Rule added 2026-02-01T22:32:19.679Z

Learn why big boards are faster to iterate than tiny boards

---

## Rule added 2026-02-01T22:32:43.498Z

[Reference] Prefer 0805 parts for speed and reworkability

---

## Rule added 2026-02-01T22:33:05.944Z

[Reference] Avoid QFN/BGA until designs are stable

---

## Rule added 2026-02-01T22:33:06.635Z

Learn how assembly mistakes happen and how to prevent them

---

## Rule added 2026-02-01T22:33:07.285Z

Always design so a mistake is easy to diagnose and fix

---

## Rule added 2026-02-01T22:33:21.801Z

[Reference] Learn to think in "what will fail in the field?"

---

## Rule added 2026-02-01T22:33:22.463Z

[Reference] Optimize for reliability, serviceability, and learning speed — not size

---

## Rule added 2026-02-01T22:33:45.445Z

[Reference] capacitor

---

## Rule added 2026-02-01T22:34:08.737Z

[Reference] sensor

---

## Rule added 2026-02-01T22:35:05.235Z

[Reference] motor driver

---
