# AI EasyEDA Compiler - System Architecture

## 🎯 Vision

Transform engineering knowledge → AI reasoning → Manufacturable PCB

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE INPUTS                              │
├─────────────────────────────────────────────────────────────────┤
│  /rules-md/         → Design rules, constraints, standards      │
│  /examples-md/      → Working schematics, BOMs, references      │
│  /requirements/     → New board requirements (this project)     │
│  /pdf/              → Datasheets, EasyEDA schematics            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│  1. PDF Converter   → Extract technical text                    │
│  2. Knowledge Base  → Merge rules + examples + datasheets       │
│  3. Prompt Builder  → Create structured AI prompts              │
│  4. AI Orchestrator → DeepSeek-R1 + Phi-4 + Llama 3.1          │
│  5. JSON Validator  → Parse & validate AI output                │
│  6. EasyEDA Writer  → Generate valid schematic JSON             │
│  7. BOM Generator   → Create LCSC-ready BOM                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUTS                                       │
├─────────────────────────────────────────────────────────────────┤
│  /output/           → schematic.json (EasyEDA importable)       │
│                     → bom.md (LCSC formatted)                   │
│                     → design-report.md (validation)             │
│                     → logs/ (audit trail)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
ai-easyeda-compiler/
│
├── rules-md/                      # Design rules (industrial standards)
│   ├── power-design-rules.md
│   ├── signal-integrity-rules.md
│   ├── emc-emi-rules.md
│   ├── thermal-rules.md
│   └── manufacturing-rules.md
│
├── examples-md/                   # Reference designs
│   ├── esp32-basic.md
│   ├── power-supply-5v.md
│   ├── sensor-interface.md
│   └── motor-driver.md
│
├── requirements/                  # New project requirements
│   └── my-project-requirements.md
│
├── pdf/                          # Raw PDFs
│   ├── datasheets/
│   │   ├── ESP32-WROOM-32.pdf
│   │   └── AMS1117.pdf
│   └── schematics/
│       └── reference-board.pdf
│
├── output/                       # Generated outputs
│   ├── schematic.json
│   ├── bom.md
│   ├── design-report.md
│   └── logs/
│       └── 2026-02-01_compilation.log
│
├── src/                          # Core system
│   ├── pipeline/
│   │   ├── pdf-converter.js      # PDF → Text
│   │   ├── knowledge-merger.js   # Merge all inputs
│   │   ├── prompt-builder.js     # Build AI prompts
│   │   ├── ai-orchestrator.js    # Call Ollama models
│   │   ├── json-validator.js     # Validate AI output
│   │   ├── easyeda-writer.js     # Generate schematic JSON
│   │   └── bom-generator.js      # Generate BOM
│   │
│   ├── models/
│   │   ├── easyeda-schema.js     # EasyEDA JSON schema
│   │   ├── component-library.js  # Component templates
│   │   └── net-router.js         # Net connection logic
│   │
│   ├── utils/
│   │   ├── file-handler.js       # Safe file operations
│   │   ├── logger.js             # Structured logging
│   │   └── validator.js          # Input validation
│   │
│   └── config/
│       ├── models.js             # Ollama model config
│       ├── easyeda.js            # EasyEDA format config
│       └── lcsc.js               # LCSC sourcing config
│
├── compiler.js                   # Main entry point
├── package.json
└── README.md
```

---

## 🔧 Core Pipeline Stages

### Stage 1: PDF Conversion
```javascript
// pdf-converter.js
const pdf = require('pdf-parse');

async function convertPDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  return {
    text: cleanText(data.text),
    sections: extractSections(data.text)
  };
}

function extractSections(text) {
  return {
    absoluteMaxRatings: extractSection(text, 'Absolute Maximum'),
    electricalCharacteristics: extractSection(text, 'Electrical'),
    typicalApplication: extractSection(text, 'Typical Application'),
    pinDescriptions: extractSection(text, 'Pin Description'),
    thermalData: extractSection(text, 'Thermal')
  };
}
```

### Stage 2: Knowledge Merger
```javascript
// knowledge-merger.js
function mergeKnowledge(rules, examples, requirements, datasheets) {
  return {
    designRules: parseMarkdownFiles(rules),
    referenceDesigns: parseMarkdownFiles(examples),
    projectRequirements: parseMarkdownFiles(requirements),
    componentDatasheets: datasheets,
    
    // Structured knowledge
    powerRules: extractPowerRules(rules),
    signalRules: extractSignalRules(rules),
    componentLibrary: buildComponentLibrary(examples, datasheets)
  };
}
```

### Stage 3: Prompt Builder
```javascript
// prompt-builder.js
function buildSchematicPrompt(knowledge) {
  return `
You are an expert electronics engineer generating EasyEDA schematic JSON.

DESIGN RULES:
${JSON.stringify(knowledge.designRules, null, 2)}

REFERENCE DESIGNS:
${JSON.stringify(knowledge.referenceDesigns, null, 2)}

PROJECT REQUIREMENTS:
${knowledge.projectRequirements}

COMPONENT DATASHEETS:
${JSON.stringify(knowledge.componentDatasheets, null, 2)}

OUTPUT FORMAT:
{
  "schematic": {
    "docType": "EasyEDA Schematic",
    "canvas": "A4",
    "components": [ ... ],
    "nets": [ ... ]
  },
  "bom_md": "| Component | Value | Package | LCSC | Qty |\\n..."
}

REQUIREMENTS:
1. All components must have decoupling capacitors
2. All power nets properly labeled
3. All nets properly connected
4. Industrial-grade components
5. LCSC part numbers included
6. Follow design rules strictly

Generate complete schematic JSON now.
`;
}
```

### Stage 4: AI Orchestrator
```javascript
// ai-orchestrator.js
class AIOrchestrator {
  async generateSchematic(knowledge) {
    // Phase 1: Architecture (DeepSeek-R1)
    const architecture = await this.callDeepSeek({
      prompt: buildArchitecturePrompt(knowledge),
      purpose: 'Circuit architecture and topology'
    });
    
    // Phase 2: Component calculations (Phi-4)
    const calculations = await this.callPhi4({
      prompt: buildCalculationsPrompt(architecture, knowledge),
      purpose: 'Component value calculations'
    });
    
    // Phase 3: Schematic generation (Llama 3.1)
    const schematic = await this.callLlama({
      prompt: buildSchematicPrompt(architecture, calculations, knowledge),
      purpose: 'EasyEDA JSON generation'
    });
    
    return {
      architecture,
      calculations,
      schematic
    };
  }
}
```

### Stage 5: JSON Validator
```javascript
// json-validator.js
function validateEasyEDAJSON(json) {
  const errors = [];
  
  // Schema validation
  if (!json.docType || json.docType !== 'EasyEDA Schematic') {
    errors.push('Invalid docType');
  }
  
  // Component validation
  json.components.forEach((comp, idx) => {
    if (!comp.uuid) errors.push(`Component ${idx}: missing UUID`);
    if (!comp.position) errors.push(`Component ${idx}: missing position`);
    if (!comp.pins) errors.push(`Component ${idx}: missing pins`);
  });
  
  // Net validation
  json.nets.forEach((net, idx) => {
    if (!net.name) errors.push(`Net ${idx}: missing name`);
    if (!net.connections || net.connections.length < 2) {
      errors.push(`Net ${idx}: insufficient connections`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Stage 6: EasyEDA Writer
```javascript
// easyeda-writer.js
class EasyEDAWriter {
  generateSchematic(design) {
    return {
      "docType": "EasyEDA Schematic",
      "version": "6.5.30",
      "canvas": "A4",
      "background": "#FFFFFF",
      "grid": "10",
      
      "components": design.components.map(comp => ({
        "uuid": generateUUID(),
        "type": comp.type,
        "position": { x: comp.x, y: comp.y },
        "rotation": comp.rotation || 0,
        "value": comp.value,
        "package": comp.package,
        "lcsc": comp.lcsc,
        "pins": comp.pins.map(pin => ({
          "number": pin.number,
          "name": pin.name,
          "position": pin.position,
          "net": pin.net
        }))
      })),
      
      "nets": design.nets.map(net => ({
        "name": net.name,
        "color": net.color || "#008000",
        "connections": net.connections.map(conn => ({
          "component": conn.component,
          "pin": conn.pin
        }))
      })),
      
      "power": design.power.map(p => ({
        "type": "power",
        "label": p.label,
        "position": p.position,
        "net": p.net
      })),
      
      "labels": design.labels.map(l => ({
        "text": l.text,
        "position": l.position,
        "size": l.size || 12
      }))
    };
  }
}
```

### Stage 7: BOM Generator
```javascript
// bom-generator.js
function generateBOM(schematic) {
  const components = extractComponents(schematic);
  const grouped = groupByValue(components);
  
  let bom = `# Bill of Materials\n\n`;
  bom += `| Designator | Component | Value | Package | Description | LCSC | Qty |\n`;
  bom += `|------------|-----------|-------|---------|-------------|------|-----|\n`;
  
  grouped.forEach(group => {
    bom += `| ${group.designators.join(', ')} | `;
    bom += `${group.component} | `;
    bom += `${group.value} | `;
    bom += `${group.package} | `;
    bom += `${group.description} | `;
    bom += `${group.lcsc} | `;
    bom += `${group.quantity} |\n`;
  });
  
  bom += `\n**Total Components:** ${components.length}\n`;
  bom += `**Unique Parts:** ${grouped.length}\n`;
  bom += `**Estimated Cost:** $${calculateCost(grouped)}\n`;
  
  return bom;
}
```

---

## 🚀 Main Compiler

```javascript
// compiler.js
const PDFConverter = require('./src/pipeline/pdf-converter');
const KnowledgeMerger = require('./src/pipeline/knowledge-merger');
const PromptBuilder = require('./src/pipeline/prompt-builder');
const AIOrchestrator = require('./src/pipeline/ai-orchestrator');
const JSONValidator = require('./src/pipeline/json-validator');
const EasyEDAWriter = require('./src/pipeline/easyeda-writer');
const BOMGenerator = require('./src/pipeline/bom-generator');
const Logger = require('./src/utils/logger');

class AIEasyEDACompiler {
  constructor() {
    this.logger = new Logger('ai-easyeda-compiler');
  }
  
  async compile(requirementsFile) {
    this.logger.info('Starting compilation pipeline');
    
    try {
      // Stage 1: Load and convert all inputs
      this.logger.stage('Loading knowledge base');
      const rules = await this.loadMarkdownDir('./rules-md');
      const examples = await this.loadMarkdownDir('./examples-md');
      const requirements = await this.loadMarkdown(requirementsFile);
      const datasheets = await this.loadAndConvertPDFs('./pdf/datasheets');
      
      // Stage 2: Merge knowledge
      this.logger.stage('Merging knowledge');
      const knowledge = KnowledgeMerger.merge(rules, examples, requirements, datasheets);
      
      // Stage 3: Build prompts
      this.logger.stage('Building AI prompts');
      const prompts = PromptBuilder.build(knowledge);
      
      // Stage 4: AI generation
      this.logger.stage('Calling AI models');
      const orchestrator = new AIOrchestrator();
      const aiOutput = await orchestrator.generateSchematic(knowledge, prompts);
      
      // Stage 5: Validate AI output
      this.logger.stage('Validating output');
      const validation = JSONValidator.validate(aiOutput.schematic);
      
      if (!validation.valid) {
        this.logger.error('Validation failed', validation.errors);
        throw new Error('Invalid schematic generated');
      }
      
      // Stage 6: Write EasyEDA JSON
      this.logger.stage('Generating EasyEDA JSON');
      const writer = new EasyEDAWriter();
      const schematicJSON = writer.write(aiOutput.schematic);
      
      // Stage 7: Generate BOM
      this.logger.stage('Generating BOM');
      const bom = BOMGenerator.generate(schematicJSON);
      
      // Stage 8: Save outputs
      this.logger.stage('Saving outputs');
      await this.saveOutputs(schematicJSON, bom, aiOutput);
      
      this.logger.success('Compilation complete');
      
      return {
        success: true,
        schematicPath: './output/schematic.json',
        bomPath: './output/bom.md',
        reportPath: './output/design-report.md'
      };
      
    } catch (error) {
      this.logger.error('Compilation failed', error);
      throw error;
    }
  }
  
  async loadAndConvertPDFs(dir) {
    const pdfFiles = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    const converted = {};
    
    for (const file of pdfFiles) {
      this.logger.info(`Converting PDF: ${file}`);
      const pdfPath = path.join(dir, file);
      converted[file] = await PDFConverter.convert(pdfPath);
    }
    
    return converted;
  }
  
  async saveOutputs(schematic, bom, aiOutput) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Save schematic JSON
    fs.writeFileSync(
      './output/schematic.json',
      JSON.stringify(schematic, null, 2)
    );
    
    // Save BOM
    fs.writeFileSync('./output/bom.md', bom);
    
    // Save design report
    const report = this.generateReport(aiOutput, schematic, bom);
    fs.writeFileSync('./output/design-report.md', report);
    
    // Save log
    fs.writeFileSync(
      `./output/logs/${timestamp}_compilation.log`,
      this.logger.getLogs()
    );
  }
}

// CLI usage
if (require.main === module) {
  const compiler = new AIEasyEDACompiler();
  const requirementsFile = process.argv[2] || './requirements/my-project-requirements.md';
  
  compiler.compile(requirementsFile)
    .then(result => {
      console.log('✅ Success!');
      console.log(`Schematic: ${result.schematicPath}`);
      console.log(`BOM: ${result.bomPath}`);
      console.log(`Report: ${result.reportPath}`);
    })
    .catch(error => {
      console.error('❌ Compilation failed:', error.message);
      process.exit(1);
    });
}

module.exports = AIEasyEDACompiler;
```

---

## 📦 Package Dependencies

```json
{
  "name": "ai-easyeda-compiler",
  "version": "1.0.0",
  "description": "AI-powered EasyEDA schematic compiler",
  "main": "compiler.js",
  "scripts": {
    "compile": "node compiler.js",
    "test": "node test/run-tests.js"
  },
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "uuid": "^9.0.1",
    "markdown-it": "^14.0.0"
  }
}
```

---

## 🎯 Next Steps for Implementation

This architecture document defines the complete system. I'll now create the actual implementation files.

Ready to build?
