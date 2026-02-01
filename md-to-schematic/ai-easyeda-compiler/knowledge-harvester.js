#!/usr/bin/env node

/**
 * KNOWLEDGE HARVESTER - Continuous Learning Engine
 * 
 * Professional Electronics Engineering Knowledge System
 * 
 * Purpose:
 * - Extract engineering knowledge from every source
 * - Build design pattern library
 * - Track what works, what fails
 * - Improve design quality over time
 * - Generate design rules from learned patterns
 * 
 * This is NOT a one-time tool. This is a LEARNING SYSTEM.
 */

const fs = require('fs');
const path = require('path');

class KnowledgeHarvester {
  constructor() {
    // Knowledge storage paths
    this.knowledgeDir = path.join(__dirname, 'knowledge-base');
    this.patternsDir = path.join(this.knowledgeDir, 'design-patterns');
    this.constraintsDir = path.join(this.knowledgeDir, 'component-constraints');
    this.failuresDir = path.join(this.knowledgeDir, 'failure-patterns');
    this.rulesDir = path.join(__dirname, 'rules-md');
    
    // Learning database
    this.knowledgeDB = {
      components: new Map(),        // Component specs & best practices
      patterns: new Map(),          // Proven design patterns
      failures: new Map(),          // What didn't work
      rules: new Map(),             // Design rules
      warnings: new Map(),          // Safety warnings
      calculations: new Map()       // Engineering calculations
    };
    
    // Performance tracking
    this.designHistory = {
      successes: [],
      failures: [],
      improvements: []
    };
    
    this.ensureDirectories();
  }

  /**
   * Ensure knowledge directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.knowledgeDir,
      this.patternsDir,
      this.constraintsDir,
      this.failuresDir
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * HARVEST from PDF datasheet
   */
  async harvestDatasheet(pdfPath, componentName) {
    console.log(`\n🧠 HARVESTING: ${componentName} from ${path.basename(pdfPath)}`);
    
    const knowledge = {
      component: componentName,
      source: pdfPath,
      timestamp: new Date().toISOString(),
      extracted: {}
    };

    try {
      // Read PDF (already extracted to text)
      const text = fs.readFileSync(pdfPath, 'utf8');
      
      // Extract critical sections
      knowledge.extracted = {
        electricalLimits: this.extractElectricalLimits(text),
        typicalCircuits: this.extractTypicalCircuits(text),
        warnings: this.extractWarnings(text),
        thermalData: this.extractThermalData(text),
        emiGuidance: this.extractEMIGuidance(text),
        applicationNotes: this.extractApplicationNotes(text)
      };
      
      // Store in knowledge base
      this.knowledgeDB.components.set(componentName, knowledge);
      
      // Save to file
      const savePath = path.join(this.constraintsDir, `${componentName}_knowledge.json`);
      fs.writeFileSync(savePath, JSON.stringify(knowledge, null, 2));
      
      console.log(`   ✓ Extracted: Limits, circuits, warnings, thermal, EMI`);
      console.log(`   ✓ Saved: ${path.basename(savePath)}`);
      
      // Generate design rules
      await this.generateDesignRules(componentName, knowledge);
      
      return knowledge;
      
    } catch (error) {
      console.error(`   ❌ Harvest failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract electrical limits (voltage, current, power)
   */
  extractElectricalLimits(text) {
    const limits = {
      voltage: {},
      current: {},
      power: {},
      temperature: {}
    };

    // Voltage patterns
    const voltagePatterns = [
      /supply voltage[:\s]+([0-9.]+)\s*V?\s*to\s*([0-9.]+)\s*V/gi,
      /VCC[:\s]+([0-9.]+)\s*V?\s*to\s*([0-9.]+)\s*V/gi,
      /operating voltage[:\s]+([0-9.]+)\s*[–-]\s*([0-9.]+)\s*V/gi
    ];

    for (const pattern of voltagePatterns) {
      const match = text.match(pattern);
      if (match) {
        limits.voltage = { min: match[1], max: match[2] };
        break;
      }
    }

    // Current patterns
    const currentPatterns = [
      /supply current[:\s]+([0-9.]+)\s*([mµu]?A)/gi,
      /quiescent current[:\s]+([0-9.]+)\s*([mµu]?A)/gi,
      /operating current[:\s]+([0-9.]+)\s*([mµu]?A)/gi
    ];

    for (const pattern of currentPatterns) {
      const match = text.match(pattern);
      if (match) {
        limits.current.typical = match[1] + match[2];
        break;
      }
    }

    // Temperature patterns
    const tempPatterns = [
      /operating temperature[:\s]+(-?[0-9.]+)\s*°?C?\s*to\s*([0-9.]+)\s*°?C/gi,
      /ambient temperature[:\s]+(-?[0-9.]+)\s*°?C?\s*to\s*([0-9.]+)\s*°?C/gi
    ];

    for (const pattern of tempPatterns) {
      const match = text.match(pattern);
      if (match) {
        limits.temperature = { min: match[1] + '°C', max: match[2] + '°C' };
        break;
      }
    }

    return limits;
  }

  /**
   * Extract typical application circuits
   */
  extractTypicalCircuits(text) {
    const circuits = [];
    
    // Look for "typical application" sections
    const sections = [
      /typical application circuit(.*?)(?=\n\n[A-Z]|\n\n##|$)/gis,
      /application example(.*?)(?=\n\n[A-Z]|\n\n##|$)/gis,
      /recommended circuit(.*?)(?=\n\n[A-Z]|\n\n##|$)/gis
    ];

    for (const pattern of sections) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        circuits.push({
          description: match[1].slice(0, 500),
          source: 'datasheet'
        });
      }
    }

    return circuits;
  }

  /**
   * Extract design warnings
   */
  extractWarnings(text) {
    const warnings = [];
    
    const warningPatterns = [
      /(?:warning|caution|note)[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /do not exceed[:\s]+(.*?)(?=\n|\.|$)/gi,
      /(?:may cause|can damage|will damage)[:\s]+(.*?)(?=\n|\.|$)/gi
    ];

    for (const pattern of warningPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const warning = match[1].trim();
        if (warning.length > 10 && warning.length < 500) {
          warnings.push(warning);
        }
      }
    }

    return warnings;
  }

  /**
   * Extract thermal data
   */
  extractThermalData(text) {
    const thermal = {};
    
    // Thermal resistance
    const thermalPatterns = [
      /thermal resistance[:\s]+([0-9.]+)\s*°?C\/W/gi,
      /R[θΘ]JA[:\s]+([0-9.]+)\s*°?C\/W/gi,
      /junction[- ]to[- ]ambient[:\s]+([0-9.]+)\s*°?C\/W/gi
    ];

    for (const pattern of thermalPatterns) {
      const match = text.match(pattern);
      if (match) {
        thermal.resistance_JA = match[1] + '°C/W';
        break;
      }
    }

    // Power dissipation
    const powerPatterns = [
      /power dissipation[:\s]+([0-9.]+)\s*([mW])/gi,
      /maximum power[:\s]+([0-9.]+)\s*([mW])/gi
    ];

    for (const pattern of powerPatterns) {
      const match = text.match(pattern);
      if (match) {
        thermal.maxPower = match[1] + match[2];
        break;
      }
    }

    return thermal;
  }

  /**
   * Extract EMI/ESD guidance
   */
  extractEMIGuidance(text) {
    const emi = {
      emissions: [],
      susceptibility: [],
      mitigation: []
    };

    // Look for EMI/EMC sections
    const emiSections = [
      /EMI[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis,
      /EMC[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis,
      /ESD[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis,
      /electromagnetic compatibility(.*?)(?=\n\n[A-Z]|$)/gis
    ];

    for (const pattern of emiSections) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        emi.mitigation.push(match[1].slice(0, 500));
      }
    }

    return emi;
  }

  /**
   * Extract application notes
   */
  extractApplicationNotes(text) {
    const notes = [];
    
    const notePatterns = [
      /application note[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis,
      /design consideration[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis,
      /layout guideline[:\s]+(.*?)(?=\n\n[A-Z]|$)/gis
    ];

    for (const pattern of notePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        notes.push(match[1].slice(0, 500));
      }
    }

    return notes;
  }

  /**
   * GENERATE design rules from harvested knowledge
   */
  async generateDesignRules(componentName, knowledge) {
    const rulesFile = path.join(this.rulesDir, `${componentName}_auto_rules.md`);
    
    let content = `# ${componentName} - Auto-Generated Design Rules\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Source:** Datasheet knowledge harvest\n\n`;
    content += `---\n\n`;

    // Voltage derating rule
    if (knowledge.extracted.electricalLimits?.voltage?.max) {
      const maxV = parseFloat(knowledge.extracted.electricalLimits.voltage.max);
      const derated = (maxV * 0.5).toFixed(1);
      content += `## Voltage Derating\n`;
      content += `- **Maximum:** ${maxV}V (datasheet)\n`;
      content += `- **Design limit:** ${derated}V (2× derating)\n`;
      content += `- **Rule:** Never exceed ${derated}V in production designs\n\n`;
    }

    // Current headroom rule
    if (knowledge.extracted.electricalLimits?.current?.typical) {
      content += `## Current Headroom\n`;
      content += `- **Typical:** ${knowledge.extracted.electricalLimits.current.typical}\n`;
      content += `- **Design with:** 20% headroom minimum\n`;
      content += `- **Rule:** Size power supply for 1.2× expected current\n\n`;
    }

    // Warnings
    if (knowledge.extracted.warnings?.length > 0) {
      content += `## Critical Warnings\n`;
      knowledge.extracted.warnings.slice(0, 5).forEach((w, i) => {
        content += `${i + 1}. ${w}\n`;
      });
      content += `\n`;
    }

    // Thermal design
    if (knowledge.extracted.thermalData?.resistance_JA) {
      content += `## Thermal Design\n`;
      content += `- **Thermal Resistance:** ${knowledge.extracted.thermalData.resistance_JA}\n`;
      content += `- **Rule:** Calculate worst-case junction temperature\n`;
      content += `- **Rule:** Add thermal vias for packages >1W dissipation\n\n`;
    }

    content += `---\n**AUTO-GENERATED from datasheet harvest**\n`;

    fs.writeFileSync(rulesFile, content);
    console.log(`   ✓ Generated rules: ${path.basename(rulesFile)}`);
  }

  /**
   * LEARN from design iteration
   */
  async learnFromDesign(projectName, success, feedback) {
    console.log(`\n🎓 LEARNING from ${projectName}...`);
    
    const learningEntry = {
      project: projectName,
      timestamp: new Date().toISOString(),
      success,
      feedback,
      lessons: []
    };

    if (success) {
      console.log(`   ✅ Design successful - promoting patterns`);
      this.designHistory.successes.push(learningEntry);
      
      // Extract what worked
      if (feedback.componentsUsed) {
        feedback.componentsUsed.forEach(comp => {
          const count = this.knowledgeDB.components.get(comp)?.useCount || 0;
          this.knowledgeDB.components.set(comp, { 
            ...this.knowledgeDB.components.get(comp),
            useCount: count + 1,
            successRate: ((count + 1) / (count + 1)) * 100  // Will track failures too
          });
        });
      }
      
    } else {
      console.log(`   ❌ Design failed - recording failure pattern`);
      this.designHistory.failures.push(learningEntry);
      
      // Record failure
      const failureFile = path.join(
        this.failuresDir,
        `${projectName}_failure_${Date.now()}.json`
      );
      fs.writeFileSync(failureFile, JSON.stringify(learningEntry, null, 2));
      
      // Generate improvement suggestions
      learningEntry.lessons = this.analyzeFail.failure(feedback);
    }

    // Update learning index
    await this.updateLearningIndex();
    
    return learningEntry;
  }

  /**
   * Analyze failure and generate lessons
   */
  analyzeFailure(feedback) {
    const lessons = [];

    if (feedback.reason?.includes('voltage')) {
      lessons.push({
        rule: 'Increase voltage derating from 2× to 3×',
        action: 'update_rules',
        priority: 'high'
      });
    }

    if (feedback.reason?.includes('current')) {
      lessons.push({
        rule: 'Increase current headroom from 20% to 50%',
        action: 'update_rules',
        priority: 'high'
      });
    }

    if (feedback.reason?.includes('thermal')) {
      lessons.push({
        rule: 'Add thermal vias for all power components',
        action: 'update_design_template',
        priority: 'critical'
      });
    }

    return lessons;
  }

  /**
   * PROMOTE proven design patterns
   */
  async promotePattern(patternName, description, schematicSnippet) {
    console.log(`\n⭐ PROMOTING PATTERN: ${patternName}`);
    
    const pattern = {
      name: patternName,
      description,
      schematic: schematicSnippet,
      useCount: 1,
      successRate: 100,
      timestamp: new Date().toISOString()
    };

    this.knowledgeDB.patterns.set(patternName, pattern);
    
    // Save pattern
    const patternFile = path.join(this.patternsDir, `${patternName}.json`);
    fs.writeFileSync(patternFile, JSON.stringify(pattern, null, 2));
    
    // Add to examples-md
    const exampleFile = path.join(__dirname, 'examples-md', `${patternName}_pattern.md`);
    let content = `# ${patternName} - Proven Design Pattern\n\n`;
    content += `**Success Rate:** ${pattern.successRate}%\n`;
    content += `**Use Count:** ${pattern.useCount}\n\n`;
    content += `## Description\n${description}\n\n`;
    content += `## Schematic\n\`\`\`json\n${JSON.stringify(schematicSnippet, null, 2)}\n\`\`\`\n`;
    
    fs.writeFileSync(exampleFile, content);
    
    console.log(`   ✓ Pattern saved and promoted to examples-md/`);
  }

  /**
   * DEPRECATE risky components
   */
  async deprecateComponent(componentName, reason) {
    console.log(`\n⚠️  DEPRECATING: ${componentName}`);
    console.log(`   Reason: ${reason}`);
    
    const deprecation = {
      component: componentName,
      reason,
      timestamp: new Date().toISOString(),
      suggestedAlternates: []
    };

    // Mark in knowledge base
    if (this.knowledgeDB.components.has(componentName)) {
      const comp = this.knowledgeDB.components.get(componentName);
      comp.deprecated = true;
      comp.deprecationReason = reason;
      this.knowledgeDB.components.set(componentName, comp);
    }

    // Save deprecation notice
    const deprecationFile = path.join(
      this.failuresDir,
      `DEPRECATED_${componentName}.md`
    );
    
    let content = `# ⚠️  COMPONENT DEPRECATED\n\n`;
    content += `**Component:** ${componentName}\n`;
    content += `**Date:** ${deprecation.timestamp}\n`;
    content += `**Reason:** ${reason}\n\n`;
    content += `## Do Not Use This Component\n`;
    content += `This component has been deprecated due to field failures or design issues.\n\n`;
    content += `## Suggested Alternates\n`;
    content += `- TBD (to be added by engineer)\n`;
    
    fs.writeFileSync(deprecationFile, content);
    
    console.log(`   ✓ Deprecation notice saved`);
  }

  /**
   * SUGGEST alternates automatically
   */
  async suggestAlternates(componentName) {
    console.log(`\n💡 SUGGESTING ALTERNATES for ${componentName}...`);
    
    const currentComp = this.knowledgeDB.components.get(componentName);
    if (!currentComp) {
      console.log(`   ⚠️  No knowledge for ${componentName}`);
      return [];
    }

    const alternates = [];
    
    // Search knowledge base for similar components
    for (const [name, comp] of this.knowledgeDB.components) {
      if (name === componentName) continue;
      
      // Compare specs (simplified logic)
      if (comp.voltage?.min === currentComp.voltage?.min &&
          comp.package === currentComp.package) {
        alternates.push({
          name,
          reason: 'Similar specs and package',
          confidence: 0.8
        });
      }
    }

    console.log(`   ✓ Found ${alternates.length} potential alternates`);
    return alternates;
  }

  /**
   * UPDATE learning index
   */
  async updateLearningIndex() {
    const indexPath = path.join(__dirname, 'pdf', 'learning_index.md');
    
    let content = `# Learning Index - Auto-Updated\n\n`;
    content += `**Last Updated:** ${new Date().toISOString()}\n`;
    content += `**Components Learned:** ${this.knowledgeDB.components.size}\n`;
    content += `**Design Patterns:** ${this.knowledgeDB.patterns.size}\n`;
    content += `**Successful Designs:** ${this.designHistory.successes.length}\n`;
    content += `**Failed Designs:** ${this.designHistory.failures.length}\n\n`;
    content += `---\n\n`;

    content += `## Components with Knowledge\n\n`;
    for (const [name, comp] of this.knowledgeDB.components) {
      content += `### ${name}\n`;
      content += `- **Use Count:** ${comp.useCount || 0}\n`;
      content += `- **Deprecated:** ${comp.deprecated ? '⚠️  YES' : '✅ No'}\n`;
      if (comp.extracted?.electricalLimits?.voltage) {
        content += `- **Voltage:** ${comp.extracted.electricalLimits.voltage.min || '?'} - ${comp.extracted.electricalLimits.voltage.max || '?'}V\n`;
      }
      content += `\n`;
    }

    content += `---\n\n## Design Patterns Promoted\n\n`;
    for (const [name, pattern] of this.knowledgeDB.patterns) {
      content += `- **${name}** (used ${pattern.useCount} times, ${pattern.successRate}% success)\n`;
    }

    content += `\n---\n**AUTO-GENERATED by Knowledge Harvester**\n`;

    fs.writeFileSync(indexPath, content);
    console.log(`   ✓ Learning index updated: ${path.basename(indexPath)}`);
  }

  /**
   * BATCH HARVEST all datasheets
   */
  async harvestAll() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          KNOWLEDGE HARVESTER - BATCH MODE                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const datasheetsDir = path.join(__dirname, 'pdf/datasheets-auto');
    
    if (!fs.existsSync(datasheetsDir)) {
      console.log('❌ No datasheets found. Run: npm run download <COMPONENT> IC');
      return;
    }

    const files = fs.readdirSync(datasheetsDir);
    const specFiles = files.filter(f => f.endsWith('_specs.json'));
    
    console.log(`📚 Found ${specFiles.length} component spec files\n`);

    for (const file of specFiles) {
      const componentName = file.replace('_specs.json', '').toUpperCase();
      const filePath = path.join(datasheetsDir, file);
      
      // Load specs
      const specs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Store in knowledge base
      this.knowledgeDB.components.set(componentName, {
        specs,
        source: filePath,
        timestamp: new Date().toISOString(),
        useCount: 0
      });
      
      console.log(`   ✓ Harvested: ${componentName}`);
    }

    console.log(`\n✅ Harvested ${specFiles.length} components into knowledge base`);
    
    // Update index
    await this.updateLearningIndex();
    
    // Generate consolidated rules
    await this.generateConsolidatedRules();
  }

  /**
   * Generate CONSOLIDATED design rules from all knowledge
   */
  async generateConsolidatedRules() {
    const rulesFile = path.join(this.rulesDir, 'AUTO_GENERATED_RULES.md');
    
    let content = `# Auto-Generated Design Rules\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n`;
    content += `**Based on:** ${this.knowledgeDB.components.size} components\n\n`;
    content += `---\n\n`;

    content += `## Component Selection Rules\n\n`;
    content += `### Validated Components (Use These)\n\n`;
    
    for (const [name, comp] of this.knowledgeDB.components) {
      if (!comp.deprecated && comp.specs) {
        content += `#### ${name}\n`;
        content += `- **Package:** ${comp.specs.package || 'N/A'}\n`;
        content += `- **Voltage:** ${comp.specs.voltage?.min || '?'} - ${comp.specs.voltage?.max || '?'}\n`;
        content += `- **Use Count:** ${comp.useCount || 0} designs\n`;
        content += `- **Status:** ✅ Approved\n\n`;
      }
    }

    content += `\n### Deprecated Components (Avoid These)\n\n`;
    
    for (const [name, comp] of this.knowledgeDB.components) {
      if (comp.deprecated) {
        content += `#### ⚠️  ${name}\n`;
        content += `- **Reason:** ${comp.deprecationReason}\n`;
        content += `- **Status:** ❌ Do not use\n\n`;
      }
    }

    content += `---\n**AUTO-GENERATED - Updates on every learning cycle**\n`;

    fs.writeFileSync(rulesFile, content);
    console.log(`   ✓ Consolidated rules: ${path.basename(rulesFile)}`);
  }

  /**
   * EXPORT knowledge base for AI training
   */
  async exportForTraining() {
    console.log('\n📦 EXPORTING knowledge base for AI training...\n');
    
    const trainingData = {
      metadata: {
        exported: new Date().toISOString(),
        components: this.knowledgeDB.components.size,
        patterns: this.knowledgeDB.patterns.size,
        designs: this.designHistory.successes.length + this.designHistory.failures.length
      },
      components: Array.from(this.knowledgeDB.components.entries()).map(([name, data]) => ({
        name,
        ...data
      })),
      patterns: Array.from(this.knowledgeDB.patterns.entries()).map(([name, data]) => ({
        name,
        ...data
      })),
      designHistory: this.designHistory
    };

    const exportPath = path.join(this.knowledgeDir, 'training-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(trainingData, null, 2));
    
    console.log(`✅ Exported to: ${path.basename(exportPath)}`);
    console.log(`   Components: ${trainingData.components.length}`);
    console.log(`   Patterns: ${trainingData.patterns.length}`);
    console.log(`   Designs: ${trainingData.metadata.designs}`);
    
    return exportPath;
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const command = process.argv[2];
  const harvester = new KnowledgeHarvester();

  if (command === 'harvest-all') {
    await harvester.harvestAll();
    
  } else if (command === 'export') {
    await harvester.exportForTraining();
    
  } else if (command === 'promote-pattern') {
    const patternName = process.argv[3] || 'generic-pattern';
    await harvester.promotePattern(patternName, 'Example pattern', {});
    
  } else if (command === 'deprecate') {
    const component = process.argv[3];
    const reason = process.argv[4] || 'Unspecified';
    await harvester.deprecateComponent(component, reason);
    
  } else {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          KNOWLEDGE HARVESTER - LEARNING ENGINE             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Usage:');
    console.log('  node knowledge-harvester.js harvest-all        → Harvest all datasheets');
    console.log('  node knowledge-harvester.js export             → Export for AI training');
    console.log('  node knowledge-harvester.js promote-pattern    → Promote design pattern');
    console.log('  node knowledge-harvester.js deprecate <COMP>   → Deprecate component\n');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { KnowledgeHarvester };
