#!/usr/bin/env node

/**
 * AI EasyEDA Compiler - MVP Version
 * 
 * Quick test implementation to validate the pipeline concept
 * Production version will use separate modules
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  ollamaUrl: 'http://127.0.0.1:11434',
  models: {
    reasoning: 'deepseek-r1:7b',
    design: 'llama3.1:8b',
    math: 'phi4:14b'
  },
  paths: {
    rules: './rules-md',
    examples: './examples-md',
    requirements: './requirements',
    pdf: './pdf',
    output: './output'
  }
};

// ============================================================================
// STAGE 1: KNOWLEDGE LOADER
// ============================================================================

class KnowledgeLoader {
  static loadMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir} (skipping)`);
      return [];
    }
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    return files.map(file => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      return { filename: file, content };
    });
  }
  
  static loadAll() {
    console.log('📚 Loading knowledge base...');
    
    return {
      rules: this.loadMarkdownFiles(CONFIG.paths.rules),
      examples: this.loadMarkdownFiles(CONFIG.paths.examples),
      requirements: this.loadMarkdownFiles(CONFIG.paths.requirements)
    };
  }
}

// ============================================================================
// STAGE 2: PROMPT BUILDER
// ============================================================================

class PromptBuilder {
  static buildSystemPrompt(knowledge) {
    let prompt = `You are an expert electronics engineer generating EasyEDA-compatible schematic designs.

DESIGN RULES:\n`;
    
    knowledge.rules.forEach(rule => {
      prompt += `\n### ${rule.filename}\n${rule.content.substring(0, 500)}...\n`;
    });
    
    prompt += `\nREFERENCE EXAMPLES:\n`;
    knowledge.examples.forEach(example => {
      prompt += `\n### ${example.filename}\n${example.content.substring(0, 500)}...\n`;
    });
    
    prompt += `\nOUTPUT FORMAT:
You must output valid JSON in this exact format:
{
  "schematic": {
    "components": [
      {
        "designator": "U1",
        "type": "IC",
        "value": "ESP32-WROOM-32",
        "package": "SMD",
        "x": 300,
        "y": 200
      }
    ],
    "nets": [
      {
        "name": "GND",
        "connections": ["U1.8", "C1.2"]
      }
    ]
  },
  "bom": [
    {
      "designator": "U1",
      "component": "ESP32-WROOM-32",
      "package": "SMD",
      "value": "ESP32-WROOM-32",
      "quantity": 1,
      "lcsc": "C82899"
    }
  ]
}

CRITICAL RULES:
1. All ICs need 0.1µF decoupling capacitors
2. All power nets must be labeled
3. Use LCSC part numbers
4. Follow industrial design standards
5. Output ONLY valid JSON, no markdown

Generate complete design now.`;
    
    return prompt;
  }
  
  static buildUserPrompt(requirements) {
    let prompt = 'Design a PCB based on these requirements:\n\n';
    
    requirements.forEach(req => {
      prompt += `${req.content}\n\n`;
    });
    
    return prompt;
  }
}

// ============================================================================
// STAGE 3: AI ORCHESTRATOR
// ============================================================================

class AIOrchestrator {
  static async callOllama(model, prompt) {
    try {
      const response = await fetch(`${CONFIG.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,  // Lower for more deterministic output
            num_ctx: 8192
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error(`❌ Ollama error: ${error.message}`);
      throw error;
    }
  }
  
  static async generateSchematic(knowledge) {
    console.log('🤖 Generating schematic with AI...');
    console.log('   Using Llama 3.1 for design generation');
    
    const systemPrompt = PromptBuilder.buildSystemPrompt(knowledge);
    const userPrompt = PromptBuilder.buildUserPrompt(knowledge.requirements);
    
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    console.log('   Calling AI model (this may take 30-60 seconds)...');
    const response = await this.callOllama(CONFIG.models.design, fullPrompt);
    
    console.log('   AI response received, parsing JSON...');
    return this.parseAIResponse(response);
  }
  
  static parseAIResponse(response) {
    // Try to extract JSON from response
    // AI might wrap it in markdown code blocks
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find JSON object
      const objMatch = response.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('❌ Failed to parse AI response as JSON');
      console.error('Response:', response.substring(0, 500));
      throw new Error('AI did not generate valid JSON');
    }
  }
}

// ============================================================================
// STAGE 4: EASYEDA WRITER
// ============================================================================

class EasyEDAWriter {
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  static convertToEasyEDA(design) {
    console.log('🔧 Converting to EasyEDA JSON format...');
    
    return {
      docType: "EasyEDA Schematic",
      version: "6.5.30",
      canvas: {
        size: "A4",
        orientation: "landscape",
        background: "#FFFFFF",
        grid: 10
      },
      
      components: design.schematic.components.map(comp => ({
        uuid: this.generateUUID(),
        type: comp.type || 'Component',
        designator: comp.designator,
        value: comp.value,
        package: comp.package,
        position: {
          x: comp.x || 0,
          y: comp.y || 0
        },
        rotation: comp.rotation || 0,
        attributes: {
          LCSC: comp.lcsc || '',
          Manufacturer: comp.manufacturer || ''
        }
      })),
      
      nets: design.schematic.nets.map(net => ({
        name: net.name,
        color: net.name === 'GND' ? '#000000' : 
               net.name.includes('VCC') ? '#FF0000' : '#008000',
        width: 1,
        connections: net.connections || []
      })),
      
      power: [
        {
          type: 'VCC',
          position: { x: 100, y: 50 },
          net: 'VCC_3V3'
        },
        {
          type: 'GND',
          position: { x: 100, y: 100 },
          net: 'GND'
        }
      ],
      
      metadata: {
        title: 'AI Generated Schematic',
        author: 'AI EasyEDA Compiler',
        date: new Date().toISOString(),
        revision: '1.0'
      }
    };
  }
}

// ============================================================================
// STAGE 5: BOM GENERATOR
// ============================================================================

class BOMGenerator {
  static generate(design) {
    console.log('📋 Generating BOM...');
    
    let bom = `# Bill of Materials\n\n`;
    bom += `Generated: ${new Date().toLocaleString()}\n\n`;
    bom += `| Designator | Component | Value | Package | LCSC | Qty |\n`;
    bom += `|------------|-----------|-------|---------|------|-----|\n`;
    
    if (design.bom && design.bom.length > 0) {
      design.bom.forEach(item => {
        bom += `| ${item.designator} | `;
        bom += `${item.component} | `;
        bom += `${item.value} | `;
        bom += `${item.package} | `;
        bom += `${item.lcsc || 'TBD'} | `;
        bom += `${item.quantity || 1} |\n`;
      });
    }
    
    bom += `\n**Total Components:** ${design.bom?.length || 0}\n`;
    
    return bom;
  }
}

// ============================================================================
// STAGE 6: OUTPUT WRITER
// ============================================================================

class OutputWriter {
  static ensureOutputDir() {
    if (!fs.existsSync(CONFIG.paths.output)) {
      fs.mkdirSync(CONFIG.paths.output, { recursive: true });
    }
    
    const logsDir = path.join(CONFIG.paths.output, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }
  
  static save(schematic, bom, design) {
    this.ensureOutputDir();
    
    console.log('💾 Saving outputs...');
    
    // Save schematic JSON
    const schematicPath = path.join(CONFIG.paths.output, 'schematic.json');
    fs.writeFileSync(schematicPath, JSON.stringify(schematic, null, 2));
    console.log(`   ✓ Schematic: ${schematicPath}`);
    
    // Save BOM
    const bomPath = path.join(CONFIG.paths.output, 'bom.md');
    fs.writeFileSync(bomPath, bom);
    console.log(`   ✓ BOM: ${bomPath}`);
    
    // Save design report
    const reportPath = path.join(CONFIG.paths.output, 'design-report.md');
    const report = this.generateReport(design, schematic);
    fs.writeFileSync(reportPath, report);
    console.log(`   ✓ Report: ${reportPath}`);
    
    // Save raw AI response for debugging
    const rawPath = path.join(CONFIG.paths.output, 'logs', 'ai-raw-response.json');
    fs.writeFileSync(rawPath, JSON.stringify(design, null, 2));
    console.log(`   ✓ Debug: ${rawPath}`);
    
    return {
      schematicPath,
      bomPath,
      reportPath
    };
  }
  
  static generateReport(design, schematic) {
    let report = `# Design Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Compiler:** AI EasyEDA Compiler MVP\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Components: ${schematic.components?.length || 0}\n`;
    report += `- Nets: ${schematic.nets?.length || 0}\n`;
    report += `- BOM Items: ${design.bom?.length || 0}\n\n`;
    
    report += `## Components\n\n`;
    schematic.components?.forEach(comp => {
      report += `- **${comp.designator}**: ${comp.value} (${comp.package})\n`;
    });
    
    report += `\n## Nets\n\n`;
    schematic.nets?.forEach(net => {
      report += `- **${net.name}**: ${net.connections?.length || 0} connections\n`;
    });
    
    report += `\n## Next Steps\n\n`;
    report += `1. Open EasyEDA Pro\n`;
    report += `2. File → Import → EasyEDA JSON\n`;
    report += `3. Select: output/schematic.json\n`;
    report += `4. Review and modify as needed\n`;
    report += `5. Generate PCB layout\n`;
    
    return report;
  }
}

// ============================================================================
// MAIN COMPILER
// ============================================================================

class AIEasyEDACompiler {
  async compile() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        AI EasyEDA Compiler - MVP Version                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    try {
      // Stage 1: Load knowledge
      const knowledge = KnowledgeLoader.loadAll();
      
      if (knowledge.requirements.length === 0) {
        console.error('❌ No requirements found in ./requirements/');
        console.log('\nPlease create a requirements file:');
        console.log('  echo "Design ESP32 LED board" > requirements/my-project.md');
        return { success: false };
      }
      
      console.log(`   Loaded ${knowledge.rules.length} rule files`);
      console.log(`   Loaded ${knowledge.examples.length} example files`);
      console.log(`   Loaded ${knowledge.requirements.length} requirement files\n`);
      
      // Stage 2: Generate with AI
      const design = await AIOrchestrator.generateSchematic(knowledge);
      
      // Stage 3: Convert to EasyEDA format
      const schematic = EasyEDAWriter.convertToEasyEDA(design);
      
      // Stage 4: Generate BOM
      const bom = BOMGenerator.generate(design);
      
      // Stage 5: Save outputs
      const outputs = OutputWriter.save(schematic, bom, design);
      
      // Success!
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ COMPILATION COMPLETE                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      
      console.log('📂 Generated Files:\n');
      console.log(`   Schematic: ${outputs.schematicPath}`);
      console.log(`   BOM:       ${outputs.bomPath}`);
      console.log(`   Report:    ${outputs.reportPath}`);
      
      console.log('\n🚀 Next Steps:\n');
      console.log('   1. Review output files');
      console.log('   2. Import schematic.json into EasyEDA Pro');
      console.log('   3. Generate PCB layout');
      console.log('   4. Order from JLCPCB\n');
      
      return { success: true, outputs };
      
    } catch (error) {
      console.error('\n❌ Compilation failed:', error.message);
      console.error('\nStack trace:', error.stack);
      return { success: false, error };
    }
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
  const compiler = new AIEasyEDACompiler();
  
  compiler.compile()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = AIEasyEDACompiler;
