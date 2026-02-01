# Component Selection Rules

## Passive Components

### Resistors
- **Preferred Package:** 0805 SMD
- **Tolerance:** ±1% for precision, ±5% for general use
- **Power Rating:** 1/8W (0.125W) minimum
- **Temperature Coefficient:** ±100ppm/°C maximum

### Capacitors
- **Decoupling:** 0.1µF (100nF) ceramic X7R, 0805 package
- **Bulk Filtering:** 10µF or 22µF ceramic X7R, 1206 package
- **Voltage Rating:** Minimum 2x operating voltage

## Active Components

### Microcontrollers
- Must have available LCSC part number
- Development board modules acceptable for prototypes
- Industrial temperature range preferred

### Voltage Regulators
- Linear regulators for <500mA
- Switching regulators for >500mA
- Minimum 20% current headroom

## Design Standards

- All ICs require 0.1µF decoupling capacitor within 5mm
- Power input needs reverse polarity protection
- ESD protection on all external connectors
- Pull-up/pull-down resistors on all critical inputs
- LED current limiting: 20mA maximum per LED

## LCSC Sourcing

- All components must have LCSC part number
- Prefer "Basic" components for lower assembly cost
- Extended components acceptable if necessary
- Verify stock availability before finalizing design
