/**
 * EasyEDA Extension - MD to Schematic Converter
 * This extension reads parsed PCB data and creates a schematic in EasyEDA Pro
 */

// Component positioning grid
const GRID_X = 100;
const GRID_Y = 100;
const SPACING_X = 300;
const SPACING_Y = 150;

/**
 * Main extension class
 */
class MDToSchematicConverter {
  constructor() {
    this.pcbData = null;
    this.componentMap = new Map(); // Maps component names to EasyEDA component IDs
  }

  /**
   * Load parsed PCB data from JSON file
   */
  async loadPCBData() {
    // In a real extension, you'd use a file picker dialog
    // Default to loading from output/latest.json
    const fileContent = await api.showOpenDialog({
      title: 'Select parsed PCB data JSON (output/latest.json or timestamped file)',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: '../output/latest.json'
    });

    if (fileContent) {
      this.pcbData = JSON.parse(fileContent);
      return true;
    }
    return false;
  }

  /**
   * Create a new schematic document
   */
  async createSchematic() {
    const doc = await api.createDocument({
      type: 'schematic',
      title: this.pcbData.metadata.title || 'PCB Schematic'
    });
    
    return doc;
  }

  /**
   * Place component on schematic
   */
  async placeComponent(component, x, y) {
    let libraryComponent;
    
    // Map component types to EasyEDA library parts
    switch (component.type) {
      case 'MCU':
        if (component.model === 'Raspberry Pi Pico') {
          libraryComponent = await api.findComponent({
            name: 'Raspberry Pi Pico',
            library: 'system'
          });
        }
        break;
      
      case 'IR_RECEIVER':
        libraryComponent = await api.findComponent({
          name: 'TSOP4838',
          library: 'system'
        });
        break;
      
      case 'SHIFT_REGISTER':
        libraryComponent = await api.findComponent({
          name: '74HC595',
          library: 'system'
        });
        break;
      
      case 'MOSFET':
        libraryComponent = await api.findComponent({
          name: 'N-Channel MOSFET',
          type: 'MOSFET'
        });
        break;
      
      case 'IR_LED':
        libraryComponent = await api.findComponent({
          name: 'LED',
          type: 'LED'
        });
        break;
    }

    if (libraryComponent) {
      const placedComponent = await api.placeComponent({
        component: libraryComponent,
        x: x,
        y: y,
        designator: component.name
      });
      
      this.componentMap.set(component.name, placedComponent.id);
      return placedComponent;
    }
    
    return null;
  }

  /**
   * Create wire connection between components
   */
  async createConnection(connection) {
    const fromComp = this.componentMap.get(connection.from.component);
    const toComp = this.componentMap.get(connection.to.component);
    
    if (fromComp && toComp) {
      // Find pin locations
      const fromPin = await api.getComponentPin(fromComp, connection.from.pin);
      const toPin = await api.getComponentPin(toComp, connection.to.pin);
      
      if (fromPin && toPin) {
        await api.createWire({
          points: [
            { x: fromPin.x, y: fromPin.y },
            { x: toPin.x, y: toPin.y }
          ],
          netName: connection.signal || 'auto'
        });
      }
    }
  }

  /**
   * Generate complete schematic from parsed data
   */
  async generateSchematic() {
    if (!this.pcbData) {
      api.showMessage('Please load PCB data first');
      return;
    }

    // Create schematic document
    await this.createSchematic();

    // Place main components first (MCU, Shift Register)
    let currentX = GRID_X;
    let currentY = GRID_Y;
    
    const mainComponents = this.pcbData.components.filter(
      c => c.type === 'MCU' || c.type === 'SHIFT_REGISTER'
    );
    
    for (const comp of mainComponents) {
      await this.placeComponent(comp, currentX, currentY);
      currentX += SPACING_X * 2;
    }

    // Place IR receivers in a grid
    currentX = GRID_X;
    currentY = GRID_Y + SPACING_Y * 2;
    
    const irReceivers = this.pcbData.components.filter(c => c.type === 'IR_RECEIVER');
    let column = 0;
    
    for (const receiver of irReceivers) {
      await this.placeComponent(receiver, currentX + (column * SPACING_X), currentY);
      column++;
      if (column >= 5) {
        column = 0;
        currentY += SPACING_Y;
      }
    }

    // Place MOSFETs and LEDs
    currentX = GRID_X + SPACING_X * 4;
    currentY = GRID_Y + SPACING_Y * 2;
    column = 0;
    
    const mosfets = this.pcbData.components.filter(c => c.type === 'MOSFET');
    const leds = this.pcbData.components.filter(c => c.type === 'IR_LED');
    
    for (let i = 0; i < mosfets.length; i++) {
      await this.placeComponent(mosfets[i], currentX + (column * SPACING_X), currentY);
      if (leds[i]) {
        await this.placeComponent(leds[i], currentX + (column * SPACING_X), currentY + SPACING_Y);
      }
      column++;
      if (column >= 5) {
        column = 0;
        currentY += SPACING_Y * 3;
      }
    }

    // Create all connections
    for (const connection of this.pcbData.connections) {
      await this.createConnection(connection);
    }

    // Add power symbols (VCC, GND)
    await this.addPowerSymbols();

    api.showMessage('Schematic generated successfully!');
  }

  /**
   * Add power and ground symbols
   */
  async addPowerSymbols() {
    // Add VCC and GND symbols as needed
    const vccSymbol = await api.findComponent({ name: 'VCC', type: 'power' });
    const gndSymbol = await api.findComponent({ name: 'GND', type: 'power' });
    
    // Place near components that need power
    // This is a simplified version - would need more logic for proper placement
  }
}

// Extension entry point
const converter = new MDToSchematicConverter();

// Register command
api.registerCommand('importFromMarkdown', async () => {
  const loaded = await converter.loadPCBData();
  if (loaded) {
    await converter.generateSchematic();
  }
});

// Show welcome message
api.showMessage('MD to Schematic Converter loaded. Use Tools > Import from Markdown');
