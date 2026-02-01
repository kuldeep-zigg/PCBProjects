# ESP32 Minimal Reference Design

## Components

### U1: ESP32-WROOM-32
- Package: SMD Module
- LCSC: C82899
- Pins:
  - Pin 1: GND
  - Pin 2: 3V3
  - Pin 3: EN (Enable, active HIGH)
  - Pin 8: GND
  - Pin 25: GPIO0 (Boot mode selection)
  - Pin 34: RXD0
  - Pin 35: TXD0

### Power Supply

#### U2: AMS1117-3.3
- Input: 5V
- Output: 3.3V, 1A
- LCSC: C6186
- Connections:
  - Pin 1 (GND): Ground
  - Pin 2 (OUT): 3.3V output
  - Pin 3 (IN): 5V input

#### C1: 10µF Input Capacitor
- Package: 1206
- LCSC: C19702

#### C2: 22µF Output Capacitor
- Package: 1206
- LCSC: C45783

### Decoupling Capacitors

#### C3-C6: 0.1µF
- Package: 0805
- LCSC: C49678
- Locations:
  - C3: Near ESP32 Pin 2 (3V3)
  - C4: Near ESP32 Pin 21 (3V3)
  - C5: Near AMS1117 output
  - C6: Near USB connector

### Programming Interface

#### R1: 10kΩ Pull-up on EN
- Package: 0805
- LCSC: C17414

#### R2: 10kΩ Pull-up on GPIO0
- Package: 0805
- LCSC: C17414

#### C7, C8: 0.1µF Auto-reset Capacitors
- Package: 0805
- LCSC: C49678
- Connections:
  - C7: DTR → EN
  - C8: RTS → GPIO0

### LED Circuit

#### D1: Red LED
- Package: 0805
- LCSC: C84256
- Forward Voltage: 2.0V
- Current: 20mA

#### R3: 68Ω Current Limiting Resistor
- Package: 0805
- LCSC: C17976
- Calculation: (3.3V - 2.0V) / 0.02A = 65Ω → use 68Ω standard value

## Nets

- **VCC_5V**: USB 5V input
- **VCC_3V3**: Regulated 3.3V
- **GND**: Common ground
- **EN**: ESP32 enable pin
- **GPIO0**: ESP32 boot mode
- **RXD0**: UART receive
- **TXD0**: UART transmit
- **GPIO2**: LED control

## Design Notes

1. ESP32 GPIO2 is also a strapping pin - may affect boot mode
2. All power rails need proper decoupling
3. USB data lines should have ESD protection
4. CH340G or CP2102 needed for USB-to-UART conversion
5. Auto-reset circuit allows programming without manual button press
