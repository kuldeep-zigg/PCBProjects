#!/usr/bin/env node

/**
 * Product search using Nexar API only (Octopart/Supply data).
 * Replaces multi-site browser scraping. Docs: https://support.nexar.com/support/solutions/101000253221/
 */

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { searchParts } = require('./nexar-api.js');
const http = require('http');

const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge-base', 'nexar');
const OLLAMA_DIR = path.join(__dirname, 'knowledge-base', 'ollama-extractions');

if (!fsSync.existsSync(KNOWLEDGE_DIR)) fsSync.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
if (!fsSync.existsSync(OLLAMA_DIR)) fsSync.mkdirSync(OLLAMA_DIR, { recursive: true });

/**
 * Search component via Nexar API and save JSON.
 */
async function search(component, limit = 15) {
  console.log(`🎯 Nexar search: ${component} (limit ${limit}).`);
  try {
    const data = await searchParts(component, limit);
    const results = data?.supSearch?.results || [];
    const parts = results.map(r => r.part).filter(Boolean);
    console.log(`✅ Nexar: ${parts.length} parts.`);

    const out = {
      component,
      query: component,
      timestamp: new Date().toISOString(),
      source: 'Nexar API (Octopart/Supply)',
      count: parts.length,
      parts
    };

    const file = path.join(KNOWLEDGE_DIR, `${component.replace(/[^a-zA-Z0-9-_]/g, '_')}_nexar.json`);
    await fs.writeFile(file, JSON.stringify(out, null, 2));
    console.log(`💾 Saved: ${path.basename(file)}.`);

    return out;
  } catch (error) {
    console.error(`❌ Nexar error: ${error.message}`);
    return { component, error: error.message, parts: [] };
  }
}

/**
 * Call Ollama to extract specs from Nexar part data (optional).
 */
function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: 'deepseek-r1:7b', prompt, stream: false });
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, res => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(buf);
          resolve(j.response || buf);
        } catch (_) {
          resolve(buf);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Search and optionally run Ollama extraction on part data.
 */
async function searchAndExtract(component, limit = 15, runOllama = false) {
  const out = await search(component, limit);
  if (out.parts.length === 0) return out;

  if (runOllama) {
    console.log('🚀 Ollama extraction...');
    try {
      const prompt = `Extract key specifications from this component data. Component: ${component}. Data: ${JSON.stringify(out.parts.slice(0, 5), null, 2).substring(0, 12000)}. Return ONLY a JSON object with: component, voltage, current, temperature, package, manufacturer, description, specifications.`;
      const response = await callOllama(prompt);
      let specs = {};
      try {
        const m = response.match(/\{[\s\S]*\}/);
        if (m) specs = JSON.parse(m[0]);
      } catch (_) {
        specs = { component, rawResponse: response.substring(0, 1000) };
      }
      const finalFile = path.join(OLLAMA_DIR, `${component.replace(/[^a-zA-Z0-9-_]/g, '_')}_FINAL.json`);
      await fs.writeFile(finalFile, JSON.stringify({ component, nexar: out, ollamaExtraction: specs }, null, 2));
      console.log(`✅ Ollama: ${path.basename(finalFile)}.`);
      out.ollamaExtraction = specs;
    } catch (e) {
      console.error(`❌ Ollama: ${e.message}`);
    }
  }

  return out;
}

async function main() {
  const component = process.argv[2];
  const limit = parseInt(process.argv[3], 10) || 15;
  const ollama = process.argv.includes('--ollama');

  if (!component) {
    console.log('Usage: node product-search.js <PART_QUERY> [limit] [--ollama]');
    console.log('Example: node product-search.js LM358 10 --ollama');
    console.log('Credentials: .env with NEXAR_CLIENT_ID, NEXAR_CLIENT_SECRET (or NEXAR_ACCESS_TOKEN)');
    process.exit(1);
  }

  await searchAndExtract(component, limit, ollama);
}

if (require.main === module) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { search, searchAndExtract };
