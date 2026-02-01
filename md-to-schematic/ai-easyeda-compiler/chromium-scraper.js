#!/usr/bin/env node

/**
 * CHROMIUM WEB SCRAPER - Professional Component Learning System
 * 
 * Uses headless Chromium browser to:
 * - Surf datasheet websites
 * - Extract component specifications
 * - Download PDFs automatically
 * - Handle JavaScript-rendered content
 * - Navigate search results intelligently
 * - Learn from multiple sources
 * 
 * This is a REAL BROWSER that can access any website!
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class ChromiumScraper {
  constructor() {
    this.browser = null;
    this.downloadsDir = path.join(__dirname, 'pdf', 'datasheets-chromium');
    this.knowledgeDir = path.join(__dirname, 'knowledge-base', 'web-scraped');
    this.historyFile = path.join(__dirname, 'knowledge-base', 'browsing-history.json');
    this.cacheDir = path.join(__dirname, 'knowledge-base', 'html-cache');
    
    // Browsing history and cache
    this.history = this.loadHistory();
    this.visitedUrls = new Set(this.history.urls || []);
    
    // Ensure directories exist
    if (!fsSync.existsSync(this.downloadsDir)) {
      fsSync.mkdirSync(this.downloadsDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.knowledgeDir)) {
      fsSync.mkdirSync(this.knowledgeDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.cacheDir)) {
      fsSync.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load browsing history
   */
  loadHistory() {
    try {
      if (fsSync.existsSync(this.historyFile)) {
        const data = fsSync.readFileSync(this.historyFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('⚠️  No history file found, starting fresh');
    }
    return {
      urls: [],
      visits: [],
      components: {},
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save browsing history
   */
  async saveHistory() {
    this.history.urls = Array.from(this.visitedUrls);
    this.history.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2));
  }

  /**
   * Add URL to history
   */
  async addToHistory(url, component, data) {
    this.visitedUrls.add(url);
    this.history.visits.push({
      url,
      component,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length
    });
    
    if (!this.history.components[component]) {
      this.history.components[component] = [];
    }
    this.history.components[component].push({
      url,
      timestamp: new Date().toISOString()
    });
    
    await this.saveHistory();
  }

  /**
   * Cache HTML content
   */
  async cacheHTML(url, html, component) {
    const urlHash = require('crypto').createHash('md5').update(url).digest('hex');
    const cacheFile = path.join(this.cacheDir, `${component}_${urlHash}.html`);
    await fs.writeFile(cacheFile, html, 'utf8');
    console.log(`💾 Cached HTML: ${path.basename(cacheFile)}`);
    return cacheFile;
  }

  /**
   * Launch Chromium browser
   */
  async launch() {
    console.log('🚀 Chromium scraper launching...');
    
    // Use locally installed Chrome in browsers/ folder
    const chromePath = path.join(__dirname, 'browsers', 'chrome', 'mac_arm-145.0.7632.26', 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
    
    this.browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    console.log('✅ Browser ready.');
    return this.browser;
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
   * Search Google for component datasheets (fallback method)
   */
  async searchGoogle(componentName) {
    console.log(`🔍 Google search: ${componentName} datasheet.`);

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(componentName + ' datasheet pdf')}`;
      
      console.log(`🌐 ${searchUrl}`);
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 12000 
      });

      console.log('✅ Page loaded.');

      // Extract search results
      const results = await page.evaluate(() => {
        const links = [];
        const anchors = document.querySelectorAll('a');
        
        anchors.forEach(anchor => {
          const href = anchor.href;
          const text = anchor.innerText.trim();
          if (href && (href.includes('.pdf') || href.includes('datasheet'))) {
            links.push({ url: href, text });
          }
        });
        
        return {
          links: links.slice(0, 10),
          pageText: document.body.innerText.substring(0, 2000)
        };
      });

      console.log(`🔗 Found ${results.links.length} datasheet links.`);

      // Save data
      const dataPath = path.join(this.knowledgeDir, `${componentName}_google.json`);
      await fs.writeFile(dataPath, JSON.stringify({
        component: componentName,
        source: 'Google Search',
        timestamp: new Date().toISOString(),
        results
      }, null, 2));

      console.log(`✅ Saved: ${path.basename(dataPath)}.`);

      await page.close();
      return results;

    } catch (error) {
      console.error(`❌ Error scraping Google: ${error.message}`);
      await page.close();
      return null;
    }
  }

  /**
   * Search AllDataSheet.com and extract component info
   */
  async searchAllDataSheet(componentName) {
    console.log(`🔍 AllDataSheet: ${componentName}.`);

    const page = await this.browser.newPage();
    
    try {
      // Set user agent to look like a regular browser
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Enable request interception for logging
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.abort(); // Speed up by blocking images/css
        } else {
          request.continue();
        }
      });

      const searchUrl = `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(componentName)}`;
      
      console.log(`🌐 ${searchUrl}`);
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', // Less strict than networkidle2
        timeout: 15000
      });

      console.log('✅ Page loaded.');

      // Get full HTML content
      const htmlContent = await page.content();
      
      // Cache HTML for later analysis
      const cacheFile = await this.cacheHTML(searchUrl, htmlContent, componentName);

      // Take screenshot for debugging
      const screenshotPath = path.join(this.knowledgeDir, `${componentName}_screenshot.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot: ${path.basename(screenshotPath)}.`);

      // Extract comprehensive data
      const comprehensiveData = await this.extractComprehensiveData(page, componentName);
      
      console.log(`💾 Cached: ${(htmlContent.length / 1024).toFixed(1)} KB → ${path.basename(cacheFile)}.`);

      // Add to browsing history
      await this.addToHistory(searchUrl, componentName, comprehensiveData);

      // Save comprehensive extracted data
      const dataPath = path.join(this.knowledgeDir, `${componentName}_scraped.json`);
      await fs.writeFile(dataPath, JSON.stringify({
        component: componentName,
        source: searchUrl,
        timestamp: new Date().toISOString(),
        htmlCacheFile: path.basename(cacheFile),
        specs: comprehensiveData.specs,
        metadata: comprehensiveData.metadata,
        tables: comprehensiveData.tables,
        datasheetLinks: comprehensiveData.links,
        images: comprehensiveData.images,
        pageText: comprehensiveData.text.full.substring(0, 10000), // First 10000 chars
        structuredData: comprehensiveData.text.structured
      }, null, 2));

      console.log(`✅ Saved: ${path.basename(dataPath)}.`);

      await page.close();
      return comprehensiveData;

    } catch (error) {
      console.error(`❌ Error scraping AllDataSheet: ${error.message}`);
      await page.close();
      return null;
    }
  }

  /**
   * Extract comprehensive data from page
   */
  async extractComprehensiveData(page, componentName) {
    console.log('🔍 Extracting data from page...');

    const data = await page.evaluate(() => {
      const result = {
        metadata: {},
        specs: {},
        tables: [],
        links: [],
        images: [],
        text: {
          full: '',
          structured: {}
        }
      };

      // Extract metadata
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          result.metadata[name] = content;
        }
      });

      // Extract all text
      result.text.full = document.body.innerText;

      // Extract structured data (JSON-LD)
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach((script, i) => {
        try {
          result.text.structured[`jsonld_${i}`] = JSON.parse(script.textContent);
        } catch (e) {
          // Ignore parsing errors
        }
      });

      // Extract specifications with advanced patterns
      const text = result.text.full;

      // Voltage specs (multiple patterns)
      const voltagePatterns = [
        /supply voltage[:\s]+([0-9.]+)\s*V?\s*(?:to|-)\s*([0-9.]+)\s*V/gi,
        /operating voltage[:\s]+([0-9.]+)\s*V?\s*(?:to|-)\s*([0-9.]+)\s*V/gi,
        /V(?:CC|DD|SS)[:\s]+([0-9.]+)\s*V?\s*(?:to|-)\s*([0-9.]+)\s*V/gi,
        /([0-9.]+)\s*V\s*(?:to|-)\s*([0-9.]+)\s*V/gi
      ];
      
      for (const pattern of voltagePatterns) {
        const match = text.match(pattern);
        if (match) {
          result.specs.voltage = match[0];
          break;
        }
      }

      // Current specs
      const currentPatterns = [
        /supply current[:\s]+([0-9.]+)\s*(mA|A|µA|uA)/gi,
        /quiescent current[:\s]+([0-9.]+)\s*(mA|A|µA|uA)/gi,
        /output current[:\s]+([0-9.]+)\s*(mA|A|µA|uA)/gi,
        /([0-9.]+)\s*(mA|A|µA|uA)/gi
      ];
      
      for (const pattern of currentPatterns) {
        const match = text.match(pattern);
        if (match) {
          result.specs.current = match[0];
          break;
        }
      }

      // Temperature range
      const tempMatch = text.match(/(-?\d+)°C\s*(?:to|-)\s*(\+?\d+)°C/i);
      if (tempMatch) {
        result.specs.temperature = `${tempMatch[1]}°C to ${tempMatch[2]}°C`;
      }

      // Package types
      const packagePatterns = [
        /(DIP|SOIC|TSSOP|QFN|BGA|SOT-\d+|TO-\d+|PLCC|LQFP|SSOP|MSOP|DFN|WLCSP)[\s-]*\d*/gi
      ];
      
      const packages = new Set();
      packagePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(m => packages.add(m.trim()));
        }
      });
      result.specs.packages = Array.from(packages);

      // Manufacturer
      const mfgPatterns = [
        /manufacturer[:\s]+([\w\s]+?)(?:\n|,|;|\||<)/gi,
        /made by[:\s]+([\w\s]+?)(?:\n|,|;|\||<)/gi,
        /(Texas Instruments|Analog Devices|STMicroelectronics|Microchip|NXP|Infineon|Maxim|ON Semiconductor)/gi
      ];
      
      for (const pattern of mfgPatterns) {
        const match = text.match(pattern);
        if (match) {
          result.specs.manufacturer = match[0].replace(/manufacturer[:\s]+/gi, '').trim();
          break;
        }
      }

      // Extract all tables
      const tables = document.querySelectorAll('table');
      tables.forEach((table, i) => {
        const tableData = {
          index: i,
          headers: [],
          rows: []
        };

        // Get headers
        const headers = table.querySelectorAll('th');
        headers.forEach(th => tableData.headers.push(th.innerText.trim()));

        // Get rows
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

      // Extract all relevant links
      const anchors = document.querySelectorAll('a');
      anchors.forEach(a => {
        const href = a.href;
        const text = a.innerText.trim();
        
        if (href && (
          href.includes('.pdf') ||
          href.includes('datasheet') ||
          href.includes('download') ||
          href.includes('document') ||
          text.toLowerCase().includes('datasheet') ||
          text.toLowerCase().includes('pdf')
        )) {
          result.links.push({
            url: href,
            text: text,
            type: href.includes('.pdf') ? 'pdf' : 'page'
          });
        }
      });

      // Extract images (schematics, pin diagrams)
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        const src = img.src;
        const alt = img.alt || '';
        
        if (src && (
          alt.toLowerCase().includes('diagram') ||
          alt.toLowerCase().includes('schematic') ||
          alt.toLowerCase().includes('pinout') ||
          alt.toLowerCase().includes('package')
        )) {
          result.images.push({
            url: src,
            alt: alt,
            width: img.width,
            height: img.height
          });
        }
      });

      return result;
    });

    console.log(`📊 Extracted: ${data.tables.length} tables, ${data.links.length} links, ${data.text.full.length} chars. Specs: V=${data.specs.voltage || '-'} I=${data.specs.current || '-'} T=${data.specs.temperature || '-'}.`);

    return data;
  }

  /**
   * Extract specifications from page (legacy method, now calls comprehensive)
   */
  async extractSpecifications(page, componentName) {
    const data = await this.extractComprehensiveData(page, componentName);
    return data.specs;
  }

  /**
   * Download PDF from URL
   */
  async downloadPDF(url, componentName) {
    console.log(`📥 PDF: ${url}`);

    const page = await this.browser.newPage();
    
    try {
      // Set download behavior
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: this.downloadsDir
      });

      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });

      console.log('✅ PDF download started.');
      
      // Wait a bit for download to complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      await page.close();
      return true;

    } catch (error) {
      console.error(`❌ Error downloading PDF: ${error.message}`);
      await page.close();
      return false;
    }
  }

  /**
   * Search manufacturer website
   */
  async searchManufacturer(componentName, manufacturer) {
    console.log(`🔍 ${manufacturer}: ${componentName}.`);

    const page = await this.browser.newPage();
    
    try {
      // Map manufacturer to website
      const manufacturerSites = {
        'ti': 'https://www.ti.com/product/${component}',
        'analog': 'https://www.analog.com/en/products/${component}.html',
        'st': 'https://www.st.com/en/products/${component}.html',
        'microchip': 'https://www.microchip.com/en-us/product/${component}',
        'nxp': 'https://www.nxp.com/products/${component}',
        'infineon': 'https://www.infineon.com/cms/en/product/${component}',
        'maxim': 'https://www.maximintegrated.com/en/products/${component}.html',
        'onsemi': 'https://www.onsemi.com/products/${component}'
      };

      const urlTemplate = manufacturerSites[manufacturer.toLowerCase()];
      if (!urlTemplate) {
        console.log(`⚠️ Unknown manufacturer: ${manufacturer}.`);
        await page.close();
        return null;
      }

      const url = urlTemplate.replace('${component}', componentName.toLowerCase());
      
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 12000 
      });

      console.log('✅ Page loaded.');

      // Extract product information
      const productInfo = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          text: document.body.innerText.substring(0, 2000)
        };
      });

      console.log(`📄 ${productInfo.title}: ${productInfo.description.substring(0, 80)}...`);

      // Save data
      const dataPath = path.join(this.knowledgeDir, `${componentName}_${manufacturer}_scraped.json`);
      await fs.writeFile(dataPath, JSON.stringify({
        component: componentName,
        manufacturer,
        source: url,
        timestamp: new Date().toISOString(),
        productInfo
      }, null, 2));

      console.log(`✅ Saved: ${path.basename(dataPath)}.`);

      await page.close();
      return productInfo;

    } catch (error) {
      console.error(`❌ Error scraping manufacturer: ${error.message}`);
      await page.close();
      return null;
    }
  }

  /**
   * Intelligent multi-source component learning
   */
  async learnComponent(componentName) {
    console.log(`🎯 Learn: ${componentName}.`);

    const results = {
      component: componentName,
      timestamp: new Date().toISOString(),
      sources: {}
    };

    // 1. Search AllDataSheet.com
    console.log('📚 Source 1: AllDataSheet.');
    const allDataSheetResult = await this.searchAllDataSheet(componentName);
    if (allDataSheetResult) {
      results.sources.allDataSheet = allDataSheetResult;
    } else {
      // Fallback to Google search
      console.log('⚠️ AllDataSheet failed, trying Google.');
      console.log('📚 Source 1B: Google.');
      const googleResult = await this.searchGoogle(componentName);
      if (googleResult) {
        results.sources.google = googleResult;
      }
    }

    // 2. Try to download first PDF
    if (allDataSheetResult?.datasheetLinks?.length > 0) {
      const firstPDF = allDataSheetResult.datasheetLinks[0];
      if (firstPDF.url.includes('.pdf')) {
        await this.downloadPDF(firstPDF.url, componentName);
      }
    }

    // 3. Search manufacturer sites (if manufacturer detected)
    const manufacturer = allDataSheetResult?.specs?.manufacturer;
    if (manufacturer) {
      console.log(`📚 Source 2: ${manufacturer}.`);
      const mfgResult = await this.searchManufacturer(componentName, manufacturer);
      if (mfgResult) {
        results.sources.manufacturer = mfgResult;
      }
    }

    // Save consolidated results
    const resultsPath = path.join(this.knowledgeDir, `${componentName}_complete.json`);
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    console.log(`✅ Learn done: ${componentName}, ${Object.keys(results.sources).length} sources → ${path.basename(resultsPath)}.`);

    return results;
  }

  /**
   * Follow links from a page and scrape them
   */
  async followLinks(initialUrl, componentName, maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      console.log(`⚠️ Max depth ${maxDepth} reached.`);
      return [];
    }

    console.log(`🔗 Follow: ${initialUrl} (depth ${currentDepth}/${maxDepth}).`);

    const page = await this.browser.newPage();
    const scrapedData = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(initialUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Extract links
      const links = await page.evaluate(() => {
        const foundLinks = [];
        const anchors = document.querySelectorAll('a');
        
        anchors.forEach(a => {
          const href = a.href;
          const text = a.innerText.trim();
          
          if (href && (
            href.includes('datasheet') ||
            href.includes('pdf') ||
            href.includes('doc') ||
            text.toLowerCase().includes('datasheet') ||
            text.toLowerCase().includes('specification')
          )) {
            foundLinks.push({ url: href, text });
          }
        });
        
        return foundLinks.slice(0, 5); // Limit to 5 links per page
      });

      console.log(`📎 Found ${links.length} links to follow.`);

      // Follow each link
      for (let i = 0; i < Math.min(links.length, 3); i++) {
        const link = links[i];
        
        if (this.visitedUrls.has(link.url)) {
          console.log(`⏭️ Already visited: ${link.url}.`);
          continue;
        }

        console.log(`🌐 Following: ${link.text} → ${link.url}`);

        try {
          const linkPage = await this.browser.newPage();
          await linkPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          await linkPage.goto(link.url, {
            waitUntil: 'domcontentloaded',
            timeout: 12000
          });

          // Extract data from this page
          const htmlContent = await linkPage.content();
          await this.cacheHTML(link.url, htmlContent, `${componentName}_link${i}`);
          
          const data = await this.extractComprehensiveData(linkPage, componentName);
          scrapedData.push({
            url: link.url,
            title: link.text,
            data: data,
            depth: currentDepth + 1
          });

          await this.addToHistory(link.url, componentName, data);
          await linkPage.close();

          // Wait between requests
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`❌ Error following link: ${error.message}\n`);
        }
      }

      await page.close();
      return scrapedData;

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      await page.close();
      return scrapedData;
    }
  }

  /**
   * View browsing history
   */
  async viewHistory() {
    console.log(`📊 History: ${this.visitedUrls.size} URLs, ${Object.keys(this.history.components).length} components, last: ${this.history.lastUpdated}.`);
    Object.entries(this.history.components).forEach(([component, visits]) => {
      console.log(`   ${component}: ${visits.length} URLs`);
    });
    this.history.visits.slice(-5).reverse().forEach((visit, i) => {
      console.log(`   ${i + 1}. ${visit.component} ${visit.url} ${(visit.dataSize / 1024).toFixed(1)} KB`);
    });
    return this.history;
  }

  /**
   * Batch learn multiple components
   */
  async learnComponents(componentNames) {
    console.log(`📦 Batch: ${componentNames.length} components.`);
    const results = [];
    for (let i = 0; i < componentNames.length; i++) {
      const component = componentNames[i];
      console.log(`[${i + 1}/${componentNames.length}] ${component}.`);
      const result = await this.learnComponent(component);
      results.push(result);
      if (i < componentNames.length - 1) await new Promise(resolve => setTimeout(resolve, 800));
    }
    console.log(`✅ Batch done: ${results.length} components → ${this.knowledgeDir}.`);
    return results;
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const command = process.argv[2];
  const component = process.argv[3];

  const scraper = new ChromiumScraper();

  try {
    await scraper.launch();

    if (command === 'search' && component) {
      // Search single component
      await scraper.learnComponent(component);

    } else if (command === 'batch') {
      // Batch learn from arguments
      const components = process.argv.slice(3);
      if (components.length === 0) {
        console.log('Usage: node chromium-scraper.js batch ESP32 LM358 BME280');
        process.exit(1);
      }
      await scraper.learnComponents(components);

    } else if (command === 'alldatasheet' && component) {
      // Just search AllDataSheet
      await scraper.searchAllDataSheet(component);

    } else if (command === 'google' && component) {
      // Just search Google
      await scraper.searchGoogle(component);

    } else if (command === 'follow' && component) {
      // Follow links from AllDataSheet
      const allDataSheetUrl = `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(component)}`;
      const linkedData = await scraper.followLinks(allDataSheetUrl, component, 2);
      console.log(`✅ Followed ${linkedData.length} links for ${component}.`);

    } else if (command === 'history') {
      // View browsing history
      await scraper.viewHistory();

    } else if (command === 'deep' && component) {
      console.log(`🎯 Deep scrape: ${component}.`);

      // 1. Search AllDataSheet
      const mainResult = await scraper.learnComponent(component);

      // 2. Follow top links
      const allDataSheetUrl = `https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(component)}`;
      const linkedData = await scraper.followLinks(allDataSheetUrl, component, 2);

      console.log(`✅ Deep done: main + ${linkedData.length} links, ${JSON.stringify(mainResult).length + linkedData.reduce((sum, d) => sum + JSON.stringify(d).length, 0)} bytes.`);

    } else {
      console.log('Usage: search|deep|batch|alldatasheet|google|follow|history [COMPONENT]');
      console.log('Example: node chromium-scraper.js search LM358');
      console.log('Example: node chromium-scraper.js batch ESP32 LM358 BME280');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
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

module.exports = { ChromiumScraper };
