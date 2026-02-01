#!/usr/bin/env node

/**
 * System Status Checker
 * 
 * Verifies all components of the automated PCB design system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemChecker {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run all checks
   */
  async runAll() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          SYSTEM STATUS CHECK                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await this.checkFolders();
    await this.checkFiles();
    await this.checkDependencies();
    await this.checkOllama();
    await this.checkKnowledge();
    
    this.printSummary();
  }

  /**
   * Check folder structure
   */
  async checkFolders() {
    console.log('📁 Checking Folder Structure...\n');

    const folders = [
      { path: 'inputs', desc: 'Input requirements' },
      { path: 'outputs', desc: 'All outputs' },
      { path: 'outputs/schematics', desc: 'Generated schematics' },
      { path: 'outputs/docs', desc: 'Documentation' },
      { path: 'outputs/pin-tables', desc: 'GPIO & pin tables' },
      { path: 'outputs/logs', desc: 'Processing logs' },
      { path: 'rules-md', desc: 'Design rules' },
      { path: 'examples-md', desc: 'Reference designs' },
      { path: 'pdf/datasheets-auto', desc: 'Downloaded datasheets' }
    ];

    for (const folder of folders) {
      const fullPath = path.join(__dirname, folder.path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        const files = fs.readdirSync(fullPath).length;
        console.log(`   ✅ ${folder.path.padEnd(30)} (${files} files)`);
        this.passed++;
      } else {
        console.log(`   ❌ ${folder.path.padEnd(30)} NOT FOUND!`);
        this.failed++;
      }
    }
    console.log('');
  }

  /**
   * Check critical files
   */
  async checkFiles() {
    console.log('📄 Checking Critical Files...\n');

    const files = [
      { path: 'auto-pcb-designer.js', desc: 'Main automation script' },
      { path: 'datasheet-downloader.js', desc: 'Datasheet downloader' },
      { path: 'component-knowledge-loader.js', desc: 'Knowledge loader' },
      { path: 'compiler-mvp.js', desc: 'Schematic compiler' },
      { path: 'convert-to-easyeda.js', desc: 'EasyEDA converter' },
      { path: 'package.json', desc: 'npm configuration' }
    ];

    for (const file of files) {
      const fullPath = path.join(__dirname, file.path);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        const size = fs.statSync(fullPath).size;
        const sizeKB = (size / 1024).toFixed(1);
        console.log(`   ✅ ${file.path.padEnd(35)} (${sizeKB} KB)`);
        this.passed++;
      } else {
        console.log(`   ❌ ${file.path.padEnd(35)} NOT FOUND!`);
        this.failed++;
      }
    }
    console.log('');
  }

  /**
   * Check npm dependencies
   */
  async checkDependencies() {
    console.log('📦 Checking npm Dependencies...\n');

    const deps = ['pdf-parse', 'uuid', 'markdown-it', 'nodemon'];

    for (const dep of deps) {
      const depPath = path.join(__dirname, 'node_modules', dep);
      const exists = fs.existsSync(depPath);
      
      if (exists) {
        console.log(`   ✅ ${dep.padEnd(20)} installed`);
        this.passed++;
      } else {
        console.log(`   ⚠️  ${dep.padEnd(20)} NOT installed`);
        this.failed++;
      }
    }
    console.log('');
  }

  /**
   * Check Ollama
   */
  async checkOllama() {
    console.log('🤖 Checking Ollama AI...\n');

    try {
      // Check if ollama command exists
      execSync('which ollama', { stdio: 'pipe' });
      console.log('   ✅ Ollama CLI installed');
      this.passed++;

      // Check if ollama is running
      try {
        const models = execSync('ollama list', { stdio: 'pipe' }).toString();
        console.log('   ✅ Ollama service running');
        this.passed++;

        // Check for required models
        const requiredModels = ['llama3.1:8b', 'deepseek-r1:7b', 'phi4:14b'];
        console.log('\n   📋 Checking models:');
        
        for (const model of requiredModels) {
          const modelBase = model.split(':')[0];
          if (models.includes(modelBase)) {
            console.log(`      ✅ ${model}`);
            this.passed++;
          } else {
            console.log(`      ⚠️  ${model} NOT installed`);
            console.log(`         Run: ollama pull ${model}`);
            this.failed++;
          }
        }
      } catch (error) {
        console.log('   ❌ Ollama service NOT running');
        console.log('      Run: ollama serve');
        this.failed++;
      }
    } catch (error) {
      console.log('   ❌ Ollama NOT installed');
      console.log('      Install: curl https://ollama.ai/install.sh | sh');
      this.failed++;
    }
    console.log('');
  }

  /**
   * Check component knowledge base
   */
  async checkKnowledge() {
    console.log('📚 Checking Component Knowledge...\n');

    const knowledgeDir = path.join(__dirname, 'pdf/datasheets-auto');
    
    if (!fs.existsSync(knowledgeDir)) {
      console.log('   ⚠️  No datasheets downloaded yet');
      console.log('      Run: npm run download ESP32 IC');
      this.failed++;
      console.log('');
      return;
    }

    const files = fs.readdirSync(knowledgeDir);
    const specFiles = files.filter(f => f.endsWith('_specs.json'));
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));

    console.log(`   📊 Datasheet Statistics:`);
    console.log(`      PDFs: ${pdfFiles.length}`);
    console.log(`      Extracted specs: ${specFiles.length}`);

    if (specFiles.length > 0) {
      console.log(`\n   📋 Components with knowledge:`);
      specFiles.slice(0, 10).forEach(f => {
        const name = f.replace('_specs.json', '').toUpperCase();
        console.log(`      ✅ ${name}`);
      });
      if (specFiles.length > 10) {
        console.log(`      ... and ${specFiles.length - 10} more`);
      }
      this.passed++;
    } else {
      console.log('   ⚠️  No specs extracted yet');
      console.log('      Run: npm run download <COMPONENT> IC');
      this.failed++;
    }
    console.log('');
  }

  /**
   * Print summary
   */
  printSummary() {
    const total = this.passed + this.failed;
    const percentage = ((this.passed / total) * 100).toFixed(1);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  SUMMARY                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`   ✅ Passed: ${this.passed}/${total}`);
    console.log(`   ❌ Failed: ${this.failed}/${total}`);
    console.log(`   📊 Success Rate: ${percentage}%\n`);

    if (this.failed === 0) {
      console.log('🎉 ALL SYSTEMS OPERATIONAL!\n');
      console.log('Ready to use:');
      console.log('   npm run auto      ← Start automated monitoring');
      console.log('   npm run download  ← Download datasheets');
      console.log('   npm run compile   ← Generate schematic\n');
    } else {
      console.log('⚠️  Some checks failed. Fix issues above.\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const checker = new SystemChecker();
  await checker.runAll();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { SystemChecker };
