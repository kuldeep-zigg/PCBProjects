#!/usr/bin/env node

/**
 * INTELLIGENT COMPONENT VALIDATOR & SMART LEARNING SYSTEM
 * 
 * Features:
 * 1. Validates if text is a real IC/component or instruction/rule
 * 2. Multi-source data gathering (AllDataSheet, GitHub, public APIs)
 * 3. Smart automation for continuous learning
 * 4. JSON conversion for all data sources
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class SmartLearningSystem {
  constructor() {
    this.knowledgeDir = path.join(__dirname, 'knowledge-base');
    this.rulesDir = path.join(__dirname, 'rules-md');
    
    // Public data sources
    this.dataSources = {
      allDataSheet: 'https://www.alldatasheet.com',
      octopart: 'https://octopart.com/api/v4/endpoint',
      digikey: 'https://api.digikey.com/products/v4',
      mouser: 'https://api.mouser.com/api/v1',
      github: 'https://api.github.com',
      
      // Public component databases
      publicAPIs: [
        'https://componentsearchengine.com',
        'https://www.snapeda.com',
        'https://www.samacsys.com'
      ]
    };
    
    // Component patterns (IC/electronic components)
    this.componentPatterns = {
      icPatterns: [
        /^[A-Z]{2,4}\d{3,}/i,          // LM358, MAX232, STM32, etc
        /^\d{2,4}[A-Z]{1,4}\d*/i,      // 74HC595, 555, etc
        /^[A-Z]+\d+[A-Z]?\d*$/i,       // ESP32 (exact match)
      ],
      
      notComponentPatterns: [
        /^(use|connect|add|make|build|create|design|implement|always|never|should|must)/i,
        /\b(instruction|rule|guideline|convention|practice|recommendation)\b/i,
        /(how to|please|can you|i want|we need|you should)/i,
        /\b(near|between|across|before|after|when|where|why)\b/i,
        /(capacitor|resistor|inductor)\s+(near|across|between)/i // "capacitor near IC"
      ]
    };
  }

  /**
   * STEP 1: Validate if text is a component or instruction
   */
  async validateComponent(text) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         INTELLIGENT COMPONENT VALIDATION                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📝 Analyzing: "${text}"\n`);

    // Check if it matches component patterns
    const isComponent = this.componentPatterns.icPatterns.some(pattern => 
      pattern.test(text)
    );

    // Check if it matches instruction patterns
    const isInstruction = this.componentPatterns.notComponentPatterns.some(pattern => 
      pattern.test(text)
    );

    // Use AI for ambiguous cases
    if (!isComponent && !isInstruction) {
      console.log('⚠️  Ambiguous - asking AI for validation...');
      return await this.aiValidation(text);
    }

    if (isInstruction) {
      console.log('✅ Classification: INSTRUCTION/RULE');
      console.log('📋 Action: Store as design rule or convention\n');
      return {
        type: 'instruction',
        text: text,
        action: 'store_as_rule'
      };
    }

    if (isComponent) {
      console.log('✅ Classification: ELECTRONIC COMPONENT');
      console.log('🔍 Action: Search for technical data\n');
      return {
        type: 'component',
        name: text,
        action: 'search_datasheet'
      };
    }

    return { type: 'unknown', text: text };
  }

  /**
   * STEP 2: AI-based validation using Ollama
   */
  async aiValidation(text) {
    const prompt = `Analyze this text and determine if it's:
A) An electronic component/IC (like LM358, ESP32, resistor, capacitor)
B) An instruction or design rule (like "use bypass capacitors", "connect power")

Text: "${text}"

Respond ONLY with JSON:
{
  "type": "component" or "instruction",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.callOllama(prompt);
      const result = JSON.parse(response);
      
      console.log(`\n🤖 AI Classification:`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Confidence: ${result.confidence}%`);
      console.log(`   Reasoning: ${result.reasoning}\n`);

      return {
        type: result.type,
        text: text,
        confidence: result.confidence,
        action: result.type === 'component' ? 'search_datasheet' : 'store_as_rule'
      };
    } catch (error) {
      console.log('⚠️  AI validation failed, using pattern matching');
      return { type: 'unknown', text: text };
    }
  }

  /**
   * STEP 3: Multi-source data gathering for components
   */
  async gatherComponentData(componentName) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         MULTI-SOURCE DATA GATHERING                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n🔍 Component: ${componentName}\n`);

    const results = {
      component: componentName,
      sources: {},
      timestamp: new Date().toISOString()
    };

    // Source 1: AllDataSheet
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ [1/5] Searching AllDataSheet.com');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    try {
      const allDataSheetResult = await this.searchAllDataSheet(componentName);
      results.sources.allDataSheet = allDataSheetResult;
      console.log(`   ✅ Found: ${allDataSheetResult.datasheets?.length || 0} datasheets`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.sources.allDataSheet = { error: error.message };
    }

    // Source 2: GitHub (search for example code/schematics)
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ [2/5] Searching GitHub repositories');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    try {
      const githubResult = await this.searchGitHub(componentName);
      results.sources.github = githubResult;
      console.log(`   ✅ Found: ${githubResult.repositories?.length || 0} repositories`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.sources.github = { error: error.message };
    }

    // Source 3: Public Component APIs
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ [3/5] Querying public component APIs');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    try {
      const apiResult = await this.queryPublicAPIs(componentName);
      results.sources.publicAPIs = apiResult;
      console.log(`   ✅ Found: ${apiResult.results?.length || 0} results`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.sources.publicAPIs = { error: error.message };
    }

    // Source 4: Web scraping (AllDataSheet detailed page)
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ [4/5] Scraping detailed specifications');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    try {
      const webResult = await this.scrapeDetailedSpecs(componentName);
      results.sources.webScrape = webResult;
      console.log(`   ✅ Extracted: ${Object.keys(webResult.specs || {}).length} specifications`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.sources.webScrape = { error: error.message };
    }

    // Source 5: AI analysis and synthesis
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ [5/5] AI synthesis of all data');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    try {
      const aiSynthesis = await this.aiSynthesizeData(results);
      results.aiSynthesis = aiSynthesis;
      console.log(`   ✅ Synthesized complete component profile\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      results.aiSynthesis = { error: error.message };
    }

    // Save to JSON
    await this.saveAsJSON(componentName, results);
    
    return results;
  }

  /**
   * Search AllDataSheet.com
   */
  async searchAllDataSheet(componentName) {
    const searchUrl = `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(componentName)}`;
    
    return new Promise((resolve, reject) => {
      https.get(searchUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          try {
            // Parse HTML and extract datasheet links
            const datasheetLinks = this.extractDatasheetLinks(data);
            
            // Get detailed info from first link
            let detailedSpecs = null;
            if (datasheetLinks.length > 0) {
              detailedSpecs = await this.fetchDetailedSpecs(datasheetLinks[0]);
            }
            
            resolve({
              searchUrl,
              datasheets: datasheetLinks,
              detailedSpecs,
              htmlLength: data.length
            });
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Search GitHub for example code/schematics
   */
  async searchGitHub(componentName) {
    const query = encodeURIComponent(`${componentName} schematic OR circuit OR arduino OR esp32`);
    const apiUrl = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`;
    
    return new Promise((resolve, reject) => {
      const options = {
        headers: { 'User-Agent': 'PCB-Designer-Bot' }
      };
      
      https.get(apiUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const repos = json.items?.map(repo => ({
              name: repo.name,
              description: repo.description,
              stars: repo.stargazers_count,
              url: repo.html_url,
              readme: `${repo.url}/readme`
            })) || [];
            
            resolve({
              query: componentName,
              repositories: repos,
              totalFound: json.total_count || 0
            });
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Query public component APIs
   */
  async queryPublicAPIs(componentName) {
    // Note: Most component APIs require authentication
    // This is a placeholder for public sources
    
    const results = {
      component: componentName,
      results: [],
      note: 'Most component APIs require API keys. Check MASTER.md for setup.'
    };

    // Example: SnapEDA public search (no auth required)
    try {
      const snapedaUrl = `https://www.snapeda.com/search/?q=${encodeURIComponent(componentName)}`;
      results.results.push({
        source: 'SnapEDA',
        searchUrl: snapedaUrl,
        note: 'Visit URL for component symbols and footprints'
      });
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }

  /**
   * Scrape detailed specifications
   */
  async scrapeDetailedSpecs(componentName) {
    // Use Puppeteer if available, otherwise basic scraping
    return {
      component: componentName,
      specs: {},
      note: 'Install Puppeteer for advanced scraping: npm install puppeteer'
    };
  }

  /**
   * AI synthesis of all gathered data
   */
  async aiSynthesizeData(allData) {
    const prompt = `Analyze all gathered data and create a comprehensive component profile:

Component: ${allData.component}

Data sources:
${JSON.stringify(allData.sources, null, 2)}

Generate a complete JSON profile with:
- Component name and type
- Key specifications (voltage, current, pins, package)
- Typical applications
- Design recommendations
- Example circuits

Respond ONLY with valid JSON.`;

    try {
      const response = await this.callOllama(prompt);
      return JSON.parse(response);
    } catch (error) {
      return { error: 'AI synthesis failed' };
    }
  }

  /**
   * Extract datasheet links from HTML
   */
  extractDatasheetLinks(html) {
    const links = [];
    const pdfRegex = /href="([^"]*\.pdf[^"]*)"/gi;
    const viewRegex = /href="(\/datasheet-pdf\/[^"]*)"/gi;
    
    let match;
    while ((match = pdfRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    while ((match = viewRegex.exec(html)) !== null) {
      links.push(`https://www.alldatasheet.com${match[1]}`);
    }
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Fetch detailed specifications from a datasheet page
   */
  async fetchDetailedSpecs(url) {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            url,
            specs: this.extractSpecsFromHTML(data)
          });
        });
      }).on('error', () => resolve({ url, error: 'Failed to fetch' }));
    });
  }

  /**
   * Extract specifications from HTML
   */
  extractSpecsFromHTML(html) {
    const specs = {};
    
    // Common specification patterns
    const patterns = {
      voltage: /(?:supply\s+voltage|vcc|vdd)[:\s]*([0-9.]+\s*(?:v|volts?))/i,
      current: /(?:current|icc)[:\s]*([0-9.]+\s*(?:ma|ua|a))/i,
      temperature: /(?:operating\s+temperature)[:\s]*(-?[0-9.]+\s*°?c\s*to\s*[0-9.]+\s*°?c)/i,
      package: /(?:package|case)[:\s]*([a-z0-9-]+)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = html.match(pattern);
      if (match) {
        specs[key] = match[1].trim();
      }
    }

    return specs;
  }

  /**
   * Store instruction/rule
   */
  async storeAsRule(text) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         STORING AS DESIGN RULE                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📋 Rule: "${text}"\n`);

    const rulesFile = path.join(this.rulesDir, 'AUTO_GENERATED_RULES.md');
    
    try {
      let existingRules = '';
      try {
        existingRules = await fs.readFile(rulesFile, 'utf8');
      } catch (error) {
        // File doesn't exist yet
        existingRules = '# Auto-Generated Design Rules\n\n';
      }

      const timestamp = new Date().toISOString();
      const newRule = `\n## Rule added ${timestamp}\n\n${text}\n\n---\n`;
      
      await fs.writeFile(rulesFile, existingRules + newRule);
      console.log('✅ Rule stored successfully\n');
      
      return { success: true, file: rulesFile };
    } catch (error) {
      console.log(`❌ Failed to store rule: ${error.message}\n`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save data as JSON
   */
  async saveAsJSON(componentName, data) {
    const filename = `${componentName.replace(/[^a-z0-9]/gi, '_')}_complete.json`;
    const filepath = path.join(this.knowledgeDir, 'web-scraped', filename);
    
    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`\n💾 Data saved: ${filepath}\n`);
      return filepath;
    } catch (error) {
      console.log(`\n❌ Failed to save: ${error.message}\n`);
      return null;
    }
  }

  /**
   * Call Ollama API
   */
  async callOllama(prompt, model = 'deepseek-r1:7b') {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      });

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(response);
            resolve(json.response || '');
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Main processing function
   */
  async processInput(input) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║    SMART LEARNING SYSTEM - AUTOMATED PROCESSING            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📥 Input: "${input}"\n`);

    // Step 1: Validate component or instruction
    const validation = await this.validateComponent(input);

    // Step 2: Process based on type
    if (validation.action === 'search_datasheet') {
      // It's a component - gather data
      return await this.gatherComponentData(validation.name || input);
    } else if (validation.action === 'store_as_rule') {
      // It's an instruction - store as rule
      return await this.storeAsRule(validation.text);
    } else {
      console.log('⚠️  Unable to classify input - storing as reference text\n');
      return await this.storeAsRule(`[Reference] ${input}`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args.join(' ') || 'LM358';

  const learner = new SmartLearningSystem();
  learner.processInput(input)
    .then(result => {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                   PROCESSING COMPLETE                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = SmartLearningSystem;
