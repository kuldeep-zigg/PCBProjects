#!/usr/bin/env node

/**
 * Component Knowledge Loader
 * 
 * Loads extracted component specifications from downloaded datasheets
 * Makes knowledge available to EasyEDA schematic compiler
 */

const fs = require('fs');
const path = require('path');

class ComponentKnowledgeLoader {
  constructor() {
    this.knowledgeDir = path.join(__dirname, 'pdf/datasheets-auto');
    this.knowledge = new Map();
  }

  /**
   * Load all component knowledge from extracted specs
   */
  loadAll() {
    console.log('\n📚 Loading Component Knowledge Base...');
    
    if (!fs.existsSync(this.knowledgeDir)) {
      console.log('   ⚠️  No knowledge directory found');
      return this.knowledge;
    }

    const files = fs.readdirSync(this.knowledgeDir);
    const specFiles = files.filter(f => f.endsWith('_specs.json'));

    console.log(`   Found ${specFiles.length} component spec files`);

    for (const file of specFiles) {
      try {
        const filePath = path.join(this.knowledgeDir, file);
        const specs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const componentName = specs.component || file.replace('_specs.json', '');
        this.knowledge.set(componentName.toUpperCase(), specs);
        
        console.log(`   ✓ Loaded: ${componentName}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to load ${file}: ${error.message}`);
      }
    }

    console.log(`   📊 Total components in knowledge base: ${this.knowledge.size}\n`);
    return this.knowledge;
  }

  /**
   * Get specifications for a component
   */
  getSpecs(componentName) {
    const normalized = componentName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Try exact match
    let specs = this.knowledge.get(componentName.toUpperCase());
    if (specs) return specs;

    // Try normalized match
    specs = this.knowledge.get(normalized);
    if (specs) return specs;

    // Try partial match
    for (const [name, specs] of this.knowledge.entries()) {
      if (name.includes(normalized) || normalized.includes(name)) {
        return specs;
      }
    }

    return null;
  }

  /**
   * Get all loaded components
   */
  getComponentList() {
    return Array.from(this.knowledge.keys());
  }

  /**
   * Generate component context for AI prompt
   */
  generateComponentContext(componentNames) {
    let context = '\n## COMPONENT SPECIFICATIONS (From Datasheets)\n\n';
    
    for (const name of componentNames) {
      const specs = this.getSpecs(name);
      
      if (specs) {
        context += `### ${specs.component || name}\n`;
        context += `**Source:** ${specs.source_url || 'Downloaded datasheet'}\n`;
        context += `**Extracted:** ${specs.extracted_at || 'Recently'}\n\n`;
        
        if (specs.manufacturer) {
          context += `**Manufacturer:** ${specs.manufacturer}\n`;
        }
        
        if (specs.description) {
          context += `**Description:** ${specs.description}\n`;
        }
        
        if (specs.voltage) {
          context += `**Operating Voltage:**\n`;
          if (specs.voltage.min) context += `  - Min: ${specs.voltage.min}\n`;
          if (specs.voltage.typ) context += `  - Typ: ${specs.voltage.typ}\n`;
          if (specs.voltage.max) context += `  - Max: ${specs.voltage.max}\n`;
        }
        
        if (specs.current) {
          context += `**Current:**\n`;
          if (specs.current.operating) context += `  - Operating: ${specs.current.operating}\n`;
          if (specs.current.sleep) context += `  - Sleep: ${specs.current.sleep}\n`;
        }
        
        if (specs.package) {
          context += `**Package:** ${specs.package}\n`;
        }
        
        if (specs.pins) {
          context += `**Pin Count:** ${specs.pins}\n`;
        }
        
        if (specs.temperature) {
          context += `**Operating Temperature:** ${specs.temperature.min} to ${specs.temperature.max}\n`;
        }
        
        if (specs.features && specs.features.length > 0) {
          context += `**Key Features:**\n`;
          specs.features.forEach(f => context += `  - ${f}\n`);
        }
        
        if (specs.applications && specs.applications.length > 0) {
          context += `**Typical Applications:**\n`;
          specs.applications.forEach(a => context += `  - ${a}\n`);
        }
        
        context += '\n---\n\n';
      } else {
        context += `### ${name}\n`;
        context += `⚠️  No datasheet information available for this component.\n\n`;
        context += '---\n\n';
      }
    }
    
    return context;
  }

  /**
   * Export knowledge to markdown file
   */
  exportToMarkdown(outputPath) {
    console.log('\n📝 Exporting knowledge base to Markdown...');
    
    let markdown = '# Component Knowledge Base\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `Total Components: ${this.knowledge.size}\n\n`;
    markdown += '---\n\n';
    
    for (const [name, specs] of this.knowledge.entries()) {
      markdown += this.generateComponentContext([name]);
    }
    
    fs.writeFileSync(outputPath, markdown);
    console.log(`   ✓ Exported to: ${outputPath}\n`);
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Component Knowledge Loader                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const loader = new ComponentKnowledgeLoader();
  loader.loadAll();

  // List all components
  const components = loader.getComponentList();
  
  if (components.length > 0) {
    console.log('📋 Available Components:');
    components.forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });

    // Export to markdown
    const outputPath = path.join(__dirname, 'COMPONENT-KNOWLEDGE-BASE.md');
    loader.exportToMarkdown(outputPath);
  } else {
    console.log('⚠️  No component knowledge found.');
    console.log('💡 Run datasheet downloads first:');
    console.log('   npm run download <COMPONENT> <TYPE>');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { ComponentKnowledgeLoader };
