/**
 * AI Training Data Generator for PCB Design
 * Converts PCB JSON into labeled training examples with electronics knowledge
 */

import fs from 'fs';
import path from 'path';

class PCBTrainingDataGenerator {
  constructor() {
    this.trainingExamples = [];
    this.electronicsKnowledge = this.buildElectronicsKnowledge();
  }

  /**
   * Electronics fundamentals and rules knowledge base
   */
  buildElectronicsKnowledge() {
    return {
      components: {
        'Raspberry Pi Pico': {
          type: 'Microcontroller',
          voltage: { operating: '3.3V', input: '5V via USB' },
          gpioVoltage: '3.3V',
          maxCurrent: '300mA per GPIO',
          totalGPIO: 26,
          knowledge: 'GPIO pins are 3.3V logic. Need level shifters for 5V devices.',
          bestPractices: [
            'Add 0.1µF decoupling capacitor near each power pin',
            'Use 10kΩ pull-up/pull-down resistors on unused pins',
            'Protect GPIO with 220-330Ω series resistor for LEDs',
            'Maximum 16mA per GPIO pin'
          ]
        },
        'TSOP4838': {
          type: 'IR Receiver',
          voltage: { operating: '2.5V-5.5V' },
          current: { typical: '0.4mA', max: '1.5mA' },
          outputType: 'Active Low (inverted)',
          frequency: '38kHz',
          knowledge: 'Output is active LOW when IR detected. Needs decoupling.',
          bestPractices: [
            'Place 0.1µF ceramic capacitor close to VCC pin',
            'Keep away from IR LEDs to prevent interference',
            'Shield from ambient light if possible',
            'Output can directly connect to 3.3V GPIO'
          ]
        },
        '74HC595': {
          type: 'Shift Register',
          voltage: { operating: '2V-6V' },
          current: { max: '70mA per output' },
          outputs: 8,
          cascadable: true,
          knowledge: '8-bit serial-to-parallel shift register with output latches',
          bestPractices: [
            'Add 0.1µF decoupling capacitor between VCC and GND',
            'Use 220-470Ω resistors on MOSFET gate connections',
            'Can cascade multiple 74HC595 using QH\' pin',
            'OE pin should be LOW for active outputs (pull to GND via 10kΩ)',
            'Maximum clock frequency: 25MHz @ 5V'
          ]
        },
        'N-Channel MOSFET': {
          type: 'Transistor',
          common: ['2N7000', 'BS170', 'IRLZ44N'],
          voltage: { gateThreshold: '2-4V', drainsource: 'varies' },
          knowledge: 'Used for switching high-current loads',
          bestPractices: [
            'Add 220-470Ω gate resistor to limit current',
            'Add 10kΩ pull-down resistor from gate to ground',
            'Use flyback diode for inductive loads',
            'Ensure Vgs > threshold voltage for full saturation',
            'Check Rds(on) for power dissipation calculation'
          ]
        },
        'TSAL6400': {
          type: 'IR LED',
          voltage: { forward: '1.35V typical, 1.6V max' },
          current: { continuous: '100mA', peak: '1A (pulsed)' },
          wavelength: '940nm',
          knowledge: 'High-power infrared LED for remote control applications',
          bestPractices: [
            'Use current-limiting resistor: R = (Vsupply - 1.35V) / I_desired',
            'For 100mA @ 5V: R = (5 - 1.35) / 0.1 = 36.5Ω (use 39Ω)',
            'Use MOSFET for switching (not direct from GPIO)',
            'Add heatsink if running continuous > 50mA',
            'Pulse at high current (500mA) with low duty cycle for better range'
          ]
        }
      },

      designRules: {
        power: {
          description: 'Power distribution and regulation rules',
          rules: [
            'Always use common ground for all PCBs in system',
            'Add bulk capacitor (10µF-100µF) at power input',
            'Add 0.1µF ceramic capacitor near each IC',
            'Calculate total current draw to size power supply',
            'Use wider traces for power (>20mil for 500mA+)',
            'Add reverse polarity protection diode at input',
            'Consider TVS diode for industrial applications',
            'Separate analog and digital ground with single connection point'
          ]
        },
        
        signals: {
          description: 'Signal routing and integrity',
          rules: [
            'Keep high-speed signals short and direct',
            'Avoid 90-degree turns, use 45-degree bends',
            'Keep clock and data lines away from noisy signals',
            'Add series termination resistor (22-33Ω) for long traces',
            'Use differential pairs for critical signals',
            'Shield sensitive signals with ground plane',
            'Minimum 8mil trace width for signals',
            'Keep parallel signal traces spaced 3x trace width apart'
          ]
        },

        thermal: {
          description: 'Heat management',
          rules: [
            'Calculate power dissipation: P = I² × R',
            'Add thermal vias under hot components',
            'Ensure adequate copper area for heat spreading',
            'Leave space around components for airflow',
            'Consider heatsink for >1W dissipation',
            'Use thermal relief on ground pours for easier soldering',
            'Keep temperature-sensitive components away from heat sources'
          ]
        },

        emc: {
          description: 'Electromagnetic compatibility',
          rules: [
            'Use ground plane to reduce EMI',
            'Add ferrite bead on power input',
            'Route return current paths carefully',
            'Keep high-frequency circuits away from connectors',
            'Add filtering capacitors on all I/O lines',
            'Use shielded cables for off-board signals',
            'Follow 20-H rule for PCB stackup'
          ]
        }
      },

      calculations: {
        ledCurrentLimiting: {
          formula: 'R = (Vsupply - Vled) / I_desired',
          example: 'For 5V supply, 1.35V IR LED, 100mA: R = (5-1.35)/0.1 = 36.5Ω',
          units: 'Voltage in Volts, Current in Amps, Resistance in Ohms'
        },
        
        powerDissipation: {
          formula: 'P = V × I = I² × R = V² / R',
          example: 'MOSFET with 0.5A, Rds(on) 0.1Ω: P = 0.5² × 0.1 = 0.025W (25mW)',
          units: 'Power in Watts'
        },

        decouplingCapacitor: {
          formula: 'C = I × dt / dV',
          typical: '0.1µF ceramic for each IC, 10-100µF bulk at input',
          placement: 'Within 10mm of IC power pins'
        },

        traceWidth: {
          formula: 'Use PCB trace width calculator',
          general: '8mil for signals, 20mil for 500mA, 50mil for 1A',
          external: 'External layers can carry more current than internal'
        }
      }
    };
  }

  /**
   * Analyze a PCB design and generate training examples
   */
  analyzePCBDesign(pcbData) {
    const analysis = {
      design: pcbData.metadata.title,
      timestamp: new Date().toISOString(),
      components: this.analyzeComponents(pcbData.components),
      connections: this.analyzeConnections(pcbData.connections),
      validation: this.validateDesign(pcbData),
      suggestions: this.generateSuggestions(pcbData),
      calculations: this.performCalculations(pcbData)
    };

    return analysis;
  }

  /**
   * Analyze components and add knowledge
   */
  analyzeComponents(components) {
    return components.map(comp => {
      const knowledge = this.electronicsKnowledge.components[comp.model] || {};
      
      return {
        component: comp,
        electronics_knowledge: knowledge,
        function: this.describeComponentFunction(comp),
        requirements: this.getComponentRequirements(comp, knowledge)
      };
    });
  }

  /**
   * Describe what each component does
   */
  describeComponentFunction(comp) {
    const functions = {
      'MCU': `Microcontroller - Controls the entire system. Reads ${comp.name} inputs and generates outputs.`,
      'IR_RECEIVER': `IR Receiver - Detects infrared signals at 38kHz and outputs active-low signal to GPIO.`,
      'SHIFT_REGISTER': `Shift Register - Converts serial data to parallel outputs for controlling multiple devices.`,
      'MOSFET': `MOSFET Switch - Acts as electronic switch to control high-current IR LED.`,
      'IR_LED': `Infrared LED - Emits 940nm IR light for remote control transmission.`
    };

    return functions[comp.type] || `Unknown component type: ${comp.type}`;
  }

  /**
   * Get component requirements
   */
  getComponentRequirements(comp, knowledge) {
    if (!knowledge.bestPractices) return [];
    
    return {
      voltage: knowledge.voltage,
      current: knowledge.current,
      best_practices: knowledge.bestPractices,
      required_components: this.getRequiredPassives(comp.type)
    };
  }

  /**
   * Get required passive components
   */
  getRequiredPassives(componentType) {
    const passives = {
      'MCU': [
        { type: 'capacitor', value: '0.1µF', placement: 'Near each VCC pin', purpose: 'Decoupling' },
        { type: 'capacitor', value: '10µF', placement: 'At power input', purpose: 'Bulk filtering' }
      ],
      'IR_RECEIVER': [
        { type: 'capacitor', value: '0.1µF', placement: 'VCC to GND, close to IC', purpose: 'Noise filtering' }
      ],
      'SHIFT_REGISTER': [
        { type: 'capacitor', value: '0.1µF', placement: 'VCC to GND', purpose: 'Decoupling' },
        { type: 'resistor', value: '220-470Ω', placement: 'On each output to MOSFET gate', purpose: 'Current limiting' }
      ],
      'MOSFET': [
        { type: 'resistor', value: '220-470Ω', placement: 'Gate to driver', purpose: 'Gate current limiting' },
        { type: 'resistor', value: '10kΩ', placement: 'Gate to ground', purpose: 'Pull-down to prevent floating' }
      ],
      'IR_LED': [
        { type: 'resistor', value: '39Ω (for 100mA)', placement: 'Series with LED', purpose: 'Current limiting', calculation: 'R = (5V - 1.35V) / 0.1A = 36.5Ω → use 39Ω' }
      ]
    };

    return passives[componentType] || [];
  }

  /**
   * Analyze connections
   */
  analyzeConnections(connections) {
    return connections.map(conn => ({
      connection: conn,
      signal_type: this.identifySignalType(conn),
      voltage_level: this.getSignalVoltage(conn),
      validation: this.validateConnection(conn),
      recommendations: this.getConnectionRecommendations(conn)
    }));
  }

  /**
   * Identify signal type
   */
  identifySignalType(connection) {
    if (connection.type === 'CONTROL_SIGNAL') return 'Digital Control';
    if (connection.signal) {
      if (['DATA', 'CLOCK', 'LATCH'].includes(connection.signal)) return 'SPI-like Digital';
      if (connection.signal === 'OE') return 'Output Enable (Active Low)';
    }
    if (connection.to?.pin === 'Gate') return 'MOSFET Gate Drive';
    if (connection.from?.pin === 'OUT') return 'Sensor Output';
    return 'General Signal';
  }

  /**
   * Get signal voltage level
   */
  getSignalVoltage(connection) {
    if (connection.from?.component?.includes('Pico')) return '3.3V Logic';
    if (connection.from?.component === '74HC595') return '5V Logic (HC family)';
    return 'Verify voltage level';
  }

  /**
   * Validate connection
   */
  validateConnection(connection) {
    const issues = [];
    const warnings = [];

    // Check voltage compatibility
    if (connection.from?.component?.includes('Pico') && connection.to?.component === '74HC595') {
      warnings.push('3.3V GPIO to 5V IC - Ensure 74HC595 runs at 3.3V or use level shifter');
    }

    // Check for missing current limiting
    if (connection.to?.pin === 'Gate' && !connection.hasGateResistor) {
      issues.push('Add 220-470Ω series resistor on MOSFET gate');
    }

    return { issues, warnings };
  }

  /**
   * Get connection recommendations
   */
  getConnectionRecommendations(connection) {
    const recs = [];

    if (connection.signal === 'CLOCK') {
      recs.push('Keep clock trace short (<6 inches)');
      recs.push('Route away from noisy signals');
      recs.push('Consider 22Ω series resistor for termination');
    }

    if (connection.signal === 'DATA') {
      recs.push('Keep parallel to clock with matched lengths');
      recs.push('Avoid vias if possible');
    }

    if (connection.to?.pin === 'Gate') {
      recs.push('Add 220-470Ω series resistor');
      recs.push('Add 10kΩ pull-down resistor gate-to-ground');
      recs.push('Keep gate trace short to prevent ringing');
    }

    return recs;
  }

  /**
   * Validate entire design
   */
  validateDesign(pcbData) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Check for decoupling capacitors
    const hasDecoupling = pcbData.components.some(c => c.type === 'CAPACITOR');
    if (!hasDecoupling) {
      validation.errors.push('Missing decoupling capacitors - Add 0.1µF near each IC');
      validation.score -= 20;
    }

    // Check for power filtering
    const hasBulkCap = pcbData.components.some(c => c.value === '10µF' || c.value === '100µF');
    if (!hasBulkCap) {
      validation.warnings.push('Consider adding 10-100µF bulk capacitor at power input');
      validation.score -= 5;
    }

    // Check for MOSFET gate resistors
    const mosfets = pcbData.components.filter(c => c.type === 'MOSFET');
    if (mosfets.length > 0) {
      validation.warnings.push('Ensure each MOSFET has gate resistor (220-470Ω) and pull-down (10kΩ)');
    }

    // Check for LED current limiting
    const leds = pcbData.components.filter(c => c.type === 'IR_LED');
    if (leds.length > 0) {
      validation.warnings.push('Calculate and add current-limiting resistors for each IR LED');
    }

    validation.status = validation.errors.length === 0 ? 'PASS' : 'FAIL';
    
    return validation;
  }

  /**
   * Generate improvement suggestions
   */
  generateSuggestions(pcbData) {
    return [
      {
        category: 'Power',
        suggestions: [
          'Add reverse polarity protection diode at power input',
          'Use TVS diode for ESD protection',
          'Add LED power indicator with 1kΩ resistor',
          'Consider adding test points for VCC and GND'
        ]
      },
      {
        category: 'Signal Integrity',
        suggestions: [
          'Keep SPI signals (DATA, CLOCK, LATCH) close together',
          'Use ground plane under signal traces',
          'Add series termination on long traces (>6 inches)',
          'Keep IR receivers away from IR LEDs'
        ]
      },
      {
        category: 'Testing & Debug',
        suggestions: [
          'Add test points for each GPIO connection',
          'Include LED indicators for shift register outputs',
          'Add jumpers for easy debugging',
          'Label all connectors on silkscreen'
        ]
      },
      {
        category: 'Manufacturing',
        suggestions: [
          'Add mounting holes (3.2mm for M3 screws)',
          'Keep components >5mm from board edge',
          'Add fiducial marks for automated assembly',
          'Include version number on silkscreen'
        ]
      }
    ];
  }

  /**
   * Perform electrical calculations
   */
  performCalculations(pcbData) {
    const calcs = {};

    // IR LED current limiting resistor
    const leds = pcbData.components.filter(c => c.type === 'IR_LED');
    if (leds.length > 0) {
      const Vsupply = 5.0;
      const Vled = 1.35;
      const Iled = 0.1; // 100mA
      const R = (Vsupply - Vled) / Iled;
      const Pres = Math.pow(Iled, 2) * R;

      calcs.led_resistor = {
        description: 'IR LED current limiting resistor',
        formula: 'R = (Vsupply - Vled) / I_desired',
        calculation: `R = (${Vsupply}V - ${Vled}V) / ${Iled}A = ${R.toFixed(2)}Ω`,
        standard_value: '39Ω (nearest E12 series)',
        power_rating: `${Pres.toFixed(3)}W (use ${Pres > 0.125 ? '0.25W' : '0.125W 1/8W'} resistor)`,
        actual_current: ((Vsupply - Vled) / 39 * 1000).toFixed(1) + 'mA'
      };
    }

    // Total current draw
    const irReceiverCount = pcbData.components.filter(c => c.type === 'IR_RECEIVER').length;
    const irLedCount = leds.length;
    const icCount = pcbData.components.filter(c => c.type === 'MCU' || c.type === 'SHIFT_REGISTER').length;

    const totalCurrent = (irReceiverCount * 0.4) + (irLedCount * 100) + (icCount * 20);
    
    calcs.power_budget = {
      description: 'Total system current draw',
      breakdown: {
        ir_receivers: `${irReceiverCount} × 0.4mA = ${(irReceiverCount * 0.4).toFixed(1)}mA`,
        ir_leds: `${irLedCount} × 100mA = ${irLedCount * 100}mA`,
        ics: `${icCount} × 20mA = ${icCount * 20}mA`
      },
      total: `${totalCurrent.toFixed(1)}mA`,
      recommended_supply: totalCurrent > 500 ? '1A or higher' : '500mA',
      power: `${(totalCurrent * 5 / 1000).toFixed(2)}W at 5V`
    };

    // Trace width for power
    calcs.trace_width = {
      description: 'Minimum trace width for current',
      current: `${totalCurrent.toFixed(0)}mA`,
      recommendation: totalCurrent > 500 ? 'Use 30-50mil traces for power' : 'Use 20mil traces for power',
      signal_traces: '8-10mil for digital signals'
    };

    return calcs;
  }

  /**
   * Generate training example in Q&A format
   */
  generateTrainingExample(pcbData, analysis) {
    return {
      instruction: `Design a PCB for: ${pcbData.metadata.title}`,
      
      input: {
        requirements: this.extractRequirements(pcbData),
        constraints: {
          voltage: '5V power supply',
          components_available: analysis.components.map(c => c.component.model)
        }
      },

      output: {
        design_analysis: analysis,
        
        step_by_step_approach: [
          {
            step: 1,
            title: 'Component Selection',
            content: 'Choose appropriate components based on requirements',
            details: analysis.components.map(c => ({
              component: c.component.model,
              reason: c.function,
              knowledge: c.electronics_knowledge.knowledge
            }))
          },
          {
            step: 2,
            title: 'Calculate Passive Components',
            content: 'Determine resistor and capacitor values',
            details: analysis.calculations
          },
          {
            step: 3,
            title: 'Validate Connections',
            content: 'Check voltage levels and current capacity',
            details: analysis.connections.map(c => c.validation)
          },
          {
            step: 4,
            title: 'Apply Best Practices',
            content: 'Add decoupling, protection, and filtering',
            details: analysis.suggestions
          },
          {
            step: 5,
            title: 'Design Validation',
            content: 'Review design for errors and improvements',
            details: analysis.validation
          }
        ],

        easyeda_schematic_plan: {
          placement: 'Organize components in logical groups',
          routing: 'Route power first, then signals',
          ground_plane: 'Use polygon pour for ground',
          silkscreen: 'Label all components and test points'
        }
      },

      electronics_principles: {
        relevant_concepts: this.getRelevantConcepts(pcbData),
        physics: this.getPhysicsPrinciples(pcbData),
        design_rules: this.electronicsKnowledge.designRules
      }
    };
  }

  /**
   * Extract requirements from PCB data
   */
  extractRequirements(pcbData) {
    const irReceivers = pcbData.components.filter(c => c.type === 'IR_RECEIVER');
    const irLeds = pcbData.components.filter(c => c.type === 'IR_LED');

    return [
      `Read ${irReceivers.length} IR receivers`,
      `Control ${irLeds.length} IR LEDs`,
      `Use microcontroller for processing`,
      `Interface between two PCBs`,
      `5V power supply`
    ];
  }

  /**
   * Get relevant electronics concepts
   */
  getRelevantConcepts(pcbData) {
    return [
      {
        concept: 'Digital Logic Levels',
        explanation: '3.3V and 5V logic compatibility. Ensure voltage levels match or use level shifters.',
        application: 'Raspberry Pi Pico (3.3V) interfacing with 74HC595 (can run 2-6V)'
      },
      {
        concept: 'Current Limiting',
        explanation: 'LEDs need current-limiting resistors. Calculate using Ohm\'s Law: R = (Vsupply - Vled) / I',
        application: 'IR LEDs running at 100mA need 39Ω resistor from 5V supply'
      },
      {
        concept: 'Decoupling Capacitors',
        explanation: 'Filter noise on power supply. Place 0.1µF ceramic cap near each IC.',
        application: 'Prevents voltage droops during switching, improves signal integrity'
      },
      {
        concept: 'MOSFET Switching',
        explanation: 'MOSFETs act as electronic switches. Gate voltage controls drain-source conduction.',
        application: 'Switch high-current IR LEDs without overloading GPIO pins'
      },
      {
        concept: 'Shift Registers',
        explanation: 'Convert serial data to parallel outputs. Expand limited GPIO pins.',
        application: '74HC595 provides 8 outputs using only 3 control pins'
      }
    ];
  }

  /**
   * Get relevant physics principles
   */
  getPhysicsPrinciples(pcbData) {
    return [
      {
        principle: 'Ohm\'s Law',
        formula: 'V = I × R',
        application: 'Calculate resistor values for current limiting',
        example: 'For 100mA through LED: R = (5V - 1.35V) / 0.1A = 36.5Ω'
      },
      {
        principle: 'Power Dissipation',
        formula: 'P = V × I = I² × R',
        application: 'Determine component power ratings and heat generation',
        example: 'Resistor: P = 0.1² × 39 = 0.39W (use 0.5W resistor)'
      },
      {
        principle: 'Capacitor Charge/Discharge',
        formula: 'Q = C × V, τ = R × C',
        application: 'Filter power supply noise and smooth voltage',
        example: '0.1µF cap filters high-frequency noise, 100µF handles load transients'
      },
      {
        principle: 'Electromagnetic Induction',
        formula: 'V = -L × dI/dt',
        application: 'Inductive loads need flyback diodes',
        example: 'Not applicable for LEDs, but critical for motors/relays'
      },
      {
        principle: 'Signal Integrity',
        formula: 'Z₀ = √(L/C), tr < 2×td',
        application: 'Transmission line effects on high-speed signals',
        example: 'SPI signals at 25MHz need controlled impedance traces'
      }
    ];
  }

  /**
   * Main export function - Generate complete training dataset
   */
  generateTrainingDataset(pcbJsonFiles) {
    const dataset = {
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        description: 'PCB Design Training Data with Electronics Knowledge',
        total_examples: 0
      },
      electronics_knowledge: this.electronicsKnowledge,
      training_examples: []
    };

    pcbJsonFiles.forEach(file => {
      const pcbData = JSON.parse(fs.readFileSync(file, 'utf8'));
      const analysis = this.analyzePCBDesign(pcbData);
      const trainingExample = this.generateTrainingExample(pcbData, analysis);
      
      dataset.training_examples.push(trainingExample);
    });

    dataset.metadata.total_examples = dataset.training_examples.length;

    return dataset;
  }
}

// Export for use as module
export { PCBTrainingDataGenerator };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = path.join(process.cwd(), '..', 'output');
  const aiTrainingDir = path.join(process.cwd(), 'ai-training-data');
  
  if (!fs.existsSync(aiTrainingDir)) {
    fs.mkdirSync(aiTrainingDir, { recursive: true });
  }

  // Get all JSON files from output directory
  const jsonFiles = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.json') && f !== 'latest.json')
    .map(f => path.join(outputDir, f));

  if (jsonFiles.length === 0) {
    console.log('No PCB JSON files found. Run parser first!');
    process.exit(1);
  }

  const generator = new PCBTrainingDataGenerator();
  const trainingData = generator.generateTrainingDataset(jsonFiles);

  // Save complete training dataset
  const outputFile = path.join(aiTrainingDir, `training-data_${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(trainingData, null, 2));

  // Also save in formats for different AI models
  
  // Format for LLaMA/Alpaca fine-tuning
  const alpacaFormat = trainingData.training_examples.map(ex => ({
    instruction: ex.instruction,
    input: JSON.stringify(ex.input),
    output: JSON.stringify(ex.output)
  }));
  fs.writeFileSync(
    path.join(aiTrainingDir, `alpaca-format_${Date.now()}.json`),
    JSON.stringify(alpacaFormat, null, 2)
  );

  // Format for ChatML (GPT-style)
  const chatmlFormat = trainingData.training_examples.map(ex => ({
    messages: [
      { role: 'system', content: 'You are an electronics engineer expert in PCB design.' },
      { role: 'user', content: `${ex.instruction}\n\nRequirements: ${JSON.stringify(ex.input)}` },
      { role: 'assistant', content: JSON.stringify(ex.output, null, 2) }
    ]
  }));
  fs.writeFileSync(
    path.join(aiTrainingDir, `chatml-format_${Date.now()}.json`),
    JSON.stringify(chatmlFormat, null, 2)
  );

  console.log('✅ AI Training data generated!');
  console.log(`📊 Total examples: ${trainingData.metadata.total_examples}`);
  console.log(`📁 Output directory: ${aiTrainingDir}`);
  console.log(`\nFiles created:`);
  console.log(`  - training-data_*.json (complete dataset with knowledge base)`);
  console.log(`  - alpaca-format_*.json (for LLaMA/Alpaca fine-tuning)`);
  console.log(`  - chatml-format_*.json (for ChatGPT-style models)`);
}
