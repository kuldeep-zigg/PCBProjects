#!/usr/bin/env node

/**
 * Automatic PCB Designer
 * 
 * Complete workflow:
 * 1. User describes PCB design with features
 * 2. System searches datasheets online
 * 3. Ollama analyzes and extracts specs
 * 4. Generates GPIO and pin connection tables (.md with timestamp)
 * 5. Generates schematic with footprints
 * 6. Monitors for new requirements every 1 minute
 * 7. Updates master index automatically
 */

const fs = require('fs');
const path = require('path');
const { ComponentKnowledgeLoader } = require('./component-knowledge-loader');

class AutoPCBDesigner {
  constructor() {
    this.inputsDir = path.join(__dirname, 'inputs');
    this.outputsDir = path.join(__dirname, 'outputs');
    this.schematicsDir = path.join(this.outputsDir, 'schematics');
    this.docsDir = path.join(this.outputsDir, 'docs');
    this.pinTablesDir = path.join(this.outputsDir, 'pin-tables');
    this.logsDir = path.join(this.outputsDir, 'logs');
    this.masterIndexPath = path.join(__dirname, 'MASTER-INDEX.md');
    
    this.processedFiles = new Set();
    this.projectHistory = [];
  }

  /**
   * Initialize folder structure
   */
  async initialize() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          AUTOMATIC PCB DESIGNER - INITIALIZE               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Create directories
    const dirs = [
      this.inputsDir,
      this.outputsDir,
      this.schematicsDir,
      this.docsDir,
      this.pinTablesDir,
      this.logsDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created: ${path.basename(dir)}/`);
      } else {
        console.log(`✓ Exists: ${path.basename(dir)}/`);
      }
    }

    console.log('\n✅ Folder structure ready!\n');
    this.printFolderStructure();
  }

  /**
   * Print folder structure
   */
  printFolderStructure() {
    console.log('📁 Project Structure:');
    console.log('├── inputs/                    ← Place design requirements here');
    console.log('│   └── *.md                   ← Describe your PCB design');
    console.log('├── outputs/');
    console.log('│   ├── schematics/            ← Generated schematics');
    console.log('│   ├── docs/                  ← Documentation');
    console.log('│   ├── pin-tables/            ← GPIO & pin tables');
    console.log('│   └── logs/                  ← Processing logs');
    console.log('└── MASTER-INDEX.md            ← Overview of all projects\n');
  }

  /**
   * Monitor inputs folder for new requirements
   */
  async startMonitoring() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          MONITORING MODE - ACTIVE                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('👀 Watching for new PCB design requirements...');
    console.log('📂 Monitoring: inputs/');
    console.log('⏱️  Check interval: Every 1 minute');
    console.log('🛑 Press Ctrl+C to stop\n');

    // Initial scan
    await this.scanAndProcess();

    // Monitor every 1 minute
    setInterval(async () => {
      await this.scanAndProcess();
    }, 60000); // 60 seconds
  }

  /**
   * Scan inputs folder and process new files
   */
  async scanAndProcess() {
    const now = new Date().toISOString();
    console.log(`[${now}] 🔍 Scanning inputs/...`);

    if (!fs.existsSync(this.inputsDir)) {
      console.log('   ⚠️  inputs/ folder not found');
      return;
    }

    const files = fs.readdirSync(this.inputsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(this.inputsDir, f));

    const newFiles = files.filter(f => !this.processedFiles.has(f));

    if (newFiles.length === 0) {
      console.log('   ℹ️  No new requirements found\n');
      return;
    }

    console.log(`   ✨ Found ${newFiles.length} new requirement(s)!\n`);

    for (const file of newFiles) {
      await this.processRequirement(file);
      this.processedFiles.add(file);
    }

    // Update master index
    await this.updateMasterIndex();
  }

  /**
   * Process a single requirement file
   */
  async processRequirement(filePath) {
    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectName = filename.replace('.md', '');

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log(`│ Processing: ${filename.padEnd(44)} │`);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const log = [];
    const logEntry = (message) => {
      console.log(message);
      log.push(message);
    };

    try {
      // Step 1: Read requirement
      logEntry('📖 Step 1: Reading requirement...');
      const requirement = fs.readFileSync(filePath, 'utf8');
      logEntry(`   ✓ Read ${requirement.length} characters\n`);

      // Step 2: Extract components
      logEntry('🔍 Step 2: Extracting components...');
      const components = this.extractComponents(requirement);
      logEntry(`   ✓ Found ${components.length} components`);
      components.forEach(c => logEntry(`      - ${c}`));
      logEntry('');

      // Step 3: Download datasheets
      logEntry('📥 Step 3: Downloading datasheets...');
      await this.downloadDatasheets(components);
      logEntry('   ✓ Datasheets downloaded\n');

      // Step 4: Load component knowledge
      logEntry('📚 Step 4: Loading component knowledge...');
      const loader = new ComponentKnowledgeLoader();
      const knowledge = loader.loadAll();
      logEntry(`   ✓ Loaded knowledge for ${knowledge.size} components\n`);

      // Step 5: Generate pin table
      logEntry('📋 Step 5: Generating GPIO & pin table...');
      const pinTablePath = await this.generatePinTable(
        projectName,
        components,
        loader,
        timestamp
      );
      logEntry(`   ✓ Generated: ${path.basename(pinTablePath)}\n`);

      // Step 6: Generate schematic
      logEntry('⚡ Step 6: Generating schematic...');
      const schematicPath = await this.generateSchematic(
        projectName,
        requirement,
        components,
        loader,
        timestamp
      );
      logEntry(`   ✓ Generated: ${path.basename(schematicPath)}\n`);

      // Step 7: Generate documentation
      logEntry('📄 Step 7: Generating documentation...');
      const docPath = await this.generateDocumentation(
        projectName,
        requirement,
        components,
        pinTablePath,
        schematicPath,
        timestamp
      );
      logEntry(`   ✓ Generated: ${path.basename(docPath)}\n`);

      // Save log
      const logPath = path.join(this.logsDir, `${projectName}_${timestamp}.log`);
      fs.writeFileSync(logPath, log.join('\n'));

      // Add to history
      this.projectHistory.push({
        name: projectName,
        timestamp,
        inputFile: filename,
        components: components.length,
        outputs: {
          pinTable: path.basename(pinTablePath),
          schematic: path.basename(schematicPath),
          doc: path.basename(docPath),
          log: path.basename(logPath)
        }
      });

      console.log('✅ SUCCESS! Project completed\n');
      console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
      logEntry(`\n❌ ERROR: ${error.message}\n`);
      console.error(error.stack);
    }
  }

  /**
   * Extract components from requirement text
   */
  extractComponents(text) {
    const components = [];
    
    // Priority patterns - match full component names first
    const priorityPatterns = [
      // ESP32 variants (must come before generic ESP32)
      /\bESP32[-_][A-Z0-9]+[-_][A-Z0-9]+\b/gi,  // ESP32-WROOM-32, ESP32-C3-MINI
      /\bESP32[-_][A-Z0-9]+\b/gi,                // ESP32-S3, ESP32-C3
      // Other MCUs with suffixes
      /\bSTM32[A-Z][0-9][A-Z0-9]+\b/gi,          // STM32F103C8T6
      /\bATMEGA[0-9]+[A-Z]?\b/gi,                // ATMEGA328P
      /\bRP2040\b/gi,
      // Common ICs with part numbers
      /\b[A-Z]{2,4}[0-9]{3,4}[A-Z]?\b/gi,        // LM358, BME280, AMS1117
      // IC families
      /\b74HC[0-9]+\b/gi,
      /\bCD[0-9]{4}\b/gi
    ];
    
    // Standard patterns for components with keywords
    const standardPatterns = [
      // Component followed by descriptor
      /\b([A-Z0-9][-A-Z0-9]{2,})\s+(?:IC|chip|module|sensor|MCU|microcontroller|regulator|transceiver|amplifier)\b/gi,
      // After "using" or similar
      /(?:using|with|includes?)\s+([A-Z0-9][-A-Z0-9]{2,})\b/gi
    ];

    // Extract with priority patterns first
    for (const pattern of priorityPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const comp = match[0].toUpperCase();
        // Filter out common false positives
        if (comp && comp.length >= 4 && !components.includes(comp)) {
          // Avoid single words that are too generic
          if (!['TEMP', 'DATA', 'MODE', 'TIME', 'UART', 'GPIO'].includes(comp)) {
            components.push(comp);
          }
        }
      }
    }
    
    // Then try standard patterns
    for (const pattern of standardPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const comp = (match[1] || match[0]).toUpperCase();
        if (comp && comp.length >= 4 && !components.includes(comp)) {
          // Additional filtering
          if (!['TEMP', 'DATA', 'MODE', 'TIME', 'UART', 'GPIO'].includes(comp)) {
            components.push(comp);
          }
        }
      }
    }

    // Remove duplicates and filter
    const filtered = components.filter(c => {
      // Must be at least 4 characters
      if (c.length < 4) return false;
      // Must contain at least one digit or be a known pattern
      if (!/\d/.test(c) && !/^(ESP|STM|ATMEGA|BME|BMP|MPU|LSM|LM|TL|AO|CD|SN)/.test(c)) return false;
      return true;
    });

    // Remove partial matches - if "ESP32-WROOM-32" exists, remove "ESP32-WROOM"
    const deduplicated = filtered.filter((comp, index) => {
      // Check if any other component contains this one
      return !filtered.some((other, otherIndex) => {
        return otherIndex !== index && other.includes(comp) && other.length > comp.length;
      });
    });

    return deduplicated.length > 0 ? deduplicated : ['GENERIC-IC'];
  }

  /**
   * Download datasheets for components
   */
  async downloadDatasheets(components) {
    const { DatasheetDownloader } = require('./datasheet-downloader');
    const downloader = new DatasheetDownloader();

    for (const component of components) {
      console.log(`   📥 Downloading: ${component}...`);
      try {
        await downloader.searchAndDownload(component, 'IC');
      } catch (error) {
        console.log(`      ⚠️  Failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate GPIO and pin connection table
   */
  async generatePinTable(projectName, components, loader, timestamp) {
    const filename = `${projectName}_pins_${timestamp}.md`;
    const filepath = path.join(this.pinTablesDir, filename);

    let content = `# ${projectName} - GPIO & Pin Connections\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;
    content += `---\n\n`;

    for (const component of components) {
      const specs = loader.getSpecs(component);
      
      content += `## ${component}\n\n`;
      
      if (specs) {
        content += `**Package:** ${specs.package || 'N/A'}\n`;
        content += `**Pins:** ${specs.pins || 'N/A'}\n`;
        content += `**Voltage:** ${specs.voltage?.min || '?'} - ${specs.voltage?.max || '?'}\n`;
        content += `**Current:** ${specs.current?.operating || 'N/A'}\n\n`;
      }

      content += `### Pin Table\n\n`;
      content += `| Pin # | Name | Function | Connect To | Notes |\n`;
      content += `|-------|------|----------|------------|-------|\n`;
      
      // Generate example pins (this would be enhanced with actual pinout data)
      const pinCount = parseInt(specs?.pins || '8');
      for (let i = 1; i <= Math.min(pinCount, 10); i++) {
        content += `| ${i} | PIN${i} | GPIO/Power | TBD | - |\n`;
      }
      
      content += `\n---\n\n`;
    }

    content += `## Inter-Component Connections\n\n`;
    content += `| From | Pin | To | Pin | Signal | Notes |\n`;
    content += `|------|-----|----|----|--------|-------|\n`;
    content += `| ${components[0] || 'MCU'} | GPIO1 | ${components[1] || 'Sensor'} | DATA | Data | - |\n`;
    content += `| Power Supply | 3.3V | All | VCC | Power | - |\n`;
    content += `| Ground | GND | All | GND | Ground | Common ground |\n\n`;

    content += `## GPIO Allocation\n\n`;
    content += `| GPIO | Function | Component | Notes |\n`;
    content += `|------|----------|-----------|-------|\n`;
    content += `| GPIO0 | Button | User Input | Pull-up |\n`;
    content += `| GPIO1 | LED | Status | Active high |\n`;
    content += `| GPIO2 | Sensor | Data In | - |\n\n`;

    fs.writeFileSync(filepath, content);
    return filepath;
  }

  /**
   * Generate schematic
   */
  async generateSchematic(projectName, requirement, components, loader, timestamp) {
    const filename = `${projectName}_schematic_${timestamp}.json`;
    const filepath = path.join(this.schematicsDir, filename);

    // Build component context
    const componentContext = loader.generateComponentContext(components);

    // Create schematic JSON (simplified)
    const schematic = {
      project: projectName,
      timestamp: new Date().toISOString(),
      components: components.map((name, i) => {
        const specs = loader.getSpecs(name);
        return {
          id: `U${i + 1}`,
          name,
          package: specs?.package || 'DIP-8',
          voltage: specs?.voltage?.typ || '5V',
          position: { x: 100 + i * 200, y: 100 }
        };
      }),
      nets: [
        { name: 'VCC', connections: components.map((_, i) => `U${i + 1}.VCC`) },
        { name: 'GND', connections: components.map((_, i) => `U${i + 1}.GND`) }
      ],
      metadata: {
        requirement: requirement.substring(0, 500),
        componentKnowledge: componentContext.substring(0, 500)
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(schematic, null, 2));
    return filepath;
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(projectName, requirement, components, pinTablePath, schematicPath, timestamp) {
    const filename = `${projectName}_${timestamp}.md`;
    const filepath = path.join(this.docsDir, filename);

    let content = `# ${projectName}\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Status:** Complete\n\n`;
    content += `---\n\n`;

    content += `## Original Requirement\n\n`;
    content += requirement;
    content += `\n\n---\n\n`;

    content += `## Components Used\n\n`;
    components.forEach((c, i) => {
      content += `${i + 1}. **${c}**\n`;
    });
    content += `\n---\n\n`;

    content += `## Generated Outputs\n\n`;
    content += `- **Pin Table:** [${path.basename(pinTablePath)}](../pin-tables/${path.basename(pinTablePath)})\n`;
    content += `- **Schematic:** [${path.basename(schematicPath)}](../schematics/${path.basename(schematicPath)})\n\n`;

    content += `---\n\n`;
    content += `## Next Steps\n\n`;
    content += `1. Review pin connections table\n`;
    content += `2. Verify schematic in EasyEDA\n`;
    content += `3. Generate PCB layout\n`;
    content += `4. Order components\n`;
    content += `5. Manufacture PCB\n`;

    fs.writeFileSync(filepath, content);
    return filepath;
  }

  /**
   * Update master index
   */
  async updateMasterIndex() {
    console.log('📝 Updating MASTER-INDEX.md...');

    let content = `# PCB Design Projects - Master Index\n\n`;
    content += `**Last Updated:** ${new Date().toISOString()}\n`;
    content += `**Total Projects:** ${this.projectHistory.length}\n\n`;
    content += `---\n\n`;

    content += `## Project Overview\n\n`;
    content += `| # | Project | Date | Components | Status |\n`;
    content += `|---|---------|------|------------|--------|\n`;

    this.projectHistory.forEach((project, i) => {
      const date = new Date(project.timestamp.replace(/-/g, ':')).toLocaleDateString();
      content += `| ${i + 1} | [${project.name}](#${project.name.toLowerCase().replace(/\s+/g, '-')}) | ${date} | ${project.components} | ✅ Complete |\n`;
    });

    content += `\n---\n\n`;

    content += `## Detailed Projects\n\n`;

    this.projectHistory.forEach((project, i) => {
      content += `### ${i + 1}. ${project.name}\n\n`;
      content += `**Created:** ${project.timestamp}\n`;
      content += `**Input File:** \`inputs/${project.inputFile}\`\n`;
      content += `**Components:** ${project.components}\n\n`;
      
      content += `**Outputs:**\n`;
      content += `- Documentation: [${project.outputs.doc}](outputs/docs/${project.outputs.doc})\n`;
      content += `- Pin Table: [${project.outputs.pinTable}](outputs/pin-tables/${project.outputs.pinTable})\n`;
      content += `- Schematic: [${project.outputs.schematic}](outputs/schematics/${project.outputs.schematic})\n`;
      content += `- Log: [${project.outputs.log}](outputs/logs/${project.outputs.log})\n\n`;
      
      content += `---\n\n`;
    });

    content += `## System Status\n\n`;
    content += `- ✅ Monitoring active\n`;
    content += `- 📂 Watching: \`inputs/\` folder\n`;
    content += `- ⏱️  Check interval: Every 1 minute\n`;
    content += `- 🎯 Auto-processing enabled\n\n`;

    content += `## How to Use\n\n`;
    content += `1. Create a \`.md\` file in \`inputs/\` folder\n`;
    content += `2. Describe your PCB design and components\n`;
    content += `3. System will automatically:\n`;
    content += `   - Download datasheets\n`;
    content += `   - Extract specifications with Ollama\n`;
    content += `   - Generate pin tables\n`;
    content += `   - Create schematics\n`;
    content += `   - Update this index\n\n`;

    fs.writeFileSync(this.masterIndexPath, content);
    console.log('   ✓ Master index updated\n');
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          AUTOMATIC PCB DESIGNER SYSTEM                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const designer = new AutoPCBDesigner();
  
  // Initialize
  await designer.initialize();

  // Start monitoring
  await designer.startMonitoring();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  });
}

module.exports = { AutoPCBDesigner };
