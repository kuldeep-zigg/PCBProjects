#!/usr/bin/env node

/**
 * MULTI-SITE CHROMIUM SCRAPER with OLLAMA INTEGRATION
 * 
 * Features:
 * - Searches only reliable strong sources (10 sites)
 * - Stores HTML page-by-page with sections
 * - Sanitizes and cleans HTML data
 * - Sends bulk data to Ollama for extraction
 * - Reliable only: official manufacturers + established datasheet aggregators
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class MultiSiteScraper {
  constructor() {
    this.browser = null;
    this.chromePath = path.join(__dirname, 'browsers', 'chrome', 'mac_arm-145.0.7632.26', 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
    
    // Directories
    this.htmlDir = path.join(__dirname, 'knowledge-base', 'html-storage');
    this.sectionsDir = path.join(__dirname, 'knowledge-base', 'html-sections');
    this.sanitizedDir = path.join(__dirname, 'knowledge-base', 'html-sanitized');
    this.ollamaDir = path.join(__dirname, 'knowledge-base', 'ollama-extractions');
    
    // Ensure directories exist
    [this.htmlDir, this.sectionsDir, this.sanitizedDir, this.ollamaDir].forEach(dir => {
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
      }
    });

    // Target websites
    this.sites = {
      alldatasheet: {
        name: 'AllDataSheet',
        url: (component) => `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(component)}`,
        priority: 1
      },
      octopart: {
        name: 'Octopart',
        url: (component) => `https://octopart.com/search?q=${encodeURIComponent(component)}`,
        priority: 2
      },
      datasheetcatalog: {
        name: 'Datasheet Catalog',
        url: (component) => `https://www.datasheetcatalog.com/datasheets_pdf/${component.charAt(0)}/${component}.shtml`,
        priority: 3
      },
      datasheets: {
        name: 'Datasheets.com',
        url: (component) => `https://www.datasheets.com/search?q=${encodeURIComponent(component)}`,
        priority: 4
      },
      // Manufacturer sites (official, reliable)
      ti: {
        name: 'Texas Instruments',
        url: (component) => `https://www.ti.com/product/${component}`,
        priority: 5
      },
      st: {
        name: 'STMicroelectronics',
        url: (component) => `https://www.st.com/en/products/${component}.html`,
        priority: 6
      },
      microchip: {
        name: 'Microchip',
        url: (component) => `https://www.microchip.com/en-us/product/${component}`,
        priority: 7
      },
      nxp: {
        name: 'NXP',
        url: (component) => `https://www.nxp.com/products/${component}`,
        priority: 8
      },
      onsemi: {
        name: 'ON Semiconductor',
        url: (component) => `https://www.onsemi.com/products/${component}`,
        priority: 9
      },
      vishay: {
        name: 'Vishay',
        url: (component) => `https://www.vishay.com/ppg?${encodeURIComponent(component)}`,
        priority: 10
      }
    };
  }

  /**
   * Launch Chromium browser
   */
  async launch() {
    console.log('🚀 Multi-site scraper launching Chromium...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      executablePath: this.chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✅ Browser ready.');
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed.');
    }
  }

  /**
   * Sanitize HTML - remove scripts, styles, and extract clean text
   */
  sanitizeHTML(html, sourceUrl) {
    // Remove scripts
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove styles
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove inline styles
    html = html.replace(/style="[^"]*"/gi, '');
    
    // Remove event handlers
    html = html.replace(/on\w+="[^"]*"/gi, '');
    
    // Clean whitespace
    html = html.replace(/\s+/g, ' ');
    html = html.replace(/>\s+</g, '><');
    
    return { html, size: html.length, source: sourceUrl, sanitizedAt: new Date().toISOString() };
  }

  /**
   * Extract sections from HTML (tables, specs, descriptions)
   */
  async extractSections(html, component) {
    const sections = {
      tables: [],
      specifications: [],
      descriptions: [],
      metadata: {},
      text: ''
    };

    // Create temporary page to parse HTML
    const page = await this.browser.newPage();
    await page.setContent(html);

    const extracted = await page.evaluate(() => {
      const result = {
        tables: [],
        specs: [],
        descriptions: [],
        metadata: {},
        text: document.body.innerText
      };

      // Extract tables
      const tables = document.querySelectorAll('table');
      tables.forEach((table, i) => {
        const tableData = {
          index: i,
          headers: [],
          rows: [],
          html: table.outerHTML.substring(0, 5000) // Limit size
        };

        const headers = table.querySelectorAll('th');
        headers.forEach(th => tableData.headers.push(th.innerText.trim()));

        const rows = table.querySelectorAll('tr');
        rows.forEach(tr => {
          const cells = tr.querySelectorAll('td');
          if (cells.length > 0) {
            const rowData = [];
            cells.forEach(td => rowData.push(td.innerText.trim()));
            tableData.rows.push(rowData);
          }
        });

        if (tableData.headers.length > 0 || tableData.rows.length > 0) {
          result.tables.push(tableData);
        }
      });

      // Extract specification sections (common patterns)
      const specSections = document.querySelectorAll('[class*="spec"], [id*="spec"], [class*="parameter"], [id*="parameter"]');
      specSections.forEach(section => {
        result.specs.push({
          text: section.innerText.substring(0, 2000),
          html: section.outerHTML.substring(0, 3000)
        });
      });

      // Extract descriptions
      const descriptions = document.querySelectorAll('p, [class*="description"], [id*="description"]');
      descriptions.forEach(desc => {
        const text = desc.innerText.trim();
        if (text.length > 50 && text.length < 1000) {
          result.descriptions.push(text);
        }
      });

      // Extract metadata
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          result.metadata[name] = content;
        }
      });

      return result;
    });

    await page.close();

    sections.tables = extracted.tables;
    sections.specifications = extracted.specs;
    sections.descriptions = extracted.descriptions;
    sections.metadata = extracted.metadata;
    sections.text = extracted.text;
    return sections;
  }

  /**
   * Send data to Ollama for extraction
   */
  async sendToOllama(component, allSections) {
    console.log('📤 Sending to Ollama for extraction...');
    // Prepare bulk data for Ollama
    const bulkData = {
      component: component,
      sources: allSections.length,
      totalText: 0,
      totalTables: 0,
      sections: []
    };

    allSections.forEach(source => {
      bulkData.totalText += source.sections.text.length;
      bulkData.totalTables += source.sections.tables.length;
      
      bulkData.sections.push({
        site: source.site,
        url: source.url,
        tables: source.sections.tables.slice(0, 10), // Limit to 10 tables per source
        specs: source.sections.specifications.slice(0, 5),
        descriptions: source.sections.descriptions.slice(0, 3),
        metadata: source.sections.metadata,
        text: source.sections.text.substring(0, 5000) // First 5000 chars
      });
    });
    console.log(`📦 Bulk: ${bulkData.sources} sources, ${bulkData.totalTables} tables, ${bulkData.totalText} chars.`);

    // Create Ollama prompt
    const prompt = `Extract comprehensive specifications from this component data.

Component: ${component}

Data from ${bulkData.sources} sources:
${JSON.stringify(bulkData.sections, null, 2).substring(0, 30000)}

Extract and return ONLY a JSON object with this format:
{
  "component": "${component}",
  "voltage": "supply voltage range",
  "current": "current specifications",
  "temperature": "temperature range",
  "package": ["package types"],
  "manufacturer": "manufacturer name",
  "description": "component description",
  "specifications": {
    "key": "value"
  }
}`;

    console.log(`🚀 Ollama API call (prompt ${prompt.length} chars)...`);
    try {
      const response = await this.callOllama(prompt);

      // Try to parse JSON from response
      let specs = {};
      try {
        // Find JSON in response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          specs = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: extract basic info
          specs = {
            component: component,
            rawResponse: response.substring(0, 1000)
          };
        }
      } catch (e) {
        console.log('⚠️ Ollama: could not parse JSON, using raw response.');
        specs = {
          component: component,
          rawResponse: response.substring(0, 1000)
        };
      }

      // Save Ollama extraction
      const ollamaFile = path.join(this.ollamaDir, `${component}_ollama.json`);
      await fs.writeFile(ollamaFile, JSON.stringify({
        component,
        prompt: prompt.substring(0, 1000),
        response,
        extracted: specs,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`✅ Ollama saved: ${path.basename(ollamaFile)}.`);
      return specs;
    } catch (error) {
      console.error(`❌ Ollama error: ${error.message}`);
      return { component, error: error.message };
    }
  }

  /**
   * Call Ollama API
   */
  callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'deepseek-r1:7b',
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
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json.response || responseData);
          } catch (e) {
            resolve(responseData);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Scrape single site
   */
  async scrapeSite(siteKey, component) {
    const site = this.sites[siteKey];
    const url = site.url(component);

    console.log(`🔗 ${site.name}: ${url}`);

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });

      const html = await page.content();
      const htmlFile = path.join(this.htmlDir, `${component}_${siteKey}.html`);
      await fs.writeFile(htmlFile, html);
      const sanitized = this.sanitizeHTML(html, url);
      const sanitizedFile = path.join(this.sanitizedDir, `${component}_${siteKey}_clean.html`);
      await fs.writeFile(sanitizedFile, sanitized.html);
      const sections = await this.extractSections(sanitized.html, component);
      const sectionsFile = path.join(this.sectionsDir, `${component}_${siteKey}_sections.json`);
      await fs.writeFile(sectionsFile, JSON.stringify(sections, null, 2));
      console.log(`✅ ${site.name}: ${(html.length / 1024).toFixed(1)} KB → ${sections.tables.length} tables.`);

      await page.close();

      return {
        site: site.name,
        url: url,
        htmlFile,
        sanitizedFile,
        sectionsFile,
        sections,
        success: true
      };

    } catch (error) {
      console.error(`❌ ${site.name}: ${error.message}`);
      await page.close();
      return { site: site.name, url: url, error: error.message, success: false };
    }
  }

  /**
   * Comprehensive multi-site search
   */
  async searchAllSites(component) {
    const total = Object.keys(this.sites).length;
    console.log(`🎯 Search: ${component} (${total} sites).`);

    const results = [];
    for (const siteKey of Object.keys(this.sites)) {
      const result = await this.scrapeSite(siteKey, component);
      if (result.success) results.push(result);
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    console.log(`✅ Scraped: ${results.length}/${total} sites.`);

    // Send all data to Ollama
    const ollamaSpecs = await this.sendToOllama(component, results);

    // Save final result
    const finalResult = {
      component,
      timestamp: new Date().toISOString(),
      sitesSearched: Object.keys(this.sites).length,
      sitesSuccessful: results.length,
      results,
      ollamaExtraction: ollamaSpecs
    };

    const finalFile = path.join(this.ollamaDir, `${component}_FINAL.json`);
    await fs.writeFile(finalFile, JSON.stringify(finalResult, null, 2));

    console.log(`✅ Done: ${path.basename(finalFile)} (${results.length} sites, ${results.length * 2} HTML files).`);
    return finalResult;
  }

  /**
   * Scrape a single direct URL (e.g. Datasheets.com part page)
   * Use for: https://www.datasheets.com/te-connectivity/205203-3
   */
  async scrapeDirectUrl(targetUrl, componentLabel = null) {
    const component = componentLabel || this._partFromDatasheetsComUrl(targetUrl) || 'part';
    const siteKey = 'datasheets_direct';

    console.log(`🔗 Direct URL: ${targetUrl} (part: ${component}).`);

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });

      const html = await page.content();
      const htmlFile = path.join(this.htmlDir, `${component}_${siteKey}.html`);
      await fs.writeFile(htmlFile, html);
      const sanitized = this.sanitizeHTML(html, targetUrl);
      const sanitizedFile = path.join(this.sanitizedDir, `${component}_${siteKey}_clean.html`);
      await fs.writeFile(sanitizedFile, sanitized.html);
      const sections = await this.extractSections(sanitized.html, component);
      const sectionsFile = path.join(this.sectionsDir, `${component}_${siteKey}_sections.json`);
      await fs.writeFile(sectionsFile, JSON.stringify(sections, null, 2));
      await page.close();

      const result = { site: 'Datasheets.com (direct)', url: targetUrl, sections, success: true };
      const ollamaSpecs = await this.sendToOllama(component, [result]);
      const finalFile = path.join(this.ollamaDir, `${component}_FINAL.json`);
      await fs.writeFile(finalFile, JSON.stringify({ component, url: targetUrl, sections, ollamaExtraction: ollamaSpecs }, null, 2));
      console.log(`✅ Direct URL done: ${path.basename(finalFile)} (${sections.tables.length} tables).`);
      return result;
    } catch (error) {
      console.error(`❌ Direct URL error: ${error.message}`);
      await page.close();
      return { url: targetUrl, error: error.message, success: false };
    }
  }

  _partFromDatasheetsComUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('datasheets.com')) {
        const last = u.pathname.split('/').filter(Boolean).pop();
        if (last) return last;
      }
    } catch (_) {}
    return null;
  }
}

// CLI
async function main() {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];

  if (!arg1) {
    console.log('Usage: node multi-site-scraper.js <COMPONENT> | url <FULL_URL>');
    console.log('Example: node multi-site-scraper.js LM358');
    console.log('Example: node multi-site-scraper.js url "https://www.datasheets.com/te-connectivity/205203-3"');
    console.log('Sites (10): AllDataSheet, Octopart, DatasheetCatalog, Datasheets.com, TI, ST, Microchip, NXP, ON Semi, Vishay');
    process.exit(1);
  }

  const scraper = new MultiSiteScraper();

  try {
    await scraper.launch();
    if (arg1.toLowerCase() === 'url' && arg2) {
      await scraper.scrapeDirectUrl(arg2);
    } else {
      await scraper.searchAllSites(arg1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MultiSiteScraper };
