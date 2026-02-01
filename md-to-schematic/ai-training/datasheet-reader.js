/**
 * PDF Datasheet Reader for PCB Design AI
 * Extracts and analyzes component specifications from datasheets
 */

import fs from 'fs';
import path from 'path';

class DatasheetReader {
  constructor() {
    this.datasheetCache = new Map();
    this.extractedData = new Map();
  }

  /**
   * Extract specifications from PDF datasheet
   * Note: Requires pdf-parse npm package for production use
   */
  async extractFromPDF(pdfPath) {
    console.log(`📄 Reading datasheet: ${pdfPath}`);
    
    // Check if already cached
    if (this.datasheetCache.has(pdfPath)) {
      console.log('   ✓ Using cached data');
      return this.datasheetCache.get(pdfPath);
    }

    try {
      // In production: const pdf = await pdfParse(pdfData);
      // For now, provide structure for manual data entry
      
      const component = path.basename(pdfPath, '.pdf');
      
      const extracted = {
        component: component,
        source: pdfPath,
        timestamp: new Date().toISOString(),
        
        // These would be extracted from PDF
        specifications: {
          electrical: {},
          mechanical: {},
          thermal: {},
          recommended_conditions: {}
        },
        
        typical_application: '',
        design_considerations: [],
        pin_configuration: {},
        package_info: {}
      };

      // Cache the result
      this.datasheetCache.set(pdfPath, extracted);
      return extracted;
      
    } catch (error) {
      console.error(`❌ Error reading PDF: ${error.message}`);
      return null;
    }
  }

  /**
   * Create structured datasheet entry manually
   * Use this to add datasheet data without PDF
   */
  addDatasheetManually(component, specs) {
    const structured = {
      component: component,
      timestamp: new Date().toISOString(),
      source: 'manual_entry',
      ...specs
    };

    this.extractedData.set(component, structured);
    return structured;
  }

  /**
   * Get common component datasheets (pre-loaded)
   */
  getCommonDatasheet(component) {
    const datasheets = {
      'TSOP4838': {
        component: 'TSOP4838',
        description: 'IR Receiver Module for Remote Control Systems',
        manufacturer: 'Vishay',
        
        electrical: {
          supply_voltage: {
            min: 2.5,
            typ: 3.3,
            max: 5.5,
            unit: 'V'
          },
          supply_current: {
            typ: 0.4,
            max: 1.5,
            unit: 'mA'
          },
          output_voltage_low: {
            max: 0.4,
            unit: 'V',
            condition: 'Vs=5V, Io=5mA'
          },
          output_voltage_high: {
            min: 4.5,
            unit: 'V',
            condition: 'Vs=5V'
          },
          carrier_frequency: {
            center: 38,
            unit: 'kHz'
          }
        },
        
        recommended_conditions: {
          operating_temp: { min: -25, max: 85, unit: '°C' },
          supply_voltage_recommended: { value: 5, unit: 'V' },
          filtering: '0.1µF ceramic capacitor between VCC and GND, close to IC'
        },
        
        pinout: {
          1: { name: 'OUT', description: 'Data output (active low)', voltage: 'Logic level' },
          2: { name: 'GND', description: 'Ground' },
          3: { name: 'VS', description: 'Supply voltage', voltage: '2.5V to 5.5V' }
        },
        
        typical_application: `
Application Circuit:
  Pin 3 (VS) → +5V via 0.1µF to GND
  Pin 2 (GND) → Ground
  Pin 1 (OUT) → Microcontroller GPIO
  
Notes:
- Output is ACTIVE LOW when IR signal detected
- Can connect directly to 3.3V or 5V GPIO
- Keep away from direct sunlight
- Shield from IR LEDs on same board`,
        
        design_considerations: [
          'Add 0.1µF ceramic capacitor as close as possible to VS pin',
          'Output is inverted (LOW when signal detected)',
          'Sensitive to 38kHz modulated IR only',
          'Keep receiver away from transmitter LEDs to prevent feedback',
          'Maximum supply voltage: 5.5V (protect if using higher voltage rails)',
          'Output can sink 5mA, suitable for direct GPIO connection'
        ]
      },

      'TSAL6400': {
        component: 'TSAL6400',
        description: 'High Power Infrared Emitting Diode, 940 nm',
        manufacturer: 'Vishay',
        
        electrical: {
          forward_voltage: {
            typ: 1.35,
            max: 1.6,
            unit: 'V',
            condition: 'IF=100mA'
          },
          continuous_forward_current: {
            max: 100,
            unit: 'mA'
          },
          peak_forward_current: {
            max: 1000,
            unit: 'mA',
            condition: 'tp=10µs, D=1%'
          },
          reverse_voltage: {
            max: 5,
            unit: 'V'
          },
          power_dissipation: {
            max: 170,
            unit: 'mW',
            condition: 'at TA=25°C'
          }
        },
        
        optical: {
          wavelength_peak: { typ: 940, unit: 'nm' },
          spectral_bandwidth: { typ: 50, unit: 'nm' },
          radiant_intensity: { min: 70, unit: 'mW/sr', condition: 'IF=100mA' },
          viewing_angle: { typ: 10, unit: 'degrees' }
        },
        
        thermal: {
          junction_temp: { max: 100, unit: '°C' },
          thermal_resistance: { typ: 150, unit: 'K/W', path: 'junction to ambient' }
        },
        
        recommended_conditions: {
          continuous_current: { max: 100, recommended: 50, unit: 'mA' },
          pulse_current: { max: 1000, duty_cycle_max: 1, unit: 'mA' },
          operating_temp: { min: -40, max: 85, unit: '°C' }
        },
        
        typical_application: `
Current Limiting Resistor Calculation:
  R = (Vsupply - Vf) / IF
  
Example: 100mA from 5V supply
  R = (5V - 1.35V) / 0.1A = 36.5Ω
  Use standard value: 39Ω
  Power: P = I² × R = 0.1² × 39 = 0.39W
  Use: 0.5W or 1W resistor
  
MOSFET Driver Circuit:
  5V → 39Ω → LED Anode
  LED Cathode → MOSFET Drain
  MOSFET Source → GND
  MOSFET Gate ← 470Ω ← Driver IC
  MOSFET Gate → 10kΩ → GND (pull-down)`,
        
        design_considerations: [
          'Forward voltage is 1.35V typical, use this for calculations',
          'For continuous operation: limit to 50mA for reliability',
          'For pulsed operation: can use up to 1A with proper duty cycle',
          'Add heatsink if continuous current > 50mA',
          'Use MOSFET for switching, NOT direct from GPIO',
          'Gate resistor (470Ω) limits inrush current',
          'Pull-down resistor (10kΩ) prevents floating gate',
          'Power dissipation: P = IF × VF = 0.1A × 1.35V = 135mW',
          'For maximum range: use pulsed mode with high current'
        ]
      },

      '74HC595': {
        component: '74HC595',
        description: '8-Bit Shift Register with Output Latches',
        manufacturer: 'Texas Instruments / NXP',
        
        electrical: {
          supply_voltage: {
            min: 2,
            typ: 5,
            max: 6,
            unit: 'V'
          },
          supply_current: {
            typ: 4,
            max: 80,
            unit: 'µA',
            condition: 'quiescent'
          },
          output_current: {
            max: 35,
            unit: 'mA',
            per_pin: true
          },
          input_voltage_high: {
            min: 3.15,
            unit: 'V',
            condition: 'VCC=4.5V'
          },
          input_voltage_low: {
            max: 1.35,
            unit: 'V',
            condition: 'VCC=4.5V'
          },
          max_clock_frequency: {
            typ: 25,
            unit: 'MHz',
            condition: 'VCC=5V'
          }
        },
        
        pinout: {
          1: { name: 'QB', description: 'Output 2' },
          2: { name: 'QC', description: 'Output 3' },
          3: { name: 'QD', description: 'Output 4' },
          4: { name: 'QE', description: 'Output 5' },
          5: { name: 'QF', description: 'Output 6' },
          6: { name: 'QG', description: 'Output 7' },
          7: { name: 'QH', description: 'Output 8' },
          8: { name: 'GND', description: 'Ground' },
          9: { name: 'QH\'', description: 'Serial output for cascading' },
          10: { name: 'SRCLR', description: 'Shift register clear (active LOW)' },
          11: { name: 'SRCLK', description: 'Shift register clock' },
          12: { name: 'RCLK', description: 'Storage register clock (latch)' },
          13: { name: 'OE', description: 'Output enable (active LOW)' },
          14: { name: 'SER', description: 'Serial data input' },
          15: { name: 'QA', description: 'Output 1' },
          16: { name: 'VCC', description: 'Supply voltage' }
        },
        
        functional_description: `
Operation:
1. Data is shifted into the shift register on SRCLK rising edge
2. Data is transferred to output latches on RCLK rising edge
3. Outputs are enabled when OE is LOW
4. QH' allows cascading multiple 74HC595

Timing:
- Shift data in on SRCLK
- Latch data on RCLK
- Keep OE LOW for continuous output

Cascading:
- Connect QH' of first IC to SER of second IC
- Share SRCLK, RCLK, OE between all ICs
- 2 ICs = 16 outputs, 3 ICs = 24 outputs, etc.`,
        
        typical_application: `
Basic Connection:
  Pin 16 (VCC) → +5V with 0.1µF to GND
  Pin 8 (GND) → Ground
  Pin 14 (SER) → Microcontroller GPIO (DATA)
  Pin 11 (SRCLK) → MCU GPIO (CLOCK)
  Pin 12 (RCLK) → MCU GPIO (LATCH)
  Pin 13 (OE) → GND (or MCU GPIO for enable control)
  Pin 10 (SRCLR) → VCC (or MCU GPIO for clear)
  Pins 15, 1-7 → Outputs (via resistors to LEDs/MOSFETs)

Output Loading:
  Each output → 220-470Ω → MOSFET gate
  MOSFET gate → 10kΩ → GND`,
        
        design_considerations: [
          'Add 0.1µF decoupling capacitor between VCC (pin 16) and GND (pin 8)',
          'Place capacitor within 10mm of IC',
          'Maximum 35mA per output pin',
          'Use gate resistors (470Ω) when driving MOSFETs',
          'Pull OE pin LOW for active outputs (or use 10kΩ to GND)',
          'SRCLR should be HIGH for normal operation (connect to VCC)',
          'Can operate at 3.3V or 5V',
          'For 3.3V MCU driving 5V 74HC595: use level shifter or power 74HC595 at 3.3V',
          'Keep clock lines short to avoid noise',
          'Maximum clock frequency decreases with lower VCC'
        ]
      },

      'ESP32-WROOM-32': {
        component: 'ESP32-WROOM-32',
        description: 'WiFi & Bluetooth Microcontroller Module',
        manufacturer: 'Espressif Systems',
        
        electrical: {
          supply_voltage: {
            min: 3.0,
            typ: 3.3,
            max: 3.6,
            unit: 'V'
          },
          current: {
            active: { typ: 80, max: 240, unit: 'mA' },
            modem_sleep: { typ: 20, unit: 'mA' },
            light_sleep: { typ: 0.8, unit: 'mA' },
            deep_sleep: { typ: 10, unit: 'µA' }
          },
          wifi_current: {
            tx_max: 240,
            rx: 100,
            unit: 'mA'
          }
        },
        
        processor: {
          chip: 'ESP32-D0WDQ6',
          cores: 2,
          architecture: 'Xtensa LX6',
          frequency: { default: 160, max: 240, unit: 'MHz' },
          sram: { size: 520, unit: 'KB' },
          rom: { size: 448, unit: 'KB' },
          flash: { size: 4, unit: 'MB' }
        },
        
        gpio: {
          total_pins: 34,
          usable_pins: 26,
          voltage_level: '3.3V',
          max_current_per_pin: '40mA',
          max_current_all: '200mA',
          adc: {
            channels: 18,
            resolution: '12-bit',
            voltage_range: '0-3.3V'
          },
          dac: { channels: 2, resolution: '8-bit' },
          pwm: { channels: 16, resolution: '16-bit' },
          touch: { channels: 10 },
          uart: 3,
          spi: 4,
          i2c: 2
        },
        
        wireless: {
          wifi: {
            standard: '802.11 b/g/n',
            frequency: '2.4 GHz',
            modes: ['Station', 'SoftAP', 'SoftAP+Station'],
            tx_power: { max: 20, unit: 'dBm' }
          },
          bluetooth: {
            version: 'v4.2',
            modes: ['BR/EDR', 'BLE'],
            tx_power: { max: 9, unit: 'dBm' }
          }
        },
        
        pinout_important: {
          EN: 'Enable (active HIGH), pull-up for normal operation',
          GPIO0: 'Boot mode selection, LOW = download mode',
          GPIO2: 'Strapping pin, affects boot mode',
          TXD0: 'UART0 TX for programming/debug',
          RXD0: 'UART0 RX for programming/debug',
          'GPIO6-11': 'Connected to internal flash - DO NOT USE',
          'Strapping pins': 'GPIO0, GPIO2, GPIO5, GPIO12, GPIO15'
        },
        
        typical_application: `
Minimal Boot Circuit:
  Pin 1 (GND) → Ground
  Pin 2 (3V3) → +3.3V
  Pin 3 (EN) → +3.3V via 10kΩ pull-up, 0.1µF to GND
  Pin 8 (GND) → Ground
  Pin 25 (GPIO0) → 10kΩ pull-up to 3.3V, button to GND for programming

Power Supply:
  - 3.3V regulated supply required
  - Add 10µF bulk capacitor at VDD
  - Add 0.1µF ceramic near each VDD pin
  - WiFi active: ensure 500mA capability

Programming Circuit:
  - USB-to-UART: CP2102, CH340G, or FT232
  - Auto-reset: DTR → 0.1µF → EN
  - Auto-bootloader: RTS → 0.1µF → GPIO0
  
LED Blink Example:
  GPIO2 → 220Ω → LED Anode
  LED Cathode → GND
  
  Note: GPIO2 is also used for boot strapping.
  If LED always on at boot, add pull-down option.`,
        
        design_considerations: [
          'All GPIO are 3.3V - NOT 5V tolerant!',
          'GPIO 6-11 are connected to internal flash - NEVER USE',
          'Strapping pins (0,2,5,12,15) affect boot mode - check pull-ups/downs',
          'GPIO0 must be HIGH at boot for normal operation',
          'WiFi requires good power supply - 500mA capable, low noise',
          'Add 0.1µF decoupling caps near each VDD pin (4 total)',
          'Add 10µF or larger bulk capacitor at main VDD',
          'Keep WiFi antenna area clear - no ground plane under antenna',
          'PCB antenna needs 5mm clearance from ground and components',
          'For external antenna: add U.FL connector and matching circuit',
          'Enable pin (EN) needs 10kΩ pull-up and 0.1µF to GND for reset',
          'Use USB-to-UART chip (CP2102/CH340) for programming',
          'Auto-reset circuit: 0.1µF caps on EN and GPIO0 from DTR/RTS',
          'Maximum GPIO current: 40mA per pin, 200mA total',
          'ADC2 cannot be used when WiFi is active',
          'Deep sleep current: ~10µA (disconnect USB-UART for low power)',
          'Flash memory wears out - avoid excessive writes',
          'Brownout detector: ensure clean power supply'
        ]
      },

      'RaspberryPiPico': {
        component: 'Raspberry Pi Pico',
        description: 'RP2040 Microcontroller Board',
        manufacturer: 'Raspberry Pi Foundation',
        
        electrical: {
          supply_voltage_usb: { typ: 5, unit: 'V' },
          supply_voltage_vsys: { min: 1.8, max: 5.5, unit: 'V' },
          gpio_voltage: { typ: 3.3, unit: 'V' },
          gpio_current_max: { max: 16, unit: 'mA', per_pin: true },
          total_gpio_current: { max: 300, unit: 'mA' },
          supply_current_typical: { typ: 25, unit: 'mA', condition: 'running at 48MHz' }
        },
        
        processor: {
          chip: 'RP2040',
          cores: 2,
          frequency: { max: 133, unit: 'MHz' },
          sram: { size: 264, unit: 'KB' },
          flash: { size: 2, unit: 'MB' }
        },
        
        gpio: {
          total_pins: 26,
          voltage_level: '3.3V',
          max_current_per_pin: '16mA',
          max_current_all: '300mA',
          adc_pins: 3,
          pwm_channels: 16,
          uart: 2,
          spi: 2,
          i2c: 2,
          pio: '8 state machines'
        },
        
        pinout_important: {
          VBUS: 'USB 5V input',
          VSYS: 'System voltage (1.8-5.5V)',
          '3V3_EN': 'Enables 3.3V regulator',
          '3V3': '3.3V output (max 300mA)',
          GND: 'Ground (multiple pins)',
          GP0_GP28: 'GPIO pins (3.3V logic)'
        },
        
        typical_application: `
Power Options:
1. USB: 5V via micro-USB port
2. VSYS: 1.8-5.5V on VSYS pin
3. 3V3: NOT for power input (output only)

GPIO Usage:
- Logic level: 3.3V
- Maximum current per pin: 16mA
- For higher current (LEDs, motors): use MOSFET/transistor
- 5V devices: use level shifter or check if 3.3V compatible

Decoupling:
- 0.1µF ceramic near RP2040 chip
- 10µF on 3V3 rail if drawing current`,
        
        design_considerations: [
          'GPIO pins are 3.3V - NOT 5V tolerant!',
          'Maximum 16mA per pin, 300mA total for all GPIOs',
          'For 5V devices: check if 3.3V logic input is sufficient',
          'Use level shifter for true 5V compatibility',
          'USB provides 5V on VBUS',
          'Built-in voltage regulator provides 3.3V (max 300mA)',
          'Add 10µF capacitor on 3V3 if external devices draw current',
          'Use external 5V supply for high-current peripherals',
          'Flash memory: 2MB available for program and data',
          'PIO (Programmable I/O) can implement custom protocols',
          'Boot button: hold while powering on to enter bootloader'
        ]
      }
    };

    return datasheets[component] || null;
  }

  /**
   * Query datasheet with AI (integrates with orchestrator)
   */
  async queryDatasheet(component, question, aiOrchestrator) {
    const datasheet = this.getCommonDatasheet(component);
    
    if (!datasheet) {
      return `❌ Datasheet not found for ${component}. Available: ${Object.keys(this.getCommonDatasheet()).join(', ')}`;
    }

    const prompt = `Using this component datasheet:

Component: ${datasheet.component}
Description: ${datasheet.description}

Specifications:
${JSON.stringify(datasheet, null, 2)}

Question: ${question}

Provide detailed answer with:
1. Direct answer to question
2. Relevant specifications
3. Design recommendations
4. Calculations if needed
5. Safety considerations`;

    // Use reasoning model for deep datasheet analysis
    return await aiOrchestrator.analyzeWithReasoning({ datasheet }, prompt);
  }

  /**
   * Extract design requirements from datasheet
   */
  getDesignRequirements(component) {
    const datasheet = this.getCommonDatasheet(component);
    
    if (!datasheet) return null;

    return {
      component: component,
      power_supply: datasheet.electrical?.supply_voltage || datasheet.electrical?.supply_voltage_vsys,
      decoupling: '0.1µF ceramic capacitor close to power pins',
      considerations: datasheet.design_considerations || [],
      typical_circuit: datasheet.typical_application || ''
    };
  }

  /**
   * Generate component library entry
   */
  generateLibraryEntry(component) {
    const datasheet = this.getCommonDatasheet(component);
    
    if (!datasheet) return null;

    return {
      name: component,
      description: datasheet.description,
      manufacturer: datasheet.manufacturer,
      specs: {
        voltage: datasheet.electrical?.supply_voltage || datasheet.electrical?.supply_voltage_vsys,
        current: datasheet.electrical?.supply_current || datasheet.electrical?.continuous_forward_current
      },
      pinout: datasheet.pinout || datasheet.pinout_important,
      usage_notes: datasheet.design_considerations,
      typical_circuit: datasheet.typical_application
    };
  }

  /**
   * Save datasheet library
   */
  saveLibrary(filepath) {
    const library = {};
    const components = ['TSOP4838', 'TSAL6400', '74HC595', 'RaspberryPiPico'];
    
    components.forEach(comp => {
      library[comp] = this.getCommonDatasheet(comp);
    });

    fs.writeFileSync(filepath, JSON.stringify(library, null, 2));
    console.log(`📚 Datasheet library saved: ${filepath}`);
  }
}

// Export
export { DatasheetReader };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const reader = new DatasheetReader();
  const command = process.argv[2];

  if (command === 'list') {
    console.log('\n📚 Available Component Datasheets:\n');
    ['TSOP4838', 'TSAL6400', '74HC595', 'ESP32-WROOM-32', 'RaspberryPiPico'].forEach(comp => {
      const ds = reader.getCommonDatasheet(comp);
      console.log(`  ${comp}: ${ds.description}`);
    });
    
  } else if (command === 'show') {
    const component = process.argv[3];
    const datasheet = reader.getCommonDatasheet(component);
    
    if (datasheet) {
      console.log(`\n📄 Datasheet: ${datasheet.component}\n`);
      console.log(JSON.stringify(datasheet, null, 2));
    } else {
      console.log(`❌ Component ${component} not found`);
    }
    
  } else if (command === 'requirements') {
    const component = process.argv[3];
    const reqs = reader.getDesignRequirements(component);
    
    if (reqs) {
      console.log(`\n🔧 Design Requirements for ${component}:\n`);
      console.log(JSON.stringify(reqs, null, 2));
    } else {
      console.log(`❌ Component ${component} not found`);
    }
    
  } else if (command === 'export') {
    const outputPath = process.argv[3] || './datasheet-library.json';
    reader.saveLibrary(outputPath);
    
  } else {
    console.log(`
📄 Datasheet Reader

Commands:
  node datasheet-reader.js list
    → List available datasheets

  node datasheet-reader.js show <component>
    → Show full datasheet

  node datasheet-reader.js requirements <component>
    → Show design requirements

  node datasheet-reader.js export [path]
    → Export library to JSON

Examples:
  node datasheet-reader.js show TSOP4838
  node datasheet-reader.js requirements RaspberryPiPico
  node datasheet-reader.js export ./my-library.json
    `);
  }
}
