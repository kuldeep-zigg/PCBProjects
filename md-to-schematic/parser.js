/**
 * Markdown PCB Specification Parser
 * Parses PCB1.md and extracts component and connection data
 */

import fs from 'fs';
import path from 'path';

class PCBSpecParser {
  constructor(mdContent) {
    this.content = mdContent;
    this.components = [];
    this.connections = [];
    this.metadata = {};
  }

  /**
   * Parse markdown tables into structured data
   */
  parseTable(tableText) {
    const lines = tableText.trim().split('\n');
    if (lines.length < 3) return null;

    // Extract headers
    const headers = lines[0].split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Parse data rows (skip separator line)
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (cells.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = cells[idx];
        });
        rows.push(row);
      }
    }
    return { headers, rows };
  }

  /**
   * Extract IR Receiver components and their GPIO connections
   */
  parseIRReceivers() {
    const irSection = this.content.match(/## PCB A — IR Receiver GPIO Mapping([\s\S]*?)---/);
    if (!irSection) return;

    const tableMatch = irSection[1].match(/\|[\s\S]*?\|[\s\S]*?\|/);
    if (!tableMatch) return;

    const table = this.parseTable(tableMatch[0]);
    if (!table) return;

    table.rows.forEach(row => {
      this.components.push({
        type: 'IR_RECEIVER',
        model: 'TSOP4838',
        name: row['IR Receiver'] || row['IR Receiver'],
        pins: {
          VCC: row['VCC'],
          GND: row['GND'],
          OUT: row['GPIO Pin']
        },
        mcuPin: row['MCU Pin Name']
      });

      // Add connection data
      this.connections.push({
        from: { component: row['IR Receiver'], pin: 'OUT' },
        to: { component: 'Raspberry Pi Pico', pin: row['MCU Pin Name'] }
      });
    });
  }

  /**
   * Extract shift register control signals
   */
  parseShiftRegisterInterface() {
    const srSection = this.content.match(/## PCB A → PCB B Control Signals[\s\S]*?\|([\s\S]*?)---/);
    if (!srSection) return;

    const table = this.parseTable(srSection[0]);
    if (!table) return;

    table.rows.forEach(row => {
      this.connections.push({
        type: 'CONTROL_SIGNAL',
        signal: row['Signal Name'],
        from: { component: 'Raspberry Pi Pico', pin: row['PCB A GPIO'] },
        to: { component: '74HC595', pin: row['74HC595 Pin'] },
        description: row['Description']
      });
    });
  }

  /**
   * Extract MOSFET and LED mapping
   */
  parseMOSFETMapping() {
    const mosfetSection = this.content.match(/## PCB B — Shift Register to MOSFET Mapping[\s\S]*?\|([\s\S]*?)---/);
    if (!mosfetSection) return;

    const table = this.parseTable(mosfetSection[0]);
    if (!table) return;

    table.rows.forEach((row, idx) => {
      // Add MOSFET component
      this.components.push({
        type: 'MOSFET',
        name: `Q${idx + 1}`,
        function: row['Function']
      });

      // Add IR LED component
      this.components.push({
        type: 'IR_LED',
        model: 'TSAL6400',
        name: row['IR LED'],
        channel: idx + 1
      });

      // Add connections
      this.connections.push({
        from: { component: '74HC595', pin: row['Shift Register Output'] },
        to: { component: `Q${idx + 1}`, pin: 'Gate' }
      });

      this.connections.push({
        from: { component: `Q${idx + 1}`, pin: 'Drain' },
        to: { component: row['IR LED'], pin: 'Cathode' }
      });
    });
  }

  /**
   * Main parsing function
   */
  parse() {
    // Extract metadata
    const titleMatch = this.content.match(/# (.*)/);
    if (titleMatch) {
      this.metadata.title = titleMatch[1];
    }

    // Parse all sections
    this.parseIRReceivers();
    this.parseShiftRegisterInterface();
    this.parseMOSFETMapping();

    // Add main components
    this.components.push(
      { type: 'MCU', model: 'Raspberry Pi Pico', name: 'U1', board: 'PCB A' },
      { type: 'SHIFT_REGISTER', model: '74HC595', name: 'U2', board: 'PCB B' }
    );

    return {
      metadata: this.metadata,
      components: this.components,
      connections: this.connections
    };
  }

  /**
   * Export parsed data as JSON
   */
  toJSON() {
    const data = this.parse();
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Generate IST timestamp for filename
 */
function getISTTimestamp() {
  const now = new Date();
  
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generate unique filename with prefix and IST timestamp
 */
function generateFilename(prefix = 'pcb-data') {
  const timestamp = getISTTimestamp();
  return `${prefix}_${timestamp}.json`;
}

// Main execution
const mdFilePath = path.join(process.cwd(), '..', 'PCB1.md');
const mdContent = fs.readFileSync(mdFilePath, 'utf8');

const parser = new PCBSpecParser(mdContent);
const result = parser.parse();

// Get prefix from command line args or use default
const prefix = process.argv[2] || 'pcb-data';

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate unique filename with IST timestamp
const filename = generateFilename(prefix);
const outputPath = path.join(outputDir, filename);

// Save parsed data
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

// Also save a "latest" version for convenience
const latestPath = path.join(outputDir, 'latest.json');
fs.writeFileSync(latestPath, JSON.stringify(result, null, 2));

console.log('✅ Parsed PCB specification successfully!');
console.log(`📊 Components found: ${result.components.length}`);
console.log(`🔌 Connections found: ${result.connections.length}`);
console.log(`📁 Output saved to: ${outputPath}`);
console.log(`🔗 Latest copy: ${latestPath}`);
console.log(`⏰ Timestamp: ${getISTTimestamp()} IST`);
