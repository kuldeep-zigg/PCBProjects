/**
 * Ollama Local AI Integration for PCB Design
 * Connect to Ollama running locally to get AI-powered design assistance
 */

import fs from 'fs';
import path from 'path';

class OllamaIntegration {
  constructor(baseUrl = 'http://127.0.0.1:11434') {
    this.baseUrl = baseUrl;
    this.model = 'llama3.1:8b'; // Default model
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Build system prompt with electronics knowledge
   */
  buildSystemPrompt() {
    const trainingDataPath = path.join(process.cwd(), 'ai-training-data');
    let knowledgeBase = '';

    // Try to load training data if available
    try {
      const files = fs.readdirSync(trainingDataPath);
      const latestTraining = files
        .filter(f => f.startsWith('training-data_'))
        .sort()
        .pop();
      
      if (latestTraining) {
        const data = JSON.parse(
          fs.readFileSync(path.join(trainingDataPath, latestTraining), 'utf8')
        );
        knowledgeBase = JSON.stringify(data.electronics_knowledge, null, 2);
      }
    } catch (e) {
      console.log('Note: No training data found. Run training-data-generator.js first for enhanced responses.');
    }

    return `You are an expert electronics engineer specializing in PCB design and EasyEDA.

Your expertise includes:
- Circuit design and component selection
- PCB layout and routing best practices
- Power supply design and management
- Signal integrity and EMC considerations
- Electronics physics and calculations
- EasyEDA schematic and PCB design

Electronics Knowledge Base:
${knowledgeBase || 'Use standard electronics engineering principles'}

When helping with PCB design:
1. Always consider electrical specifications (voltage, current, power)
2. Apply Ohm's Law and power calculations
3. Recommend proper passive components (resistors, capacitors)
4. Ensure signal integrity and proper grounding
5. Follow PCB design best practices
6. Provide specific, actionable advice
7. Calculate component values with formulas
8. Warn about potential issues

Output format:
- Be concise but thorough
- Show calculations when relevant
- Provide component specifications
- Include best practices
- Mention potential issues/warnings`;
  }

  /**
   * Send request to Ollama
   */
  async query(userMessage, context = []) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...context,
            { role: 'user', content: userMessage }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return `❌ Error: Cannot connect to Ollama at ${this.baseUrl}
        
Please ensure Ollama is running:
1. Install Ollama from https://ollama.ai
2. Run: ollama serve
3. Pull model: ollama pull ${this.model}
4. Try again`;
      }
      throw error;
    }
  }

  /**
   * Analyze PCB design with AI
   */
  async analyzePCBDesign(pcbData) {
    const prompt = `Analyze this PCB design and provide feedback:

Design: ${pcbData.metadata.title}

Components:
${JSON.stringify(pcbData.components, null, 2)}

Connections:
${JSON.stringify(pcbData.connections, null, 2)}

Please provide:
1. Design validation
2. Potential issues or improvements
3. Missing components (decoupling caps, pull-ups, etc.)
4. Calculations for passive components
5. PCB layout recommendations`;

    return await this.query(prompt);
  }

  /**
   * Get component suggestions
   */
  async suggestComponents(requirements) {
    const prompt = `I need component suggestions for a PCB project:

Requirements: ${requirements}

Please suggest:
1. Microcontroller (with reason)
2. Interface ICs if needed
3. Required passive components with values
4. Connectors
5. Any additional components needed

Include specifications and reasoning for each suggestion.`;

    return await this.query(prompt);
  }

  /**
   * Calculate component values
   */
  async calculateComponents(specification) {
    const prompt = `Help me calculate component values:

${specification}

Please provide:
1. Detailed calculations with formulas
2. Standard component values
3. Power ratings
4. Safety margins
5. Alternative options

Show all work and explain reasoning.`;

    return await this.query(prompt);
  }

  /**
   * Get PCB layout advice
   */
  async getPCBLayoutAdvice(pcbData) {
    const prompt = `Provide PCB layout guidance for this design:

${JSON.stringify(pcbData, null, 2)}

Please advise on:
1. Component placement strategy
2. Trace routing priorities
3. Ground plane usage
4. Power distribution
5. Signal integrity considerations
6. Specific EasyEDA implementation tips`;

    return await this.query(prompt);
  }

  /**
   * Troubleshoot design issues
   */
  async troubleshoot(issue, pcbData) {
    const prompt = `Help troubleshoot this PCB design issue:

Issue: ${issue}

Design context:
${JSON.stringify(pcbData, null, 2)}

Please:
1. Identify likely causes
2. Suggest solutions
3. Provide verification steps
4. Recommend preventive measures`;

    return await this.query(prompt);
  }

  /**
   * Interactive design conversation
   */
  async chat(conversationHistory) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    const context = conversationHistory.slice(0, -1);
    const response = await this.query(lastMessage.content, context);

    return {
      role: 'assistant',
      content: response
    };
  }

  /**
   * Check if Ollama is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          models: data.models.map(m => m.name)
        };
      }
      return { available: false };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Set active model
   */
  setModel(modelName) {
    this.model = modelName;
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models;
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }
}

// Export
export { OllamaIntegration };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const ollama = new OllamaIntegration();

  async function main() {
    // Check availability
    console.log('🔍 Checking Ollama availability...\n');
    const status = await ollama.checkAvailability();
    
    if (!status.available) {
      console.log('❌ Ollama is not available');
      console.log('\nSetup instructions:');
      console.log('1. Install Ollama: https://ollama.ai');
      console.log('2. Run: ollama serve');
      console.log('3. Pull a model: ollama pull llama3.1:8b');
      return;
    }

    console.log('✅ Ollama is available');
    console.log('📦 Available models:', status.models.join(', '));
    console.log('\n' + '='.repeat(80) + '\n');

    // Example query
    const command = process.argv[2];
    
    if (command === 'analyze') {
      // Load latest PCB design
      const outputDir = path.join(process.cwd(), '..', 'output');
      const latestFile = path.join(outputDir, 'latest.json');
      
      if (!fs.existsSync(latestFile)) {
        console.log('❌ No PCB design found. Run parser first.');
        return;
      }

      const pcbData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      console.log('🤖 Analyzing PCB design with AI...\n');
      
      const analysis = await ollama.analyzePCBDesign(pcbData);
      console.log(analysis);
      
    } else if (command === 'suggest') {
      const requirements = process.argv.slice(3).join(' ') || 
        'PCB with 10 IR receivers and 10 IR LEDs';
      
      console.log(`🤖 Getting component suggestions for: "${requirements}"\n`);
      const suggestions = await ollama.suggestComponents(requirements);
      console.log(suggestions);
      
    } else if (command === 'calculate') {
      const spec = process.argv.slice(3).join(' ') || 
        'LED with 5V supply, 1.35V forward voltage, 100mA current';
      
      console.log(`🤖 Calculating components for: "${spec}"\n`);
      const calculation = await ollama.calculateComponents(spec);
      console.log(calculation);
      
    } else if (command === 'chat') {
      const question = process.argv.slice(3).join(' ');
      if (!question) {
        console.log('Usage: node ollama-integration.js chat "your question"');
        return;
      }
      
      console.log(`🤖 Question: ${question}\n`);
      const response = await ollama.query(question);
      console.log(response);
      
    } else {
      console.log('AI PCB Design Assistant - Ollama Integration\n');
      console.log('Usage:');
      console.log('  node ollama-integration.js analyze           - Analyze latest PCB design');
      console.log('  node ollama-integration.js suggest "req"     - Get component suggestions');
      console.log('  node ollama-integration.js calculate "spec"  - Calculate component values');
      console.log('  node ollama-integration.js chat "question"   - Ask any question');
      console.log('\nExamples:');
      console.log('  node ollama-integration.js suggest "board with ESP32 and 5 sensors"');
      console.log('  node ollama-integration.js calculate "LED 2V forward, 20mA from 5V"');
      console.log('  node ollama-integration.js chat "What is a decoupling capacitor?"');
    }
  }

  main().catch(console.error);
}
