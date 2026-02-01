/**
 * Multi-Model AI Orchestrator for PCB Design
 * Uses different models for different strengths:
 * - DeepSeek-R1: Deep reasoning and analysis
 * - Llama 3.1: Design collaboration and suggestions
 * - Phi-4: Precise component calculations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MultiModelOrchestrator {
  constructor(ollamaUrl = 'http://127.0.0.1:11434') {
    this.ollamaUrl = ollamaUrl;
    
    // Model configuration
    this.models = {
      reasoning: 'deepseek-r1:7b',      // Deep analysis, reasoning
      design: 'llama3.1:8b',             // Design suggestions, collaboration
      math: 'phi4:14b'                   // Precise calculations
    };

    // Design memory - maintains context across iterations
    this.designMemory = {
      requirements: [],
      iterations: [],
      decisions: [],
      calculations: [],
      issues_fixed: [],
      current_version: 0
    };

    // Load electronics knowledge
    this.knowledgeBase = this.loadKnowledgeBase();
    
    // Datasheet cache
    this.datasheets = new Map();
  }

  /**
   * Load electronics knowledge base
   */
  loadKnowledgeBase() {
    try {
      const trainingDataPath = path.join(__dirname, 'ai-training-data');
      const files = fs.readdirSync(trainingDataPath);
      const latestTraining = files
        .filter(f => f.startsWith('training-data_'))
        .sort()
        .pop();
      
      if (latestTraining) {
        const data = JSON.parse(
          fs.readFileSync(path.join(trainingDataPath, latestTraining), 'utf8')
        );
        return data.electronics_knowledge;
      }
    } catch (e) {
      console.log('⚠️  No training data found. Run training-data-generator.js first.');
    }
    
    return this.getDefaultKnowledge();
  }

  /**
   * Default electronics knowledge
   */
  getDefaultKnowledge() {
    return {
      components: {},
      designRules: {
        power: 'Always use decoupling caps, common ground, bulk filtering',
        signals: 'Short traces, 45° bends, proper termination',
        thermal: 'Calculate power dissipation, add thermal relief',
        emc: 'Ground plane, ferrite beads, filtering'
      },
      calculations: {
        ohmsLaw: 'V = I × R',
        power: 'P = V × I = I² × R = V² / R',
        rcTiming: 'τ = R × C',
        ledResistor: 'R = (Vsupply - Vled) / I_desired'
      }
    };
  }

  /**
   * Query a specific model
   */
  async queryModel(modelName, prompt, systemPrompt = null) {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_ctx: 8192  // Large context for design memory
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return `❌ Cannot connect to Ollama. Please ensure:
1. Ollama is running: ollama serve
2. Model is pulled: ollama pull ${modelName}`;
      }
      throw error;
    }
  }

  /**
   * DeepSeek-R1: Deep reasoning and analysis
   */
  async analyzeWithReasoning(pcbData, question = null) {
    const systemPrompt = `You are DeepSeek-R1, an expert in electronics engineering with deep reasoning capabilities.

Your role: Analyze PCB designs deeply, identify potential issues, reason through complex problems.

Electronics Knowledge:
${JSON.stringify(this.knowledgeBase, null, 2)}

Design Memory (previous iterations):
${JSON.stringify(this.designMemory, null, 2)}

When analyzing:
1. Think step-by-step through the problem
2. Consider electrical specifications (voltage, current, power)
3. Check for design rule violations
4. Identify potential failure modes
5. Suggest improvements with reasoning
6. Reference industry best practices`;

    const prompt = question || `Analyze this PCB design in detail:

${JSON.stringify(pcbData, null, 2)}

Provide deep analysis:
1. Design validation (electrical, thermal, signal integrity)
2. Potential issues and failure modes
3. Missing components or connections
4. Safety concerns
5. Improvement suggestions with reasoning
6. Risk assessment

Think through each aspect systematically.`;

    console.log('🧠 DeepSeek-R1: Deep reasoning...');
    const response = await this.queryModel(this.models.reasoning, prompt, systemPrompt);
    
    // Save to design memory
    this.designMemory.iterations.push({
      version: this.designMemory.current_version,
      timestamp: new Date().toISOString(),
      type: 'reasoning_analysis',
      analysis: response
    });
    
    return response;
  }

  /**
   * Llama 3.1: Design collaboration and suggestions
   */
  async collaborateOnDesign(requirements, currentDesign = null) {
    const systemPrompt = `You are Llama 3.1, a collaborative PCB design assistant and creative partner.

Your role: Help brainstorm, suggest alternatives, provide design ideas, and act as a design partner.

Electronics Knowledge:
${JSON.stringify(this.knowledgeBase, null, 2)}

Design History:
${JSON.stringify(this.designMemory.iterations.slice(-3), null, 2)}

As a design partner:
1. Suggest creative solutions
2. Provide multiple component options
3. Explain trade-offs clearly
4. Consider cost, availability, performance
5. Be encouraging and supportive
6. Build on previous iterations`;

    const prompt = currentDesign 
      ? `We're working on this design:
${JSON.stringify(currentDesign, null, 2)}

Requirements: ${requirements}

As my design partner:
1. Suggest component alternatives
2. Propose improvements
3. Discuss trade-offs
4. Recommend next steps
5. Consider manufacturability

Let's iterate on this design together!`
      : `I need help designing a PCB:

Requirements: ${requirements}

As my design partner:
1. Suggest overall architecture
2. Recommend components
3. Discuss design approaches
4. Consider different options
5. Help me make informed decisions

Let's brainstorm together!`;

    console.log('🤝 Llama 3.1: Design collaboration...');
    const response = await this.queryModel(this.models.design, prompt, systemPrompt);
    
    // Save suggestions to memory
    this.designMemory.iterations.push({
      version: this.designMemory.current_version,
      timestamp: new Date().toISOString(),
      type: 'design_collaboration',
      suggestions: response
    });
    
    return response;
  }

  /**
   * Phi-4: Precise component calculations
   */
  async calculateComponents(specification, showWork = true) {
    const systemPrompt = `You are Phi-4, a specialized AI for precise electronics calculations and component value determination.

Your role: Perform accurate electrical calculations, determine component values, verify specifications.

Calculation Library:
${JSON.stringify(this.knowledgeBase.calculations, null, 2)}

Previous Calculations:
${JSON.stringify(this.designMemory.calculations.slice(-5), null, 2)}

For all calculations:
1. Show every step clearly
2. Use proper formulas
3. Include units throughout
4. Provide standard E-series values
5. Calculate power ratings
6. Add safety margins (20% typical)
7. Double-check math
8. Explain reasoning

CRITICAL: Be extremely precise with numbers. Show all intermediate steps.`;

    const prompt = `Calculate component values for:

${specification}

Requirements:
1. Show complete calculations with formulas
2. Provide step-by-step work
3. Give standard component values
4. Calculate power dissipation
5. Include safety margins
6. Specify component ratings (voltage, current, power)
7. Recommend specific part types

${showWork ? 'SHOW ALL WORK - Every calculation step must be visible.' : ''}`;

    console.log('🔢 Phi-4: Precise calculations...');
    const response = await this.queryModel(this.models.math, prompt, systemPrompt);
    
    // Parse and save calculations
    this.designMemory.calculations.push({
      timestamp: new Date().toISOString(),
      specification: specification,
      result: response
    });
    
    return response;
  }

  /**
   * Analyze PDF datasheet (extracts text for model)
   */
  async analyzeDatasheet(pdfPath, component, query = null) {
    console.log(`📄 Analyzing datasheet: ${pdfPath}`);
    
    // Check if already cached
    if (this.datasheets.has(component)) {
      console.log('   (using cached datasheet data)');
    } else {
      console.log('   Reading PDF...');
      // In production, use pdf-parse or similar
      // For now, provide structure for manual input
      this.datasheets.set(component, {
        component: component,
        extracted: 'PDF extraction would go here',
        specs: {
          voltage: 'Extract from PDF',
          current: 'Extract from PDF',
          pinout: 'Extract from PDF',
          recommendations: 'Extract from PDF'
        }
      });
    }

    const datasheetData = this.datasheets.get(component);
    
    const prompt = query 
      ? `Based on this datasheet data for ${component}:
${JSON.stringify(datasheetData, null, 2)}

Question: ${query}

Provide detailed answer with references to datasheet sections.`
      : `Summarize key specifications from ${component} datasheet:
${JSON.stringify(datasheetData, null, 2)}

Extract:
1. Operating voltage range
2. Current ratings
3. Recommended operating conditions
4. Application circuits
5. Critical design considerations`;

    // Use reasoning model for datasheet analysis
    return await this.analyzeWithReasoning(datasheetData, prompt);
  }

  /**
   * Complete design workflow - orchestrate all models
   */
  async completeDesignWorkflow(requirements, existingDesign = null) {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STARTING MULTI-MODEL PCB DESIGN WORKFLOW');
    console.log('='.repeat(80) + '\n');

    this.designMemory.requirements.push({
      timestamp: new Date().toISOString(),
      requirements: requirements
    });

    const results = {
      iteration: ++this.designMemory.current_version,
      timestamp: new Date().toISOString(),
      requirements: requirements
    };

    // Phase 1: Design Collaboration (Llama 3.1)
    console.log('\n📍 PHASE 1: Design Collaboration\n');
    results.collaboration = await this.collaborateOnDesign(requirements, existingDesign);
    console.log('\n' + results.collaboration);

    // Phase 2: Deep Analysis (DeepSeek-R1)
    console.log('\n\n📍 PHASE 2: Deep Reasoning & Analysis\n');
    results.analysis = await this.analyzeWithReasoning(
      existingDesign || { requirements: requirements }
    );
    console.log('\n' + results.analysis);

    // Phase 3: Component Calculations (Phi-4)
    console.log('\n\n📍 PHASE 3: Component Value Calculations\n');
    
    // Extract calculation needs from analysis
    const calcPrompt = `Based on these requirements and analysis:

Requirements: ${requirements}

Analysis summary: ${results.analysis.substring(0, 500)}...

Calculate all necessary component values:
1. Resistors (current limiting, pull-ups/downs, gate resistors)
2. Capacitors (decoupling, bulk filtering, timing)
3. Power calculations (dissipation, supply requirements)
4. Trace widths for current capacity
5. Any other electrical parameters

Show complete calculations for each.`;

    results.calculations = await this.calculateComponents(calcPrompt);
    console.log('\n' + results.calculations);

    // Phase 4: Synthesis - combine insights
    console.log('\n\n📍 PHASE 4: Design Synthesis\n');
    results.synthesis = this.synthesizeResults(results);
    console.log('\n' + results.synthesis);

    // Save complete iteration
    this.designMemory.iterations.push({
      version: results.iteration,
      timestamp: results.timestamp,
      complete_results: results
    });

    return results;
  }

  /**
   * Synthesize results from all models
   */
  synthesizeResults(results) {
    return `
╔════════════════════════════════════════════════════════════════════════════╗
║                     DESIGN SYNTHESIS - ITERATION ${results.iteration}                         ║
╚════════════════════════════════════════════════════════════════════════════╝

Requirements:
${results.requirements}

🤝 Design Collaboration Highlights:
${this.extractKeyPoints(results.collaboration, 3)}

🧠 Deep Analysis Key Findings:
${this.extractKeyPoints(results.analysis, 3)}

🔢 Critical Calculations:
${this.extractKeyPoints(results.calculations, 5)}

📋 ACTION ITEMS:
${this.generateActionItems(results)}

💾 Design Memory Updated:
- Total iterations: ${this.designMemory.current_version}
- Decisions made: ${this.designMemory.decisions.length}
- Calculations stored: ${this.designMemory.calculations.length}

🔄 Next Steps:
1. Review calculated component values
2. Update PCB markdown specification
3. Re-parse and validate design
4. Iterate if needed (run workflow again)
5. Proceed to EasyEDA implementation

Ready for next iteration or implementation!
`;
  }

  /**
   * Extract key points from model response
   */
  extractKeyPoints(text, count = 3) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.slice(0, count).map((line, i) => `  ${i + 1}. ${line.trim()}`).join('\n');
  }

  /**
   * Generate actionable items
   */
  generateActionItems(results) {
    const items = [];
    
    // Extract from calculations
    if (results.calculations.includes('resistor') || results.calculations.includes('Ω')) {
      items.push('Add calculated resistors to BOM');
    }
    if (results.calculations.includes('capacitor') || results.calculations.includes('µF')) {
      items.push('Add calculated capacitors to BOM');
    }
    
    // Extract from analysis
    if (results.analysis.toLowerCase().includes('missing')) {
      items.push('Add missing components identified in analysis');
    }
    if (results.analysis.toLowerCase().includes('issue')) {
      items.push('Fix issues identified in deep analysis');
    }
    
    return items.map((item, i) => `  ${i + 1}. ${item}`).join('\n') || '  All good! Ready for implementation.';
  }

  /**
   * Iterative improvement - compare versions
   */
  async improveDesign(currentDesign, issuesFeedback) {
    console.log('\n🔄 ITERATIVE IMPROVEMENT\n');

    // Record issues fixed
    this.designMemory.issues_fixed.push({
      iteration: this.designMemory.current_version,
      issues: issuesFeedback
    });

    // Get improvement suggestions from all models
    const improvements = {
      reasoning: await this.analyzeWithReasoning(
        currentDesign,
        `Previous issues: ${issuesFeedback}\n\nWhat improvements address these issues?`
      ),
      design: await this.collaborateOnDesign(
        `Improve design based on: ${issuesFeedback}`,
        currentDesign
      )
    };

    return improvements;
  }

  /**
   * Save design memory to file
   */
  saveDesignMemory(projectName) {
    const memoryPath = path.join(__dirname, 'design-memory', `${projectName}_memory.json`);
    
    if (!fs.existsSync(path.dirname(memoryPath))) {
      fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
    }

    fs.writeFileSync(memoryPath, JSON.stringify(this.designMemory, null, 2));
    console.log(`\n💾 Design memory saved: ${memoryPath}`);
  }

  /**
   * Load design memory from file
   */
  loadDesignMemory(projectName) {
    const memoryPath = path.join(__dirname, 'design-memory', `${projectName}_memory.json`);
    
    if (fs.existsSync(memoryPath)) {
      this.designMemory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
      console.log(`\n📂 Design memory loaded: ${memoryPath}`);
      console.log(`   Iterations: ${this.designMemory.iterations.length}`);
      console.log(`   Version: ${this.designMemory.current_version}`);
      return true;
    }
    return false;
  }

  /**
   * Check which models are available
   */
  async checkModels() {
    console.log('\n🔍 Checking available models...\n');
    
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      const data = await response.json();
      const available = data.models.map(m => m.name);
      
      const status = {
        reasoning: available.some(m => m.includes('deepseek-r1')),
        design: available.some(m => m.includes('llama3.1')),
        math: available.some(m => m.includes('phi4'))
      };

      console.log('Model Status:');
      console.log(`  DeepSeek-R1 7B: ${status.reasoning ? '✅ Available' : '❌ Not installed'}`);
      console.log(`  Llama 3.1 8B:   ${status.design ? '✅ Available' : '❌ Not installed'}`);
      console.log(`  Phi-4 14B:      ${status.math ? '✅ Available' : '❌ Not installed'}`);
      
      if (!status.reasoning || !status.design || !status.math) {
        console.log('\n📥 To install missing models:');
        if (!status.reasoning) console.log('  ollama pull deepseek-r1:7b');
        if (!status.design) console.log('  ollama pull llama3.1:8b');
        if (!status.math) console.log('  ollama pull phi4:14b');
      }
      
      return status;
    } catch (error) {
      console.log('❌ Cannot connect to Ollama. Please run: ollama serve');
      return { reasoning: false, design: false, math: false };
    }
  }
}

// Export
export { MultiModelOrchestrator };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new MultiModelOrchestrator();

  async function main() {
    const command = process.argv[2];

    if (command === 'check') {
      await orchestrator.checkModels();
      return;
    }

    if (command === 'workflow') {
      const requirements = process.argv[3] || 'PCB with 10 IR receivers and 10 IR LEDs';
      
      // Check for existing design
      const outputDir = path.join(__dirname, '..', 'output');
      const latestFile = path.join(outputDir, 'latest.json');
      let existingDesign = null;
      
      if (fs.existsSync(latestFile)) {
        existingDesign = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      }

      const results = await orchestrator.completeDesignWorkflow(requirements, existingDesign);
      
      // Save results
      const resultsPath = path.join(__dirname, 'design-memory', `workflow-results_${Date.now()}.json`);
      if (!fs.existsSync(path.dirname(resultsPath))) {
        fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
      }
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
      console.log(`\n\n💾 Complete results saved: ${resultsPath}`);
      
    } else if (command === 'analyze') {
      const outputDir = path.join(__dirname, '..', 'output');
      const latestFile = path.join(outputDir, 'latest.json');
      
      if (!fs.existsSync(latestFile)) {
        console.log('❌ No PCB design found. Run parser first.');
        return;
      }

      const pcbData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      const analysis = await orchestrator.analyzeWithReasoning(pcbData);
      console.log(analysis);
      
    } else if (command === 'collaborate') {
      const requirements = process.argv.slice(3).join(' ');
      const suggestions = await orchestrator.collaborateOnDesign(requirements);
      console.log(suggestions);
      
    } else if (command === 'calculate') {
      const spec = process.argv.slice(3).join(' ');
      const calculation = await orchestrator.calculateComponents(spec);
      console.log(calculation);
      
    } else {
      console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║          Multi-Model AI PCB Design Orchestrator                            ║
╚════════════════════════════════════════════════════════════════════════════╝

Uses three specialized models:
  🧠 DeepSeek-R1 7B  - Deep reasoning and analysis
  🤝 Llama 3.1 8B    - Design collaboration
  🔢 Phi-4 14B       - Precise calculations

Commands:
  node multi-model-orchestrator.js check
    → Check which models are installed

  node multi-model-orchestrator.js workflow "requirements"
    → Complete design workflow (all 3 models)

  node multi-model-orchestrator.js analyze
    → Deep analysis with DeepSeek-R1

  node multi-model-orchestrator.js collaborate "requirements"
    → Design brainstorming with Llama 3.1

  node multi-model-orchestrator.js calculate "specification"
    → Component calculations with Phi-4

Examples:
  node multi-model-orchestrator.js workflow "IR control with ESP32"
  node multi-model-orchestrator.js calculate "LED 100mA from 5V"
  node multi-model-orchestrator.js collaborate "add WiFi to my board"
      `);
    }
  }

  main().catch(console.error);
}
