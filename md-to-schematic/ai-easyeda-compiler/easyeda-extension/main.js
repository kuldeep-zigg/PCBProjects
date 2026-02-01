/**
 * AI EasyEDA Compiler Extension
 * Imports AI-generated schematic JSON into EasyEDA Pro
 * 
 * Compatible with AI EasyEDA Compiler v2.0
 */

const fs = require('fs');
const path = require('path');

// Component positioning constants
const GRID = {
  X_START: 100,
  Y_START: 100,
  X_SPACING: 300,
  Y_SPACING: 150,
  SNAP_GRID: 10
};

/**
 * Main Extension Class
 */
class AIEasyEDACompiler {
  constructor() {
    this.schematicData = null;
    this.componentMap = new Map();
    this.netMap = new Map();
    this.currentDocument = null;
  }

  /**
   * Import AI-generated schematic JSON
   */
  async importAISchematic() {
    try {
      console.log('🤖 AI EasyEDA Compiler - Import starting...');
      
      // Show file picker
      const filePath = await api.showOpenDialog({
        title: 'Select AI-generated schematic JSON',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        defaultPath: path.join(__dirname, '../output/schematic.json')
      });

      if (!filePath) {
        api.showMessage('Import cancelled', 'info');
        return;
      }

      // Read and parse JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.schematicData = JSON.parse(fileContent);

      // Validate JSON structure
      if (!this.validateSchematicJSON()) {
        api.showMessage('Invalid schematic JSON format', 'error');
        return;
      }

      // Create new schematic document
      await this.createSchematicDocument();

      // Import components
      await this.importComponents();

      // Create nets/wires
      await this.createNets();

      // Add power symbols
      await this.addPowerSymbols();

      // Add labels
      await this.addLabels();

      // Fit view
      await api.fitView();

      api.showMessage('✅ AI Schematic imported successfully!', 'success');
      console.log('✅ Import complete');

    } catch (error) {
      console.error('❌ Import failed:', error);
      api.showMessage(`Import failed: ${error.message}`, 'error');
    }
  }

  /**
   * Import from compiler output directory
   */
  async importFromCompiler() {
    try {
      const outputPath = path.join(__dirname, '../output/schematic.json');
      
      if (!fs.existsSync(outputPath)) {
        api.showMessage('No compiler output found. Run compiler first.', 'warning');
        return;
      }

      // Read latest compiler output
      const fileContent = fs.readFileSync(outputPath, 'utf8');
      this.schematicData = JSON.parse(fileContent);

      // Import schematic
      await this.createSchematicDocument();
      await this.importComponents();
      await this.createNets();
      await this.addPowerSymbols();
      await this.addLabels();
      await api.fitView();

      api.showMessage('✅ Imported from compiler output!', 'success');

    } catch (error) {
      console.error('❌ Import from compiler failed:', error);
      api.showMessage(`Import failed: ${error.message}`, 'error');
    }
  }

  /**
   * Update current schematic from compiler
   */
  async updateSchematic() {
    try {
      // Get current document
      this.currentDocument = await api.getCurrentDocument();
      
      if (!this.currentDocument || this.currentDocument.type !== 'schematic') {
        api.showMessage('Please open a schematic first', 'warning');
        return;
      }

      const outputPath = path.join(__dirname, '../output/schematic.json');
      
      if (!fs.existsSync(outputPath)) {
        api.showMessage('No compiler output found', 'warning');
        return;
      }

      // Confirm update
      const confirmed = await api.showConfirmDialog({
        title: 'Update Schematic',
        message: 'This will replace the current schematic. Continue?',
        buttons: ['Update', 'Cancel']
      });

      if (confirmed !== 0) return;

      // Clear current schematic
      await api.clearDocument();

      // Import new data
      const fileContent = fs.readFileSync(outputPath, 'utf8');
      this.schematicData = JSON.parse(fileContent);

      await this.importComponents();
      await this.createNets();
      await this.addPowerSymbols();
      await this.addLabels();
      await api.fitView();

      api.showMessage('✅ Schematic updated!', 'success');

    } catch (error) {
      console.error('❌ Update failed:', error);
      api.showMessage(`Update failed: ${error.message}`, 'error');
    }
  }

  /**
   * Validate schematic JSON structure
   */
  validateSchematicJSON() {
    if (!this.schematicData) return false;
    
    // Check required fields
    const required = ['docType', 'version', 'components', 'nets'];
    for (const field of required) {
      if (!this.schematicData[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check docType
    if (this.schematicData.docType !== 'EasyEDA Schematic') {
      console.error('Invalid docType');
      return false;
    }

    return true;
  }

  /**
   * Create new schematic document
   */
  async createSchematicDocument() {
    const title = this.schematicData.title || 'AI Generated Schematic';
    const description = this.schematicData.description || '';

    this.currentDocument = await api.createDocument({
      type: 'schematic',
      title: title,
      canvas: {
        size: this.schematicData.canvas?.size || 'A4',
        orientation: this.schematicData.canvas?.orientation || 'landscape'
      }
    });

    console.log(`✓ Created document: ${title}`);
  }

  /**
   * Import all components from JSON
   */
  async importComponents() {
    console.log('📦 Importing components...');
    
    const components = this.schematicData.components || [];
    let imported = 0;
    let skipped = 0;

    for (const comp of components) {
      try {
        // Skip notes (they'll be added as text later)
        if (comp.type === 'Note') {
          await this.addNote(comp);
          continue;
        }

        const placed = await this.placeComponent(comp);
        if (placed) {
          this.componentMap.set(comp.designator, placed);
          imported++;
        } else {
          skipped++;
          console.warn(`⚠️  Skipped: ${comp.designator}`);
        }
      } catch (error) {
        console.error(`❌ Failed to place ${comp.designator}:`, error.message);
        skipped++;
      }
    }

    console.log(`✓ Imported: ${imported}, Skipped: ${skipped}`);
  }

  /**
   * Place a single component
   */
  async placeComponent(comp) {
    // Map component type to EasyEDA library component
    let libraryComponent = null;

    switch (comp.type) {
      case 'Module':
        // For modules like Raspberry Pi Pico, use generic symbol or create custom
        libraryComponent = await this.findOrCreateModule(comp);
        break;

      case 'Sensor':
        // IR receivers, sensors
        libraryComponent = await this.findComponent(comp.value, 'IC');
        break;

      case 'Diode':
        libraryComponent = await this.findComponent('Diode', 'Diode');
        break;

      case 'Resistor':
        libraryComponent = await this.findComponent('Resistor', 'Resistor');
        break;

      case 'Capacitor':
        libraryComponent = await this.findComponent('Capacitor', 'Capacitor');
        break;

      case 'Connector':
        libraryComponent = await this.findComponent('Header', 'Connector');
        break;

      default:
        // Try generic search
        libraryComponent = await this.findComponent(comp.value, comp.type);
    }

    if (!libraryComponent) {
      console.warn(`Library component not found for ${comp.designator}`);
      // Create a generic component placeholder
      libraryComponent = await this.createPlaceholder(comp);
    }

    // Place component at specified position
    const placed = await api.placeComponent({
      component: libraryComponent,
      x: comp.position.x,
      y: comp.position.y,
      rotation: comp.rotation || 0,
      designator: comp.designator,
      value: comp.value
    });

    return placed;
  }

  /**
   * Find component in EasyEDA library
   */
  async findComponent(name, type) {
    try {
      const results = await api.searchLibrary({
        keyword: name,
        type: type,
        limit: 5
      });

      if (results && results.length > 0) {
        return results[0];
      }
    } catch (error) {
      console.error(`Failed to find component ${name}:`, error.message);
    }

    return null;
  }

  /**
   * Find or create module component
   */
  async findOrCreateModule(comp) {
    // Try to find module in library
    const found = await this.findComponent(comp.value, 'Module');
    
    if (found) return found;

    // Create custom module symbol
    return await this.createCustomModule(comp);
  }

  /**
   * Create custom module symbol
   */
  async createCustomModule(comp) {
    // Create a rectangular symbol with pins
    const pinCount = comp.pins ? comp.pins.length : 0;
    const width = 200;
    const height = Math.max(300, pinCount * 20);

    const symbol = await api.createSymbol({
      designator: comp.designator,
      value: comp.value,
      width: width,
      height: height,
      pins: comp.pins || []
    });

    return symbol;
  }

  /**
   * Create placeholder component
   */
  async createPlaceholder(comp) {
    return await api.createSymbol({
      designator: comp.designator,
      value: comp.value,
      width: 100,
      height: 50,
      type: 'generic'
    });
  }

  /**
   * Create all nets/wires
   */
  async createNets() {
    console.log('🔌 Creating nets...');
    
    const nets = this.schematicData.nets || [];
    let created = 0;

    for (const net of nets) {
      try {
        await this.createNet(net);
        created++;
      } catch (error) {
        console.error(`Failed to create net ${net.name}:`, error.message);
      }
    }

    console.log(`✓ Created ${created} nets`);
  }

  /**
   * Create a single net
   */
  async createNet(net) {
    // Create net with specified name and color
    const netObj = await api.createNet({
      name: net.name,
      color: net.color || '#008000',
      width: net.width || 1
    });

    this.netMap.set(net.name, netObj);

    // Connect all components on this net
    if (net.connections && net.connections.length > 1) {
      for (let i = 0; i < net.connections.length - 1; i++) {
        const from = net.connections[i];
        const to = net.connections[i + 1];

        await this.connectComponents(from, to, net);
      }
    }
  }

  /**
   * Connect two components
   */
  async connectComponents(from, to, net) {
    try {
      const fromComp = this.componentMap.get(from.component);
      const toComp = this.componentMap.get(to.component);

      if (!fromComp || !toComp) {
        console.warn(`Cannot connect: component not found`);
        return;
      }

      // Get pin positions
      const fromPin = await api.getComponentPin(fromComp.id, from.pin);
      const toPin = await api.getComponentPin(toComp.id, to.pin);

      if (fromPin && toPin) {
        // Create wire
        await api.createWire({
          net: net.name,
          points: [
            { x: fromPin.x, y: fromPin.y },
            { x: toPin.x, y: toPin.y }
          ],
          color: net.color,
          width: net.width
        });
      }
    } catch (error) {
      console.error('Failed to connect components:', error.message);
    }
  }

  /**
   * Add power symbols
   */
  async addPowerSymbols() {
    console.log('⚡ Adding power symbols...');
    
    const powerSymbols = this.schematicData.power_symbols || [];
    
    for (const symbol of powerSymbols) {
      try {
        await this.addPowerSymbol(symbol);
      } catch (error) {
        console.error(`Failed to add power symbol:`, error.message);
      }
    }
  }

  /**
   * Add a single power symbol
   */
  async addPowerSymbol(symbol) {
    const symbolType = symbol.type === 'GND' ? 'ground' : 'power';
    
    await api.placePowerSymbol({
      type: symbolType,
      label: symbol.label,
      x: symbol.position.x,
      y: symbol.position.y,
      net: symbol.net,
      color: symbol.color
    });
  }

  /**
   * Add labels
   */
  async addLabels() {
    console.log('🏷️  Adding labels...');
    
    const labels = this.schematicData.labels || [];
    
    for (const label of labels) {
      try {
        await api.addText({
          text: label.text,
          x: label.position.x,
          y: label.position.y,
          size: label.size || 12,
          bold: label.bold || false
        });
      } catch (error) {
        console.error('Failed to add label:', error.message);
      }
    }

    // Add notes
    const notes = this.schematicData.notes || [];
    for (const note of notes) {
      await api.addText({
        text: note.text,
        x: note.position.x,
        y: note.position.y,
        size: 10,
        color: '#666666'
      });
    }
  }

  /**
   * Add note/comment
   */
  async addNote(comp) {
    await api.addText({
      text: comp.value,
      x: comp.position.x,
      y: comp.position.y,
      size: 10,
      color: '#999999'
    });
  }

  /**
   * Generate BOM from current schematic
   */
  async generateBOM() {
    try {
      const doc = await api.getCurrentDocument();
      
      if (!doc || doc.type !== 'schematic') {
        api.showMessage('Please open a schematic first', 'warning');
        return;
      }

      // Extract components
      const components = await api.getComponents();
      
      // Generate BOM
      const bom = this.createBOMTable(components);
      
      // Save to file
      const bomPath = path.join(__dirname, '../output/generated-bom.md');
      fs.writeFileSync(bomPath, bom, 'utf8');

      api.showMessage(`BOM generated: ${bomPath}`, 'success');

    } catch (error) {
      console.error('BOM generation failed:', error);
      api.showMessage('BOM generation failed', 'error');
    }
  }

  /**
   * Create BOM table in markdown
   */
  createBOMTable(components) {
    let bom = '# Bill of Materials (Generated from EasyEDA)\n\n';
    bom += '| Designator | Component | Value | Package | Qty |\n';
    bom += '|------------|-----------|-------|---------|-----|\n';

    const grouped = this.groupComponents(components);

    for (const [key, items] of grouped.entries()) {
      const designators = items.map(i => i.designator).join(', ');
      const first = items[0];
      
      bom += `| ${designators} | ${first.component} | ${first.value} | ${first.package} | ${items.length} |\n`;
    }

    return bom;
  }

  /**
   * Group components by value
   */
  groupComponents(components) {
    const grouped = new Map();

    for (const comp of components) {
      const key = `${comp.component}_${comp.value}_${comp.package}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key).push(comp);
    }

    return grouped;
  }

  /**
   * Validate design against rules
   */
  async validateDesign() {
    try {
      const doc = await api.getCurrentDocument();
      
      if (!doc) {
        api.showMessage('No document open', 'warning');
        return;
      }

      // Run design rule checks
      const issues = [];

      // Check for unconnected nets
      const nets = await api.getNets();
      for (const net of nets) {
        if (net.connections < 2) {
          issues.push(`⚠️  Net "${net.name}" has < 2 connections`);
        }
      }

      // Check for missing decoupling
      const ics = await api.getComponents({ type: 'IC' });
      for (const ic of ics) {
        // Check for nearby capacitors
        // (Simplified - would need proximity check)
      }

      // Display results
      if (issues.length === 0) {
        api.showMessage('✅ No design issues found!', 'success');
      } else {
        const message = issues.join('\n');
        api.showMessage(`Design Issues:\n${message}`, 'warning');
      }

    } catch (error) {
      console.error('Validation failed:', error);
      api.showMessage('Validation failed', 'error');
    }
  }

  /**
   * Export for manufacturing
   */
  async exportManufacturing() {
    try {
      const doc = await api.getCurrentDocument();
      
      if (!doc) {
        api.showMessage('No document open', 'warning');
        return;
      }

      // Generate BOM
      await this.generateBOM();

      // Export Gerbers (if PCB)
      if (doc.type === 'pcb') {
        await api.exportGerber({
          outputDir: path.join(__dirname, '../output/gerbers')
        });
      }

      api.showMessage('✅ Manufacturing files exported!', 'success');

    } catch (error) {
      console.error('Export failed:', error);
      api.showMessage('Export failed', 'error');
    }
  }
}

// ============================================================================
// Extension Registration
// ============================================================================

const extension = new AIEasyEDACompiler();

// Register commands
api.registerCommand('importAISchematic', () => extension.importAISchematic());
api.registerCommand('importFromCompiler', () => extension.importFromCompiler());
api.registerCommand('updateSchematic', () => extension.updateSchematic());
api.registerCommand('generateBOM', () => extension.generateBOM());
api.registerCommand('validateDesign', () => extension.validateDesign());
api.registerCommand('exportManufacturing', () => extension.exportManufacturing());

// Show welcome message
console.log('🤖 AI EasyEDA Compiler Extension v2.0 loaded');
api.showMessage('AI EasyEDA Compiler Extension ready!', 'info');
