#!/usr/bin/env node

/**
 * Convert AI-generated schematic to EasyEDA native formats
 * Supports both EasyEDA Standard and Professional formats
 */

const fs = require('fs');
const path = require('path');

// EasyEDA Standard format uses a specific JSON structure
class EasyEDAConverter {
  
  /**
   * Convert to EasyEDA Standard format (Web version)
   */
  static toStandard(aiSchematic) {
    console.log('🔄 Converting to EasyEDA Standard format...');
    
    // EasyEDA Standard uses a specific shape-based format
    const schematic = {
      "docType": "1", // "1" = Schematic
      "title": aiSchematic.title || "AI Generated Schematic",
      "description": aiSchematic.description || "",
      "head": {
        "docType": "1",
        "editorVersion": "6.5.30",
        "newgId": true,
        "x": "0",
        "y": "0",
        "grid": "10"
      },
      "canvas": "A4",
      "shape": []
    };

    // Convert components to EasyEDA shapes
    const components = aiSchematic.components || [];
    let shapeId = 1;

    for (const comp of components) {
      // Skip notes
      if (comp.type === 'Note') continue;

      // Add component as LIB shape
      const libShape = this.createLibShape(comp, shapeId++);
      schematic.shape.push(libShape);

      // Add designator text
      schematic.shape.push(this.createText(
        comp.designator,
        comp.position.x - 20,
        comp.position.y - 30,
        10,
        shapeId++
      ));

      // Add value text
      schematic.shape.push(this.createText(
        comp.value,
        comp.position.x - 20,
        comp.position.y + 40,
        10,
        shapeId++
      ));
    }

    // Convert nets to wires
    const nets = aiSchematic.nets || [];
    for (const net of nets) {
      if (net.connections && net.connections.length > 1) {
        // Create wire between first two connections
        const wire = this.createWire(
          net.connections[0],
          net.connections[1],
          net.color,
          shapeId++
        );
        if (wire) schematic.shape.push(wire);
      }
    }

    // Add power symbols
    const powerSymbols = aiSchematic.power_symbols || [];
    for (const symbol of powerSymbols) {
      schematic.shape.push(this.createPowerFlag(
        symbol.type,
        symbol.position.x,
        symbol.position.y,
        shapeId++
      ));
    }

    // Add labels
    const labels = aiSchematic.labels || [];
    for (const label of labels) {
      schematic.shape.push(this.createText(
        label.text,
        label.position.x,
        label.position.y,
        label.size || 12,
        shapeId++
      ));
    }

    return schematic;
  }

  /**
   * Convert to EasyEDA Professional format
   */
  static toProfessional(aiSchematic) {
    console.log('🔄 Converting to EasyEDA Professional format...');
    
    // EasyEDA Pro uses a different structure
    const schematic = {
      "head": {
        "docType": "3", // "3" = Pro Schematic
        "editorVersion": "2.0.0",
        "c_origin": "0,0",
        "c_bbox": "0,0,1000,1000"
      },
      "canvas": "A4",
      "shape": [],
      "BBox": {
        "x": 0,
        "y": 0,
        "width": 1000,
        "height": 1000
      }
    };

    // Add components
    const components = aiSchematic.components || [];
    for (const comp of components) {
      if (comp.type === 'Note') continue;
      
      const shape = this.createProComponent(comp);
      if (shape) schematic.shape.push(shape);
    }

    // Add nets
    const nets = aiSchematic.nets || [];
    for (const net of nets) {
      const netShape = this.createProNet(net);
      if (netShape) schematic.shape.push(netShape);
    }

    return schematic;
  }

  /**
   * Create LIB shape for Standard format
   */
  static createLibShape(comp, id) {
    // Simplified component shape
    return {
      "gId": `gge${id}`,
      "layerid": "1",
      "objType": "LIB",
      "c_origin": `${comp.position.x},${comp.position.y}`,
      "c_rotation": comp.rotation || "0",
      "symbolAttr": {
        "Designator": comp.designator,
        "Value": comp.value,
        "Package": comp.package || ""
      }
    };
  }

  /**
   * Create wire shape
   */
  static createWire(from, to, color, id) {
    // Simplified wire - would need pin positions
    return {
      "gId": `gge${id}`,
      "layerid": "1",
      "objType": "WIRE",
      "c_points": `100,100 200,100`,
      "strokeColor": color || "#008000",
      "strokeWidth": "1"
    };
  }

  /**
   * Create power flag
   */
  static createPowerFlag(type, x, y, id) {
    return {
      "gId": `gge${id}`,
      "layerid": "1",
      "objType": "POWERFLAG",
      "c_origin": `${x},${y}`,
      "flagType": type === 'GND' ? 'GND' : 'VCC'
    };
  }

  /**
   * Create text shape
   */
  static createText(text, x, y, size, id) {
    return {
      "gId": `gge${id}`,
      "layerid": "1",
      "objType": "TEXT",
      "c_origin": `${x},${y}`,
      "string": text,
      "textHeight": size.toString(),
      "strokeColor": "#000000"
    };
  }

  /**
   * Create Pro component
   */
  static createProComponent(comp) {
    return {
      "type": "component",
      "id": comp.uuid,
      "designator": comp.designator,
      "value": comp.value,
      "position": {
        "x": comp.position.x,
        "y": comp.position.y
      },
      "rotation": comp.rotation || 0
    };
  }

  /**
   * Create Pro net
   */
  static createProNet(net) {
    return {
      "type": "net",
      "name": net.name,
      "color": net.color,
      "points": []
    };
  }

  /**
   * Export to EasyEDA JSON file format
   */
  static toEasyEDAJSON(schematic) {
    // EasyEDA uses a specific JSON structure with shapes array
    return JSON.stringify(schematic, null, 2);
  }

  /**
   * Export to EasyEDA text format (.txt)
   * This is the actual format EasyEDA uses internally
   */
  static toEasyEDAText(schematic) {
    console.log('🔄 Converting to EasyEDA text format...');
    
    const lines = [];
    
    // Header
    lines.push(`{"head":{"docType":"1","editorVersion":"6.5.30","newgId":true},"canvas":"A4","shape":[`);
    
    // Shapes (simplified)
    const shapes = schematic.shape || [];
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      lines.push(JSON.stringify(shape) + (i < shapes.length - 1 ? ',' : ''));
    }
    
    lines.push(']}');
    
    return lines.join('\n');
  }
}

// ============================================================================
// MAIN CONVERTER
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     EasyEDA Format Converter                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const inputPath = path.join(__dirname, 'output/schematic.json');
  const outputDir = path.join(__dirname, 'output/easyeda-formats');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read AI-generated schematic
  console.log('📖 Reading AI-generated schematic...');
  const aiSchematic = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Convert to EasyEDA Standard
  console.log('\n1️⃣  Converting to EasyEDA Standard...');
  const standardFormat = EasyEDAConverter.toStandard(aiSchematic);
  const standardPath = path.join(outputDir, 'schematic-standard.json');
  fs.writeFileSync(standardPath, JSON.stringify(standardFormat, null, 2));
  console.log(`   ✓ Saved: ${standardPath}`);

  // Convert to EasyEDA Professional
  console.log('\n2️⃣  Converting to EasyEDA Professional...');
  const proFormat = EasyEDAConverter.toProfessional(aiSchematic);
  const proPath = path.join(outputDir, 'schematic-pro.json');
  fs.writeFileSync(proPath, JSON.stringify(proFormat, null, 2));
  console.log(`   ✓ Saved: ${proPath}`);

  // Convert to text format
  console.log('\n3️⃣  Converting to EasyEDA text format...');
  const textFormat = EasyEDAConverter.toEasyEDAText(standardFormat);
  const textPath = path.join(outputDir, 'schematic.txt');
  fs.writeFileSync(textPath, textFormat);
  console.log(`   ✓ Saved: ${textPath}`);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              ✅ CONVERSION COMPLETE                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📂 Generated files:');
  console.log(`   1. ${standardPath}`);
  console.log(`   2. ${proPath}`);
  console.log(`   3. ${textPath}`);
  console.log('');
  console.log('🔌 How to import:');
  console.log('   EasyEDA Standard: File → Open → EasyEDA Source');
  console.log('   EasyEDA Pro: File → Import → EasyEDA');
  console.log('');
  console.log('💡 Try importing each file to see which works!');
}

// Run converter
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  });
}

module.exports = EasyEDAConverter;
