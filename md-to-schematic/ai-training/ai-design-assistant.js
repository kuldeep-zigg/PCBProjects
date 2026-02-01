/**
 * AI PCB Design Assistant
 * Interacts with local AI models to help design PCBs
 */

import fs from 'fs';
import path from 'path';
import { PCBTrainingDataGenerator } from './training-data-generator.js';

class AIDesignAssistant {
  constructor(aiEndpoint = 'http://localhost:11434') {
    this.aiEndpoint = aiEndpoint; // Default: Ollama
    this.generator = new PCBTrainingDataGenerator();
    this.knowledgeBase = this.generator.buildElectronicsKnowledge();
  }

  /**
   * Analyze user requirements and suggest components
   */
  async analyzeRequirements(userInput) {
    return {
      understanding: this.parseRequirements(userInput),
      suggested_components: this.suggestComponents(userInput),
      design_approach: this.suggestDesignApproach(userInput),
      questions: this.generateClarifyingQuestions(userInput)
    };
  }

  /**
   * Parse user requirements
   */
  parseRequirements(input) {
    const requirements = {
      io_count: this.extractIOCount(input),
      power: this.extractPower(input),
      communication: this.extractCommunication(input),
      special_features: this.extractSpecialFeatures(input)
    };

    return requirements;
  }

  extractIOCount(input) {
    const ioMatches = input.match(/(\d+)\s*(ir|led|sensor|button|output|input)/gi);
    return ioMatches || [];
  }

  extractPower(input) {
    const voltageMatch = input.match(/(\d+\.?\d*)\s*v/gi);
    const currentMatch = input.match(/(\d+)\s*(ma|a)/gi);
    
    return {
      voltage: voltageMatch,
      current: currentMatch
    };
  }

  extractCommunication(input) {
    const protocols = ['spi', 'i2c', 'uart', 'usb', 'serial', 'wireless'];
    const found = protocols.filter(p => input.toLowerCase().includes(p));
    return found;
  }

  extractSpecialFeatures(input) {
    const features = [];
    
    if (/ir|infrared/i.test(input)) features.push('Infrared communication');
    if (/wireless|wifi|bluetooth/i.test(input)) features.push('Wireless');
    if (/motor/i.test(input)) features.push('Motor control');
    if (/sensor/i.test(input)) features.push('Sensor input');
    if (/display|lcd|oled/i.test(input)) features.push('Display');
    
    return features;
  }

  /**
   * Suggest components based on requirements
   */
  suggestComponents(input) {
    const suggestions = {
      microcontroller: this.suggestMCU(input),
      interface_ics: this.suggestInterfaceICs(input),
      passive_components: this.suggestPassives(input),
      connectors: this.suggestConnectors(input)
    };

    return suggestions;
  }

  suggestMCU(input) {
    const options = [];

    if (/many gpio|lots of pins|20.*gpio/i.test(input)) {
      options.push({
        model: 'Raspberry Pi Pico',
        reason: '26 GPIO pins, 3.3V logic, USB programmable, cost-effective',
        pros: ['Many GPIOs', 'RP2040 dual core', 'PIO for custom protocols', 'Popular, lots of support'],
        cons: ['3.3V logic (may need level shifters for 5V)'],
        price: '$4-5'
      });
    }

    if (/atmega|arduino/i.test(input)) {
      options.push({
        model: 'ATmega328P',
        reason: 'Arduino-compatible, 5V logic, widely used',
        pros: ['5V logic', 'Arduino IDE support', 'Huge library ecosystem'],
        cons: ['Limited GPIOs (23)', 'Lower clock speed'],
        price: '$2-3'
      });
    }

    if (/esp32|wifi|bluetooth/i.test(input)) {
      options.push({
        model: 'ESP32',
        reason: 'Built-in WiFi/Bluetooth, powerful',
        pros: ['WiFi + BT', 'Dual core', 'Many peripherals'],
        cons: ['More complex to use', 'Higher power consumption'],
        price: '$3-6'
      });
    }

    return options.length > 0 ? options : [{
      model: 'Raspberry Pi Pico',
      reason: 'Good general-purpose choice for most projects'
    }];
  }

  suggestInterfaceICs(input) {
    const ics = [];

    if (/shift register|many outputs|expand gpio/i.test(input)) {
      ics.push({
        model: '74HC595',
        purpose: 'Serial-to-parallel shift register',
        description: '8 outputs using 3 control pins, cascadable',
        when_to_use: 'Need many outputs (LEDs, drivers) but limited GPIOs'
      });
    }

    if (/many inputs|button matrix|keypad/i.test(input)) {
      ics.push({
        model: '74HC165',
        purpose: 'Parallel-to-serial shift register',
        description: '8 inputs using 3 control pins, cascadable',
        when_to_use: 'Read many buttons or sensors with few GPIOs'
      });
    }

    if (/i2c.*expand|io expander/i.test(input)) {
      ics.push({
        model: 'MCP23017',
        purpose: 'I2C GPIO expander',
        description: '16 I/O pins via I2C, interrupt support',
        when_to_use: 'Need bidirectional I/O expansion via I2C'
      });
    }

    return ics;
  }

  suggestPassives(input) {
    return {
      always_required: [
        { type: 'Capacitor', value: '0.1µF ceramic', quantity: 'One per IC', purpose: 'Decoupling' },
        { type: 'Capacitor', value: '10-100µF electrolytic', quantity: '1-2', purpose: 'Bulk filtering' },
        { type: 'Resistor', value: '10kΩ', quantity: 'As needed', purpose: 'Pull-up/pull-down' }
      ],
      conditional: this.getConditionalPassives(input)
    };
  }

  getConditionalPassives(input) {
    const components = [];

    if (/led/i.test(input)) {
      components.push({
        type: 'Resistor',
        value: '220-470Ω for standard LED, calculate for power LEDs',
        purpose: 'LED current limiting',
        calculation: 'R = (Vsupply - Vled) / I_desired'
      });
    }

    if (/mosfet/i.test(input)) {
      components.push({
        type: 'Resistor',
        value: '220-470Ω gate resistor, 10kΩ pull-down',
        purpose: 'MOSFET gate protection and prevent floating'
      });
    }

    return components;
  }

  suggestConnectors(input) {
    const connectors = [];

    if (/two pcb|separate board/i.test(input)) {
      connectors.push({
        type: 'Pin header',
        specification: '2.54mm pitch, male/female',
        pins: 'Based on signal count + power + ground'
      });
    }

    return connectors;
  }

  /**
   * Suggest design approach
   */
  suggestDesignApproach(input) {
    return {
      architecture: this.suggestArchitecture(input),
      pcb_layout: this.suggestLayout(input),
      power_distribution: this.suggestPowerDesign(input),
      design_steps: this.getDesignSteps()
    };
  }

  suggestArchitecture(input) {
    if (/two pcb|separate board/i.test(input)) {
      return {
        type: 'Multi-board system',
        boards: [
          {
            name: 'Control Board',
            purpose: 'Microcontroller and input processing',
            components: ['MCU', 'Sensors/Inputs', 'Interface ICs']
          },
          {
            name: 'Power/Driver Board',
            purpose: 'High-current outputs and power management',
            components: ['MOSFETs', 'LEDs', 'Power components']
          }
        ],
        interconnection: 'Pin header connector with signal + power + ground',
        advantages: ['Modular', 'Easier debugging', 'Separate noisy/clean circuits']
      };
    }

    return {
      type: 'Single-board system',
      layout: 'All components on one PCB',
      considerations: ['Keep analog/digital separated', 'Power distribution planning']
    };
  }

  suggestLayout(input) {
    return [
      'Place MCU in center of board',
      'Group related components together (sensors, drivers, etc.)',
      'Keep high-current traces thick and short',
      'Use ground plane (polygon pour) on bottom layer',
      'Place decoupling caps within 10mm of IC power pins',
      'Route power first, then critical signals, then general signals',
      'Keep sensitive signals away from noisy ones',
      'Add test points for debugging'
    ];
  }

  suggestPowerDesign(input) {
    return {
      input: 'Add reverse polarity protection diode',
      filtering: 'Bulk capacitor (10-100µF) + ceramic (0.1µF) per IC',
      distribution: 'Star topology from power input, thick traces',
      ground: 'Common ground plane, single point connection for analog/digital',
      protection: 'Consider TVS diode for industrial environments'
    };
  }

  getDesignSteps() {
    return [
      {
        step: 1,
        title: 'Requirements Analysis',
        tasks: [
          'List all inputs and outputs',
          'Determine power requirements',
          'Identify communication protocols',
          'Define physical constraints'
        ]
      },
      {
        step: 2,
        title: 'Component Selection',
        tasks: [
          'Choose microcontroller',
          'Select interface ICs if needed',
          'Calculate passive component values',
          'Choose connectors'
        ]
      },
      {
        step: 3,
        title: 'Schematic Design',
        tasks: [
          'Draw power section',
          'Add microcontroller with decoupling',
          'Connect peripherals',
          'Add protection circuits',
          'Label all nets and components'
        ]
      },
      {
        step: 4,
        title: 'PCB Layout',
        tasks: [
          'Define board outline and mounting holes',
          'Place components logically',
          'Route power and ground',
          'Route signal traces',
          'Add ground plane',
          'Add silkscreen labels'
        ]
      },
      {
        step: 5,
        title: 'Design Validation',
        tasks: [
          'Run DRC (Design Rule Check)',
          'Verify all connections',
          'Check component clearances',
          'Review power calculations',
          'Add test points'
        ]
      }
    ];
  }

  /**
   * Generate clarifying questions
   */
  generateClarifyingQuestions(input) {
    const questions = [];

    if (!this.extractPower(input).voltage) {
      questions.push('What supply voltage will you use? (3.3V, 5V, 12V, etc.)');
    }

    if (!input.match(/frequency|speed|rate/i)) {
      questions.push('What is the operating frequency/update rate needed?');
    }

    if (!input.match(/range|distance/i) && /ir|infrared/i.test(input)) {
      questions.push('What IR communication range do you need?');
    }

    if (!input.match(/temperature|environment/i)) {
      questions.push('Operating environment? (indoor, outdoor, industrial, temperature range)');
    }

    questions.push('Any size constraints for the PCB?');
    questions.push('Single-sided, double-sided, or multilayer PCB?');

    return questions;
  }

  /**
   * Validate an existing PCB design
   */
  async validateDesign(pcbData) {
    const analysis = this.generator.analyzePCBDesign(pcbData);
    
    return {
      validation_results: analysis.validation,
      detailed_issues: this.findDetailedIssues(pcbData, analysis),
      improvements: analysis.suggestions,
      calculations_check: this.verifyCalculations(analysis.calculations),
      best_practices_check: this.checkBestPractices(pcbData, analysis)
    };
  }

  findDetailedIssues(pcbData, analysis) {
    const issues = [];

    // Check each component
    analysis.components.forEach(comp => {
      const requirements = comp.requirements;
      
      if (requirements.required_components) {
        requirements.required_components.forEach(passive => {
          issues.push({
            severity: 'warning',
            component: comp.component.name || comp.component.model,
            issue: `Requires ${passive.type} ${passive.value}`,
            location: passive.placement,
            reason: passive.purpose
          });
        });
      }
    });

    // Check connections
    analysis.connections.forEach(conn => {
      if (conn.validation.issues.length > 0) {
        conn.validation.issues.forEach(issue => {
          issues.push({
            severity: 'error',
            connection: `${conn.connection.from?.component} → ${conn.connection.to?.component}`,
            issue: issue,
            fix: 'Add specified component'
          });
        });
      }
    });

    return issues;
  }

  verifyCalculations(calculations) {
    const checks = {};

    if (calculations.led_resistor) {
      const calc = calculations.led_resistor;
      checks.led_resistor = {
        status: 'OK',
        value: calc.standard_value,
        power_rating: calc.power_rating,
        note: 'Verify actual Vf of your specific LED from datasheet'
      };
    }

    if (calculations.power_budget) {
      const totalMA = parseFloat(calculations.power_budget.total);
      checks.power_supply = {
        status: totalMA < 1000 ? 'OK' : 'CHECK',
        current_draw: calculations.power_budget.total,
        recommendation: calculations.power_budget.recommended_supply,
        warning: totalMA > 500 ? 'Consider heat dissipation and trace widths' : null
      };
    }

    return checks;
  }

  checkBestPractices(pcbData, analysis) {
    const checks = {
      passed: [],
      failed: [],
      suggestions: []
    };

    // Decoupling check
    const hasDecoupling = pcbData.components.some(c => 
      c.type === 'CAPACITOR' && (c.value === '0.1µF' || c.value === '100nF')
    );
    
    if (hasDecoupling) {
      checks.passed.push('Decoupling capacitors included');
    } else {
      checks.failed.push('Missing decoupling capacitors');
      checks.suggestions.push('Add 0.1µF ceramic capacitor near each IC VCC pin');
    }

    // Power filtering check
    const hasBulkCap = pcbData.components.some(c =>
      c.type === 'CAPACITOR' && /10.*µF|100.*µF/i.test(c.value)
    );
    
    if (hasBulkCap) {
      checks.passed.push('Bulk filtering capacitor included');
    } else {
      checks.suggestions.push('Add 10-100µF bulk capacitor at power input');
    }

    // Test points
    checks.suggestions.push('Add test points for VCC, GND, and critical signals');
    checks.suggestions.push('Label all connectors and pins on silkscreen');

    return checks;
  }

  /**
   * Generate EasyEDA-compatible output
   */
  async generateEasyEDAInstructions(pcbData, analysis) {
    return {
      schematic_creation: {
        steps: [
          'Create new schematic in EasyEDA Pro',
          'Add components from library',
          'Place components according to logical grouping',
          'Wire connections',
          'Add power symbols (VCC, GND)',
          'Add labels and annotations'
        ],
        component_library: this.getEasyEDAComponents(pcbData),
        netlist: this.generateNetlist(pcbData)
      },
      
      pcb_layout: {
        board_setup: {
          layers: '2 (Top + Bottom)',
          dimensions: 'Based on component count (estimate: 80mm x 60mm)',
          thickness: '1.6mm standard'
        },
        design_rules: {
          trace_width: {
            signal: '0.25mm (10mil)',
            power: '0.5-1.0mm (20-40mil)'
          },
          clearance: '0.2mm (8mil)',
          via_size: '0.8mm pad, 0.4mm hole'
        },
        placement_guide: this.getPlacementGuide(pcbData, analysis)
      },

      manufacturing: {
        gerber_files: 'Generate from EasyEDA: Fabrication → Generate Gerber',
        recommended_fab: 'JLCPCB (integrated with EasyEDA)',
        options: {
          quantity: '5 boards minimum',
          surface_finish: 'HASL or ENIG',
          solder_mask: 'Green (standard)',
          silkscreen: 'White'
        }
      }
    };
  }

  getEasyEDAComponents(pcbData) {
    return pcbData.components.map(comp => ({
      component: comp.model || comp.type,
      library_search: comp.model || this.getGenericName(comp.type),
      alternative_if_not_found: this.getSimilarComponents(comp.model || comp.type),
      footprint: this.getRecommendedFootprint(comp.type)
    }));
  }

  getGenericName(type) {
    const names = {
      'MCU': 'Raspberry Pi Pico',
      'IR_RECEIVER': 'TSOP4838 or generic IR receiver 3-pin',
      'SHIFT_REGISTER': '74HC595 DIP-16 or SOIC-16',
      'MOSFET': '2N7000 or BS170 TO-92',
      'IR_LED': 'LED 5mm or TSAL6400'
    };
    return names[type] || type;
  }

  getSimilarComponents(model) {
    const alternatives = {
      'Raspberry Pi Pico': ['RP2040', 'Arduino Nano', 'ESP32 DevKit'],
      'TSOP4838': ['TSOP4838', 'TSOP38238', 'VS1838B'],
      '74HC595': ['74HC595', '74HCT595', 'SN74HC595'],
      'TSAL6400': ['TSAL6400', 'HS0038A', 'Generic 5mm IR LED']
    };
    return alternatives[model] || [];
  }

  getRecommendedFootprint(type) {
    const footprints = {
      'MCU': 'Custom module footprint (search EasyEDA library)',
      'IR_RECEIVER': 'TO-92 or custom 3-pin',
      'SHIFT_REGISTER': 'DIP-16 or SOIC-16',
      'MOSFET': 'TO-92 for small signal',
      'IR_LED': '5mm LED or custom',
      'CAPACITOR': '0805 SMD or through-hole',
      'RESISTOR': '0805 SMD or through-hole'
    };
    return footprints[type] || 'Check datasheet';
  }

  getPlacementGuide(pcbData, analysis) {
    return {
      mcu_area: {
        location: 'Center-left of board',
        orientation: 'USB port toward board edge',
        clearance: '5mm around for programming access',
        nearby: 'Decoupling capacitors within 10mm'
      },
      input_section: {
        location: 'Near MCU',
        components: 'IR receivers',
        layout: 'Grid pattern for organized wiring',
        notes: 'Keep away from output IR LEDs'
      },
      output_section: {
        location: 'Right side or separate PCB',
        components: 'Shift register, MOSFETs, IR LEDs',
        layout: 'Linear arrangement',
        notes: 'Thick traces for LED current'
      },
      power: {
        input: 'Top-left corner with connector',
        distribution: 'Star pattern from input',
        ground_plane: 'Bottom layer fill',
        components: 'Bulk cap at input, decoupling at each IC'
      }
    };
  }

  generateNetlist(pcbData) {
    const netlist = [];
    
    pcbData.connections.forEach((conn, idx) => {
      netlist.push({
        net: idx + 1,
        name: conn.signal || `Net${idx + 1}`,
        nodes: [
          `${conn.from?.component}:${conn.from?.pin}`,
          `${conn.to?.component}:${conn.to?.pin}`
        ]
      });
    });

    return netlist;
  }

  /**
   * Interactive design session
   */
  async startDesignSession(userRequirements) {
    console.log('🤖 AI PCB Design Assistant Started\n');
    
    // Step 1: Analyze requirements
    console.log('📋 Analyzing your requirements...\n');
    const analysis = await this.analyzeRequirements(userRequirements);
    
    console.log('✅ Understanding:', analysis.understanding);
    console.log('\n💡 Suggested Components:', analysis.suggested_components);
    console.log('\n🏗️  Design Approach:', analysis.design_approach);
    console.log('\n❓ Questions for you:', analysis.questions);
    
    return {
      session_id: Date.now(),
      requirements: userRequirements,
      analysis: analysis,
      next_step: 'Answer clarifying questions and proceed to component selection'
    };
  }
}

// Export
export { AIDesignAssistant };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const assistant = new AIDesignAssistant();
  
  // Example usage
  const userInput = process.argv[2] || 
    'I need a board with 10 IR receivers and 10 IR LEDs controlled by a microcontroller';
  
  console.log('User Request:', userInput);
  console.log('\n' + '='.repeat(80) + '\n');
  
  assistant.startDesignSession(userInput).then(session => {
    console.log('\n' + '='.repeat(80));
    console.log('\n📝 Session Summary:');
    console.log(`Session ID: ${session.session_id}`);
    console.log(`\nNext: ${session.next_step}`);
  });
}
