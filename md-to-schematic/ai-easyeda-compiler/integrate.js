#!/usr/bin/env node

/**
 * AI EasyEDA Compiler Integration Bridge
 * 
 * Connects the AI compiler with EasyEDA Pro
 * Automates the workflow: Requirements → AI → JSON → EasyEDA
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Paths
const COMPILER_PATH = path.join(__dirname, 'compiler-mvp.js');
const EXTENSION_PATH = path.join(__dirname, 'easyeda-extension');
const OUTPUT_PATH = path.join(__dirname, 'output');

/**
 * Integration Manager Class
 */
class IntegrationManager {
  constructor() {
    this.verbose = false;
  }

  /**
   * Main integration workflow
   */
  async run(options = {}) {
    this.verbose = options.verbose || false;

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       AI EasyEDA Compiler - Integration Bridge            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      // Step 1: Run AI Compiler
      this.log('📝 Step 1: Running AI Compiler...');
      await this.runCompiler(options.requirements);

      // Step 2: Validate Output
      this.log('✓ Step 2: Validating compiler output...');
      const isValid = await this.validateOutput();
      
      if (!isValid) {
        throw new Error('Compiler output validation failed');
      }

      // Step 3: Prepare for EasyEDA
      this.log('🔧 Step 3: Preparing for EasyEDA import...');
      await this.prepareForEasyEDA();

      // Step 4: Check EasyEDA Extension
      this.log('🔌 Step 4: Checking EasyEDA extension...');
      const extensionReady = await this.checkExtension();

      if (!extensionReady) {
        this.log('⚠️  EasyEDA extension not installed. See installation guide.');
      }

      // Step 5: Generate Summary
      this.log('📊 Step 5: Generating summary...');
      await this.generateSummary();

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                 ✅ INTEGRATION COMPLETE                    ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      this.printNextSteps();

      return true;

    } catch (error) {
      console.error('\n❌ Integration failed:', error.message);
      console.error('\nStack trace:', error.stack);
      return false;
    }
  }

  /**
   * Run AI compiler
   */
  async runCompiler(requirementsFile) {
    const reqPath = requirementsFile || path.join(__dirname, 'requirements');
    
    this.log(`   Requirements: ${reqPath}`);
    this.log('   Calling AI models...');

    try {
      const { stdout, stderr } = await execAsync(`node ${COMPILER_PATH}`, {
        cwd: __dirname,
        timeout: 120000 // 2 minutes
      });

      if (this.verbose) {
        console.log(stdout);
      }

      if (stderr && !stderr.includes('ExperimentalWarning')) {
        console.warn('⚠️  Compiler warnings:', stderr);
      }

      this.log('   ✓ Compiler completed successfully');

    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Compiler timeout (>2 minutes). Check Ollama connection.');
      }
      throw new Error(`Compiler failed: ${error.message}`);
    }
  }

  /**
   * Validate compiler output
   */
  async validateOutput() {
    const schematicPath = path.join(OUTPUT_PATH, 'schematic.json');
    const bomPath = path.join(OUTPUT_PATH, 'bom.md');

    // Check files exist
    if (!fs.existsSync(schematicPath)) {
      console.error('   ❌ schematic.json not found');
      return false;
    }

    if (!fs.existsSync(bomPath)) {
      console.error('   ❌ bom.md not found');
      return false;
    }

    // Validate schematic JSON
    try {
      const schematicData = JSON.parse(fs.readFileSync(schematicPath, 'utf8'));
      
      if (!schematicData.docType || schematicData.docType !== 'EasyEDA Schematic') {
        console.error('   ❌ Invalid schematic JSON format');
        return false;
      }

      if (!schematicData.components || schematicData.components.length === 0) {
        console.error('   ❌ No components in schematic');
        return false;
      }

      this.log(`   ✓ Schematic valid (${schematicData.components.length} components)`);
      this.log(`   ✓ BOM generated`);

      return true;

    } catch (error) {
      console.error('   ❌ JSON parse error:', error.message);
      return false;
    }
  }

  /**
   * Prepare output for EasyEDA import
   */
  async prepareForEasyEDA() {
    // Copy schematic to extension directory for easy access
    const src = path.join(OUTPUT_PATH, 'schematic.json');
    const dest = path.join(EXTENSION_PATH, 'latest-schematic.json');

    fs.copyFileSync(src, dest);
    this.log('   ✓ Schematic copied to extension directory');

    // Generate import instructions
    const instructions = this.generateImportInstructions();
    const instructionsPath = path.join(OUTPUT_PATH, 'IMPORT-INSTRUCTIONS.txt');
    fs.writeFileSync(instructionsPath, instructions, 'utf8');

    this.log('   ✓ Import instructions generated');
  }

  /**
   * Check if EasyEDA extension is installed
   */
  async checkExtension() {
    const extensionExists = fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json')) &&
                           fs.existsSync(path.join(EXTENSION_PATH, 'main.js'));

    if (extensionExists) {
      this.log('   ✓ Extension files ready');
      return true;
    } else {
      this.log('   ⚠️  Extension files not found');
      return false;
    }
  }

  /**
   * Generate summary report
   */
  async generateSummary() {
    const schematicPath = path.join(OUTPUT_PATH, 'schematic.json');
    const schematicData = JSON.parse(fs.readFileSync(schematicPath, 'utf8'));

    const summary = `
# Integration Summary

**Date:** ${new Date().toLocaleString()}
**Project:** ${schematicData.title || 'Unnamed Project'}

## Files Generated

✅ \`output/schematic.json\` - EasyEDA importable schematic
✅ \`output/bom.md\` - LCSC-ready BOM
✅ \`output/design-report.md\` - Design validation report

## Schematic Statistics

- **Components:** ${schematicData.components?.length || 0}
- **Nets:** ${schematicData.nets?.length || 0}
- **Power Symbols:** ${schematicData.power_symbols?.length || 0}
- **Labels:** ${schematicData.labels?.length || 0}

## Next Steps

1. Open EasyEDA Pro
2. Use extension: Tools → Import AI Schematic
3. Select: \`output/schematic.json\`
4. Review imported schematic
5. Generate PCB layout
6. Export for manufacturing

## Status

✅ Ready to import into EasyEDA Pro
`;

    const summaryPath = path.join(OUTPUT_PATH, 'INTEGRATION-SUMMARY.md');
    fs.writeFileSync(summaryPath, summary.trim(), 'utf8');

    this.log('   ✓ Summary report generated');
  }

  /**
   * Generate import instructions
   */
  generateImportInstructions() {
    return `
╔════════════════════════════════════════════════════════════╗
║          HOW TO IMPORT INTO EASYEDA PRO                    ║
╚════════════════════════════════════════════════════════════╝

METHOD 1: Using Extension (Recommended)
----------------------------------------
1. Open EasyEDA Pro
2. Go to: Tools → Import AI Schematic
3. Select file: output/schematic.json
4. Click Import
5. Review schematic
6. Save project

METHOD 2: Manual JSON Import
-----------------------------
1. Open EasyEDA Pro
2. File → Import → EasyEDA JSON
3. Select: output/schematic.json
4. Manually adjust component positions if needed
5. Connect nets
6. Save project

METHOD 3: Direct File Drop
---------------------------
1. Open EasyEDA Pro
2. Drag output/schematic.json into EasyEDA window
3. Confirm import
4. Review and adjust

╔════════════════════════════════════════════════════════════╗
║                     TROUBLESHOOTING                        ║
╚════════════════════════════════════════════════════════════╝

If import fails:
- Check EasyEDA Pro version (need 2.0+)
- Verify JSON format (should start with "docType": "EasyEDA Schematic")
- Try Method 2 (manual import)
- Check extension installation

For help: See EASYEDA-INTEGRATION-GUIDE.md
`.trim();
  }

  /**
   * Print next steps
   */
  printNextSteps() {
    console.log('📂 Generated Files:');
    console.log('   output/schematic.json       - Import this into EasyEDA');
    console.log('   output/bom.md               - LCSC-ready BOM');
    console.log('   output/design-report.md     - Design validation');
    console.log('   output/INTEGRATION-SUMMARY.md - Summary report');
    console.log('   output/IMPORT-INSTRUCTIONS.txt - Import guide');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Open EasyEDA Pro');
    console.log('   2. Tools → Import AI Schematic');
    console.log('   3. Select: output/schematic.json');
    console.log('   4. Generate PCB layout');
    console.log('   5. Order from JLCPCB');
    console.log('');
    console.log('📚 Documentation:');
    console.log('   See: EASYEDA-INTEGRATION-GUIDE.md');
  }

  /**
   * Log with optional verbose mode
   */
  log(message) {
    if (this.verbose || !message.startsWith('   ')) {
      console.log(message);
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    requirements: args.find(arg => !arg.startsWith('-'))
  };

  const manager = new IntegrationManager();
  
  manager.run(options)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = IntegrationManager;
