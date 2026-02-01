#!/usr/bin/env node

/**
 * Automatic Datasheet Downloader
 * 
 * When component information is not found locally:
 * 1. Searches the internet for datasheets
 * 2. Downloads up to 10 possible datasheets
 * 3. Extracts text and specifications
 * 4. Feeds to AI for analysis
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Datasheet Search & Download Manager
 */
class DatasheetDownloader {
  constructor() {
    this.downloadDir = path.join(__dirname, 'pdf/datasheets-auto');
    this.searchEngines = {
      google: 'https://www.google.com/search?q=',
      manufacturer: this.getManufacturerSites()
    };
    this.maxDownloads = 10;
    this.timeout = 30000; // 30 seconds per download
  }

  /**
   * Get list of manufacturer datasheet sites
   */
  getManufacturerSites() {
    return {
      'ti': 'https://www.ti.com/lit/ds/symlink/',
      'analog': 'https://www.analog.com/media/en/technical-documentation/',
      'microchip': 'https://ww1.microchip.com/downloads/en/DeviceDoc/',
      'st': 'https://www.st.com/resource/en/datasheet/',
      'nxp': 'https://www.nxp.com/docs/en/data-sheet/',
      'infineon': 'https://www.infineon.com/dgdl/',
      'onsemi': 'https://www.onsemi.com/pdf/datasheet/',
      'vishay': 'https://www.vishay.com/docs/',
      'diodes': 'https://www.diodes.com/assets/Datasheets/'
    };
  }

  /**
   * Main function: Search and download datasheets for component
   */
  async searchAndDownload(componentName, componentType = '') {
    const overallStart = Date.now();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        AUTOMATIC DATASHEET DOWNLOADER                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n🔍 Component: ${componentName}`);
    console.log(`🏷️  Type: ${componentType || 'Auto-detect'}`);
    console.log(`📥 Max downloads: ${this.maxDownloads}`);
    console.log(`⏱️  Timeout per file: ${this.timeout / 1000}s\n`);
    
    try {
      // Ensure download directory exists
      await this.ensureDownloadDir();

      // Step 1: Search for datasheet URLs
      const urls = await this.searchDatasheets(componentName, componentType);

      if (urls.length === 0) {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                    NO RESULTS FOUND                        ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('   ⚠️  No datasheets found');
        console.log('   💡 Suggestions:');
        console.log('      • Check component name spelling');
        console.log('      • Try alternative part numbers');
        console.log('      • Search without hyphens/spaces');
        return [];
      }

      // Step 2: Download datasheets (up to maxDownloads)
      const downloads = urls.slice(0, this.maxDownloads);
      
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║              DOWNLOADING DATASHEETS                        ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log(`\n⬇️  Attempting to download top ${downloads.length} URLs...`);
      console.log(`📂 Download directory: ${this.downloadDir}\n`);

      const results = [];
      const failed = [];
      const skipped = [];
      
      for (let i = 0; i < downloads.length; i++) {
        const url = downloads[i];
        const urlShort = url.length > 60 ? url.substring(0, 57) + '...' : url;
        
        console.log(`┌─────────────────────────────────────────────────────────┐`);
        console.log(`│ [${i + 1}/${downloads.length}] Attempting download...`);
        console.log(`└─────────────────────────────────────────────────────────┘`);
        console.log(`   🔗 URL: ${urlShort}`);
        
        try {
          const downloadStart = Date.now();
          const filePath = await this.downloadFile(url, componentName, i);
          const downloadTime = Date.now() - downloadStart;
          
          if (filePath) {
            const stats = require('fs').statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            
            results.push({
              url,
              path: filePath,
              component: componentName,
              index: i,
              size: stats.size,
              time: downloadTime
            });
            
            console.log(`   ✅ SUCCESS!`);
            console.log(`      📄 File: ${require('path').basename(filePath)}`);
            console.log(`      📊 Size: ${sizeKB} KB`);
            console.log(`      ⏱️  Time: ${downloadTime}ms`);
          }
        } catch (error) {
          console.log(`   ❌ FAILED: ${error.message}`);
          failed.push({ url: urlShort, error: error.message });
        }
        
        console.log('');
      }

      // Summary
      const overallTime = Date.now() - overallStart;
      const totalSize = results.reduce((sum, r) => sum + r.size, 0);
      const avgTime = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length) : 0;
      
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                 DOWNLOAD SUMMARY                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log(`\n📊 Statistics:`);
      console.log(`   ✅ Successful: ${results.length}/${downloads.length}`);
      console.log(`   ❌ Failed: ${failed.length}/${downloads.length}`);
      console.log(`   📁 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`   ⏱️  Total time: ${(overallTime / 1000).toFixed(2)}s`);
      console.log(`   ⚡ Avg time per file: ${avgTime}ms`);
      console.log(`   📈 Success rate: ${((results.length / downloads.length) * 100).toFixed(1)}%`);
      
      if (results.length > 0) {
        console.log(`\n✅ Downloaded files:`);
        results.forEach((r, i) => {
          const fileName = require('path').basename(r.path);
          console.log(`   ${i + 1}. ${fileName} (${(r.size / 1024).toFixed(2)} KB)`);
        });
      }
      
      if (failed.length > 0) {
        console.log(`\n❌ Failed downloads:`);
        failed.forEach((f, i) => {
          console.log(`   ${i + 1}. ${f.url}`);
          console.log(`      Reason: ${f.error}`);
        });
      }
      
      console.log('');
      return results;

    } catch (error) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                      ERROR                                 ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.error(`   ❌ Search failed: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      return [];
    }
  }

  /**
   * Search for datasheet URLs using multiple strategies including Google Dorks
   * Priority: AllDataSheet.com → Manufacturer → Google Dorks → Others
   */
  async searchDatasheets(componentName, componentType) {
    const urls = [];
    const startTime = Date.now();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           DATASHEET SEARCH STRATEGIES                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📦 Component: ${componentName}`);
    console.log(`🏷️  Type: ${componentType || 'Unknown'}\n`);

    // Strategy 1: AllDataSheet.com (HIGHEST PRIORITY - Largest database!)
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STRATEGY 1: AllDataSheet.com (Priority #1)             │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('📊 Searching AllDataSheet.com (world\'s largest database)...');
    const allDataSheetUrls = this.searchAllDataSheet(componentName, componentType);
    console.log(`   ✓ Generated ${allDataSheetUrls.length} AllDataSheet URLs`);
    console.log('   First 5 URLs:');
    allDataSheetUrls.slice(0, 5).forEach((url, i) => {
      console.log(`      ${i + 1}. ${url}`);
    });
    if (allDataSheetUrls.length > 5) {
      console.log(`      ... and ${allDataSheetUrls.length - 5} more`);
    }
    urls.push(...allDataSheetUrls);

    // Strategy 2: Direct manufacturer links (official sources)
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STRATEGY 2: Manufacturer Sites (Official Sources)      │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('🏭 Detecting manufacturer and searching official sites...');
    const manufacturers = this.guessManufacturer(componentName);
    console.log(`   Detected manufacturers: ${manufacturers.join(', ') || 'Generic'}`);
    const manufacturerUrls = this.searchManufacturerSites(componentName);
    console.log(`   ✓ Generated ${manufacturerUrls.length} manufacturer URLs`);
    console.log('   First 3 URLs:');
    manufacturerUrls.slice(0, 3).forEach((url, i) => {
      console.log(`      ${i + 1}. ${url}`);
    });
    if (manufacturerUrls.length > 3) {
      console.log(`      ... and ${manufacturerUrls.length - 3} more`);
    }
    urls.push(...manufacturerUrls);

    // Strategy 3: Google Dorks (powerful search operators)
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STRATEGY 3: Google Dorks (Advanced Operators)          │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('🔍 Using Google Dork techniques...');
    const dorkUrls = await this.googleDorkSearch(componentName, componentType);
    console.log(`   ✓ Generated ${dorkUrls.length} Google Dork URLs`);
    console.log('   Example dork patterns:');
    console.log(`      • filetype:pdf "${componentName} datasheet"`);
    console.log(`      • site:alldatasheet.com "${componentName}"`);
    console.log(`      • "${componentName}" "absolute maximum ratings" filetype:pdf`);
    urls.push(...dorkUrls);

    // Strategy 4: Other datasheet hosting sites
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STRATEGY 4: Other Hosting Sites (Fallback)             │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('🌐 Searching other datasheet hosting sites...');
    const hostingSiteUrls = this.searchHostingSites(componentName);
    console.log(`   ✓ Generated ${hostingSiteUrls.length} hosting site URLs`);
    console.log('   Sites: DatasheetsPDF, DigChip, Datasheet4U, etc.');
    urls.push(...hostingSiteUrls);

    // Strategy 5: Component-specific searches
    if (componentType) {
      console.log('\n┌─────────────────────────────────────────────────────────┐');
      console.log('│ STRATEGY 5: Component-Type Specific Search             │');
      console.log('└─────────────────────────────────────────────────────────┘');
      console.log(`🎯 Searching by component type: ${componentType}...`);
      const typeUrls = this.searchByType(componentName, componentType);
      console.log(`   ✓ Generated ${typeUrls.length} type-specific URLs`);
      urls.push(...typeUrls);
    }

    // Remove duplicates while preserving priority order
    const uniqueUrls = [...new Set(urls)];
    const duplicatesRemoved = urls.length - uniqueUrls.length;
    
    const elapsed = Date.now() - startTime;
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SEARCH STRATEGY SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Total URLs generated: ${urls.length}`);
    console.log(`🔗 Unique URLs: ${uniqueUrls.length}`);
    console.log(`♻️  Duplicates removed: ${duplicatesRemoved}`);
    console.log(`⏱️  Strategy execution time: ${elapsed}ms`);
    console.log(`\n📋 URL Priority Order:`);
    console.log(`   1-${allDataSheetUrls.length}: AllDataSheet.com`);
    console.log(`   ${allDataSheetUrls.length + 1}-${allDataSheetUrls.length + manufacturerUrls.length}: Manufacturer sites`);
    console.log(`   ${allDataSheetUrls.length + manufacturerUrls.length + 1}-${uniqueUrls.length}: Other sources`);
    console.log(`\n🚀 Ready to download top ${Math.min(this.maxDownloads, uniqueUrls.length)} datasheets...\n`);

    return uniqueUrls;
  }

  /**
   * Search AllDataSheet.com - The world's largest datasheet database
   * PRIORITY #1: Try this first!
   */
  searchAllDataSheet(componentName, componentType) {
    const urls = [];
    const cleanName = componentName.replace(/[^a-zA-Z0-9-]/g, '').trim();
    const cleanNameUpper = cleanName.toUpperCase();
    const cleanNameLower = cleanName.toLowerCase();

    // Pattern 1: Direct datasheet view
    urls.push(`https://www.alldatasheet.com/view.jsp?Searchword=${componentName}`);
    urls.push(`https://www.alldatasheet.com/view.jsp?Searchword=${cleanName}`);
    
    // Pattern 2: Direct PDF download links
    urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${componentName}.html`);
    urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${cleanName}.html`);
    urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${cleanNameUpper}.html`);
    urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${cleanNameLower}.html`);
    
    // Pattern 3: With manufacturer detection
    const manufacturers = this.guessManufacturer(componentName);
    for (const mfr of manufacturers.slice(0, 3)) {
      const mfrUpper = mfr.toUpperCase();
      urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${componentName}/${mfrUpper}.html`);
      urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${cleanName}/${mfrUpper}.html`);
    }
    
    // Pattern 4: Datasheet view with exact match
    urls.push(`https://www.alldatasheet.com/view.jsp?Searchword=${componentName}&sField=4`);
    
    // Pattern 5: Start with search
    urls.push(`https://www.alldatasheet.com/view.jsp?Searchword=${componentName}&sField=2`);
    
    // Pattern 6: With component type
    if (componentType) {
      urls.push(`https://www.alldatasheet.com/view.jsp?Searchword=${componentName}+${componentType}`);
      urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${componentName}+${componentType}.html`);
    }
    
    // Pattern 7: Common variations (hyphens, spaces, etc.)
    if (componentName.includes('-')) {
      const noHyphen = componentName.replace(/-/g, '');
      const withSpace = componentName.replace(/-/g, ' ');
      urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${noHyphen}.html`);
      urls.push(`https://www.alldatasheet.com/datasheet-pdf/pdf/${withSpace}.html`);
    }
    
    // Pattern 8: Distributor view (often has PDFs)
    urls.push(`https://www.alldatasheet.com/view_datasheet.jsp?Searchword=${componentName}`);
    
    return urls;
  }

  /**
   * Google Dork Search - Advanced search operators
   * These are the most powerful search techniques
   */
  async googleDorkSearch(componentName, componentType) {
    const urls = [];

    // Build Google Dork queries
    const dorkQueries = this.buildGoogleDorks(componentName, componentType);
    
    // For each dork query, try to extract PDF URLs
    // Note: In production, you'd use a proper search API or scraping service
    // For now, we construct likely URLs based on dork patterns
    
    for (const dork of dorkQueries) {
      const potentialUrls = this.extractUrlsFromDork(dork, componentName);
      urls.push(...potentialUrls);
    }

    return urls;
  }

  /**
   * Build Google Dork queries
   * These are advanced search operators that find datasheets effectively
   */
  buildGoogleDorks(componentName, componentType) {
    const dorks = [];
    const component = componentName.replace(/[^a-zA-Z0-9-]/g, ' ').trim();

    // Dork 1: Exact filename match
    // Example: filetype:pdf "ESP32-WROOM-32 datasheet"
    dorks.push(`filetype:pdf "${component} datasheet"`);
    
    // Dork 2: Title search
    // Example: intitle:"ESP32 datasheet" filetype:pdf
    dorks.push(`intitle:"${component.split('-')[0]} datasheet" filetype:pdf`);
    
    // Dork 3: URL pattern
    // Example: inurl:datasheet "ESP32" filetype:pdf
    dorks.push(`inurl:datasheet "${component}" filetype:pdf`);
    
    // Dork 4: Site-specific with PDF
    // Example: site:espressif.com filetype:pdf ESP32
    const manufacturers = this.guessManufacturer(componentName);
    for (const mfr of manufacturers.slice(0, 3)) { // Top 3 manufacturers
      const domain = this.getManufacturerDomain(mfr);
      if (domain) {
        dorks.push(`site:${domain} filetype:pdf ${component}`);
      }
    }
    
    // Dork 5: Exact phrase in text
    // Example: "ESP32-WROOM-32" "absolute maximum ratings" filetype:pdf
    dorks.push(`"${component}" "absolute maximum ratings" filetype:pdf`);
    
    // Dork 6: Technical specs search
    // Example: "ESP32" "electrical characteristics" "pin configuration" filetype:pdf
    dorks.push(`"${component}" "electrical characteristics" filetype:pdf`);
    
    // Dork 7: Datasheet hosting sites (AllDataSheet.com first!)
    // Example: site:alldatasheet.com OR site:datasheetspdf.com "ESP32"
    dorks.push(`(site:alldatasheet.com OR site:datasheetspdf.com OR site:datasheet4u.com OR site:datasheetarchive.com OR site:datasheets.com) "${component}"`);
    
    // Dork 8: Component type specific
    if (componentType) {
      dorks.push(`"${component}" "${componentType}" datasheet filetype:pdf`);
    }
    
    // Dork 9: Part number variations
    // Example: "ESP32 WROOM 32" OR "ESP32-WROOM-32" OR "ESP32WROOM32" filetype:pdf
    const variations = this.generatePartNumberVariations(component);
    if (variations.length > 1) {
      const varQuery = variations.map(v => `"${v}"`).join(' OR ');
      dorks.push(`(${varQuery}) datasheet filetype:pdf`);
    }
    
    // Dork 10: Manufacturer-specific terms
    // Example: site:ti.com "LM358" "SLOS" OR "SBOS" filetype:pdf
    // (TI uses SLOS/SBOS prefixes for datasheets)
    const mfrTerms = this.getManufacturerDocPatterns(componentName);
    if (mfrTerms) {
      dorks.push(mfrTerms);
    }

    return dorks;
  }

  /**
   * Generate part number variations
   * Example: "ESP32-WROOM-32" → ["ESP32-WROOM-32", "ESP32 WROOM 32", "ESP32WROOM32"]
   */
  generatePartNumberVariations(component) {
    const variations = [component];
    
    // Remove hyphens
    variations.push(component.replace(/-/g, ' '));
    variations.push(component.replace(/-/g, ''));
    
    // Add common suffixes/prefixes
    variations.push(component + ' datasheet');
    
    return [...new Set(variations)];
  }

  /**
   * Get manufacturer domain for site: operator
   */
  getManufacturerDomain(manufacturer) {
    const domains = {
      'ti': 'ti.com',
      'analog': 'analog.com',
      'microchip': 'microchip.com',
      'st': 'st.com',
      'nxp': 'nxp.com',
      'infineon': 'infineon.com',
      'onsemi': 'onsemi.com',
      'vishay': 'vishay.com',
      'diodes': 'diodes.com',
      'espressif': 'espressif.com',
      'maxim': 'maximintegrated.com',
      'fairchild': 'onsemi.com', // Acquired by ON Semi
      'freescale': 'nxp.com', // Acquired by NXP
      'atmel': 'microchip.com' // Acquired by Microchip
    };
    
    return domains[manufacturer] || null;
  }

  /**
   * Get manufacturer-specific document patterns
   */
  getManufacturerDocPatterns(componentName) {
    const name = componentName.toLowerCase();
    
    // Texas Instruments: SLOS, SBOS, SLVS prefixes
    if (/^(lm|tps|tlv|ina|ads)/.test(name)) {
      return `site:ti.com "${componentName}" (SLOS OR SBOS OR SLVS OR SLUS) filetype:pdf`;
    }
    
    // Analog Devices: Rev letter, preliminary
    if (/^(ad|lt|adm|adp)/.test(name)) {
      return `site:analog.com "${componentName}" (Rev OR preliminary) filetype:pdf`;
    }
    
    // STMicroelectronics: DS prefix
    if (/^(stm|l[0-9]|vn)/.test(name)) {
      return `site:st.com "${componentName}" "DS" filetype:pdf`;
    }
    
    // Microchip: DS prefix
    if (/^(pic|atmega|attiny|sam|mcp)/.test(name)) {
      return `site:microchip.com "${componentName}" "DS" filetype:pdf`;
    }
    
    return null;
  }

  /**
   * Extract likely PDF URLs from Google Dork patterns
   * Note: This constructs probable URLs based on search patterns
   * In production, you'd use Google Custom Search API or web scraping
   */
  extractUrlsFromDork(dork, componentName) {
    const urls = [];
    const cleanName = componentName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    const cleanNameUnderscore = componentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanNameDash = componentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Extract site: operator if present
    const siteMatch = dork.match(/site:([^\s]+)/);
    if (siteMatch) {
      const domain = siteMatch[1];
      
      // Common URL patterns for that domain
      const patterns = this.getUrlPatternsForDomain(domain, componentName);
      urls.push(...patterns);
    }
    
    // Common datasheet URL patterns across all sites
    urls.push(
      // Pattern 1: Direct PDF
      `https://www.alldatasheet.com/datasheet-pdf/pdf/1/${cleanName}.html`,
      `https://datasheetspdf.com/pdf-file/1/${cleanName}/1`,
      
      // Pattern 2: Manufacturer direct
      `https://www.ti.com/lit/ds/symlink/${cleanName}.pdf`,
      `https://www.analog.com/media/en/technical-documentation/${cleanName}.pdf`,
      `https://ww1.microchip.com/downloads/en/DeviceDoc/${cleanName}.pdf`,
      `https://www.st.com/resource/en/datasheet/${cleanName}.pdf`,
      
      // Pattern 3: With variations
      `https://www.alldatasheet.com/datasheet-pdf/pdf/${cleanNameDash}.html`,
      `https://datasheetspdf.com/pdf/${cleanNameUnderscore}`,
      
      // Pattern 4: Datasheet Archive
      `https://datasheetarchive.com/pdf/download.php?id=${cleanName}`,
      
      // Pattern 5: ElectroDragon
      `http://www.electrodragon.com/w/images/${componentName}_Datasheet.pdf`
    );
    
    return urls;
  }

  /**
   * Get URL patterns for specific domains
   */
  getUrlPatternsForDomain(domain, componentName) {
    const urls = [];
    const cleanName = componentName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    
    const patterns = {
      'ti.com': [
        `https://www.ti.com/lit/ds/symlink/${cleanName}.pdf`,
        `https://www.ti.com/lit/gpn/${cleanName}`,
        `https://www.ti.com/product/${componentName}`
      ],
      'analog.com': [
        `https://www.analog.com/media/en/technical-documentation/${cleanName}.pdf`,
        `https://www.analog.com/media/en/technical-documentation/data-sheets/${cleanName}.pdf`
      ],
      'microchip.com': [
        `https://ww1.microchip.com/downloads/en/DeviceDoc/${cleanName}.pdf`,
        `https://ww1.microchip.com/downloads/en/DeviceDoc/${cleanName}-datasheet.pdf`
      ],
      'st.com': [
        `https://www.st.com/resource/en/datasheet/${cleanName}.pdf`,
        `https://www.st.com/content/ccc/resource/technical/document/datasheet/${cleanName}.pdf`
      ],
      'nxp.com': [
        `https://www.nxp.com/docs/en/data-sheet/${componentName}.pdf`,
        `https://www.nxp.com/docs/en/data-sheet/${cleanName}.pdf`
      ],
      'infineon.com': [
        `https://www.infineon.com/dgdl/Infineon-${componentName}-DataSheet.pdf`,
        `https://www.infineon.com/dgdl/${componentName}.pdf`
      ],
      'espressif.com': [
        `https://www.espressif.com/sites/default/files/documentation/${cleanName}_datasheet_en.pdf`,
        `https://www.espressif.com/sites/default/files/${cleanName}_datasheet_en.pdf`
      ]
    };
    
    return patterns[domain] || [];
  }

  /**
   * Search manufacturer sites
   */
  searchManufacturerSites(componentName) {
    const urls = [];
    const sites = this.getManufacturerSites();

    // Common manufacturer patterns
    const manufacturers = this.guessManufacturer(componentName);

    for (const mfr of manufacturers) {
      if (sites[mfr]) {
        // Construct likely URL
        const baseUrl = sites[mfr];
        const cleanName = componentName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
        urls.push(`${baseUrl}${cleanName}.pdf`);
        urls.push(`${baseUrl}${componentName.toLowerCase()}.pdf`);
      }
    }

    return urls;
  }

  /**
   * Search common datasheet hosting sites (AllDataSheet already searched separately)
   */
  searchHostingSites(componentName) {
    const urls = [];
    const cleanName = componentName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    
    // Common datasheet sites (AllDataSheet.com already searched as priority #1)
    const sites = [
      // DatasheetsPDF.com
      `https://datasheetspdf.com/pdf/${componentName}`,
      `https://datasheetspdf.com/pdf-file/1/${cleanName}/1`,
      
      // DigChip.com
      `https://www.digchip.com/datasheets/${componentName}.html`,
      `https://www.digchip.com/datasheets/${cleanName}.html`,
      
      // Datasheet4U.com
      `https://www.datasheet4u.com/${componentName}.html`,
      `https://www.datasheet4u.com/${cleanName}.html`,
      
      // DatasheetArchive.com
      `https://www.datasheetarchive.com/pdf/download.php?id=${cleanName}`,
      `https://www.datasheetarchive.com/${componentName}-datasheet.html`,
      
      // DatasheetCatalog.com
      `https://www.datasheetcatalog.com/datasheets_pdf/${componentName[0]}/${componentName}.shtml`,
      
      // Datasheets.com (e.g. TE Connectivity, part pages)
      `https://www.datasheets.com/search?q=${encodeURIComponent(componentName)}`,
      
      // Octopart (component search engine)
      `https://octopart.com/search?q=${componentName}`,
      
      // SparkFun / Adafruit (hobby electronics)
      `https://www.sparkfun.com/datasheets/${componentName}.pdf`,
      `https://cdn-shop.adafruit.com/datasheets/${componentName}.pdf`
    ];

    urls.push(...sites);

    return urls;
  }

  /**
   * Search by component type
   */
  searchByType(componentName, type) {
    const urls = [];

    const typeKeywords = {
      'IC': ['microcontroller', 'integrated-circuit'],
      'MOSFET': ['mosfet', 'transistor'],
      'LED': ['led', 'light-emitting-diode'],
      'Sensor': ['sensor', 'transducer'],
      'Regulator': ['voltage-regulator', 'ldo']
    };

    const keywords = typeKeywords[type] || [];
    
    for (const keyword of keywords) {
      urls.push(
        `https://www.alldatasheet.com/datasheet-pdf/pdf/${componentName}/${keyword}.html`
      );
    }

    return urls;
  }

  /**
   * Guess manufacturer from component name
   */
  guessManufacturer(componentName) {
    const manufacturers = [];
    const name = componentName.toLowerCase();

    const patterns = {
      'ti': /^(lm|tps|tlv|ina|ads)/,
      'analog': /^(ad|lt|adm|adp)/,
      'microchip': /^(pic|atmega|attiny|sam|mcp)/,
      'st': /^(stm|l[0-9]|vn)/,
      'nxp': /^(lpc|i2c|pca)/,
      'infineon': /^(irfz|bss|irf)/,
      'onsemi': /^(2n|bc|mur)/,
      'vishay': /^(tsop|vs|si)/,
      'diodes': /^(dmg|dfn)/
    };

    for (const [mfr, pattern] of Object.entries(patterns)) {
      if (pattern.test(name)) {
        manufacturers.push(mfr);
      }
    }

    // Add generic search if no specific manufacturer found
    if (manufacturers.length === 0) {
      manufacturers.push('ti', 'analog', 'st'); // Most common
    }

    return manufacturers;
  }

  /**
   * Download file from URL (PDF or HTML)
   */
  async downloadFile(url, componentName, index) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const timeout = setTimeout(() => {
        reject(new Error('Download timeout'));
      }, this.timeout);

      protocol.get(url, async (response) => {
        // Follow redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          clearTimeout(timeout);
          const redirectUrl = response.headers.location;
          console.log(`      ↪️  Redirect to: ${redirectUrl}`);
          this.downloadFile(redirectUrl, componentName, index)
            .then(resolve)
            .catch(reject);
          return;
        }

        const contentType = response.headers['content-type'] || '';

        // Handle PDF files
        if (contentType.includes('pdf')) {
          const fileName = `${this.sanitizeFilename(componentName)}_${index}.pdf`;
          const filePath = path.join(this.downloadDir, fileName);

          // Check if already downloaded
          if (fs.existsSync(filePath)) {
            console.log(`      ✓ Already downloaded: ${fileName}`);
            clearTimeout(timeout);
            resolve(filePath);
            return;
          }

          const fileStream = fs.createWriteStream(filePath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            clearTimeout(timeout);
            fileStream.close();
            console.log(`      ✓ Downloaded: ${fileName}`);
            resolve(filePath);
          });

          fileStream.on('error', (error) => {
            clearTimeout(timeout);
            fs.unlink(filePath, () => {});
            reject(error);
          });
        }
        // Handle HTML pages (AllDataSheet.com, etc.)
        else if (contentType.includes('html')) {
          console.log(`      📄 HTML page detected - extracting with AI...`);
          
          let htmlContent = '';
          response.on('data', (chunk) => {
            htmlContent += chunk.toString();
          });

          response.on('end', async () => {
            clearTimeout(timeout);
            
            try {
              // Extract specifications from HTML using Ollama
              const specs = await this.extractSpecsFromHTML(htmlContent, componentName, url);
              
              if (specs) {
                // Save extracted specs to knowledge base
                const knowledgeFile = path.join(this.downloadDir, `${this.sanitizeFilename(componentName)}_specs.json`);
                fs.writeFileSync(knowledgeFile, JSON.stringify(specs, null, 2));
                console.log(`      ✅ Extracted specs saved: ${path.basename(knowledgeFile)}`);
                resolve(knowledgeFile);
              } else {
                reject(new Error('Failed to extract specs from HTML'));
              }
            } catch (error) {
              reject(error);
            }
          });

          response.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
        else {
          clearTimeout(timeout);
          reject(new Error(`Unsupported content type: ${contentType}`));
        }

      }).on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Extract specifications from HTML page using Ollama
   */
  async extractSpecsFromHTML(htmlContent, componentName, sourceUrl) {
    console.log(`\n      ╔════════════════════════════════════════════════════════════╗`);
    console.log(`      ║         OLLAMA AI SPECIFICATION EXTRACTION                 ║`);
    console.log(`      ╚════════════════════════════════════════════════════════════╝`);
    console.log(`      🤖 Sending HTML to Ollama for analysis...`);
    console.log(`      📦 Component: ${componentName}`);
    console.log(`      🔗 Source: ${sourceUrl.substring(0, 60)}...`);

    try {
      // Clean HTML (remove scripts, styles, etc.)
      const cleanText = this.cleanHTML(htmlContent);
      console.log(`      📊 HTML cleaned: ${cleanText.length} characters`);

      // Build prompt for Ollama
      const prompt = `
You are an electronics engineer analyzing a datasheet webpage for component: ${componentName}

Extract the following specifications from this webpage text:

WEBPAGE TEXT:
${cleanText.substring(0, 10000)}

Extract and return ONLY a JSON object with these specifications:
{
  "component": "${componentName}",
  "voltage": {
    "min": "value with unit",
    "typ": "value with unit",
    "max": "value with unit"
  },
  "current": {
    "operating": "value with unit",
    "sleep": "value with unit (if available)"
  },
  "package": "package type(s)",
  "pins": "pin count",
  "temperature": {
    "min": "value with unit",
    "max": "value with unit"
  },
  "features": ["key feature 1", "key feature 2"],
  "applications": ["typical application 1", "typical application 2"],
  "manufacturer": "manufacturer name",
  "description": "brief component description"
}

Return ONLY valid JSON, no other text.
`;

      console.log(`      🚀 Calling Ollama API...`);
      console.log(`      📝 Prompt length: ${prompt.length} characters\n`);

      const response = await fetch(`http://127.0.0.1:11434/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      // Log RAW Ollama output as big paragraph
      console.log(`      ╔════════════════════════════════════════════════════════════╗`);
      console.log(`      ║              RAW OLLAMA OUTPUT (FULL)                      ║`);
      console.log(`      ╚════════════════════════════════════════════════════════════╝\n`);
      
      // Word wrap the output at 60 characters for readability
      const wrappedOutput = this.wordWrap(aiResponse, 60);
      wrappedOutput.split('\n').forEach(line => {
        console.log(`      ${line}`);
      });
      
      console.log(`\n      ╚════════════════════════════════════════════════════════════╝\n`);

      // Parse JSON from response
      const specs = this.parseAIResponse(aiResponse);
      
      if (specs) {
        specs.source_url = sourceUrl;
        specs.extracted_at = new Date().toISOString();
        
        console.log(`      ✅ Successfully extracted specifications!`);
        console.log(`      📊 Summary:`);
        console.log(`         Voltage: ${specs.voltage?.typ || 'N/A'}`);
        console.log(`         Current: ${specs.current?.operating || 'N/A'}`);
        console.log(`         Package: ${specs.package || 'N/A'}`);
        console.log(`         Manufacturer: ${specs.manufacturer || 'N/A'}`);
        
        return specs;
      } else {
        console.log(`      ⚠️  Could not parse JSON from AI response`);
        return null;
      }

    } catch (error) {
      console.log(`      ❌ Ollama extraction failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean HTML - remove scripts, styles, tags, keep text
   */
  cleanHTML(html) {
    let text = html;
    
    // Remove script tags and content
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags and content
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.trim();
    
    return text;
  }

  /**
   * Word wrap text for console output
   */
  wordWrap(text, width) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  }

  /**
   * Ensure download directory exists
   */
  async ensureDownloadDir() {
    if (!fs.existsSync(this.downloadDir)) {
      await mkdirAsync(this.downloadDir, { recursive: true });
      console.log(`   ✓ Created download directory: ${this.downloadDir}`);
    }
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  }

  /**
   * Extract text from downloaded PDFs
   */
  async extractTextFromPDFs(downloads) {
    console.log('\n📄 Extracting text from PDFs...');
    
    const results = [];

    for (const download of downloads) {
      try {
        const text = await this.extractPDFText(download.path);
        results.push({
          ...download,
          text,
          extracted: true
        });
        console.log(`   ✓ Extracted: ${path.basename(download.path)}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to extract: ${path.basename(download.path)}`);
        results.push({
          ...download,
          text: '',
          extracted: false
        });
      }
    }

    return results;
  }

  /**
   * Extract text from PDF (requires pdf-parse)
   */
  async extractPDFText(pdfPath) {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      // pdf-parse not installed or PDF corrupted
      return '';
    }
  }

  /**
   * Clean up old downloads
   */
  async cleanupOldDownloads(daysOld = 7) {
    console.log(`\n🧹 Cleaning up downloads older than ${daysOld} days...`);
    
    if (!fs.existsSync(this.downloadDir)) return;

    const files = fs.readdirSync(this.downloadDir);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const file of files) {
      const filePath = path.join(this.downloadDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        removed++;
      }
    }

    console.log(`   ✓ Removed ${removed} old files`);
  }

  /**
   * Parse AI response to extract specs
   */
  parseAIResponse(response) {
    try {
      // Try to find JSON in response (look for first { to last })
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.parsed = true;
        return parsed;
      }
    } catch (error) {
      console.log(`      ⚠️  JSON parsing error: ${error.message}`);
    }

    // Try to extract key-value pairs manually
    try {
      const specs = {
        component: this.extractValue(response, /component[:\s]+([^\n,]+)/i),
        voltage: {
          min: this.extractValue(response, /voltage[:\s]+min[:\s]+([^\n,]+)/i),
          typ: this.extractValue(response, /voltage[:\s]+typ[:\s]+([^\n,]+)/i),
          max: this.extractValue(response, /voltage[:\s]+max[:\s]+([^\n,]+)/i)
        },
        current: {
          operating: this.extractValue(response, /current[:\s]+operating[:\s]+([^\n,]+)/i)
        },
        package: this.extractValue(response, /package[:\s]+([^\n,]+)/i),
        manufacturer: this.extractValue(response, /manufacturer[:\s]+([^\n,]+)/i),
        raw: response,
        parsed: false
      };
      
      return specs;
    } catch (error) {
      // Return raw response as fallback
      return {
        raw: response,
        parsed: false
      };
    }
  }

  /**
   * Extract value using regex
   */
  extractValue(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }
}

/**
 * Integration with AI Compiler
 */
class DatasheetAIIntegration {
  constructor(downloader, ollamaUrl = 'http://127.0.0.1:11434') {
    this.downloader = downloader;
    this.ollamaUrl = ollamaUrl;
  }

  /**
   * Get component specs using downloaded datasheets
   */
  async getComponentSpecs(componentName, componentType) {
    console.log(`\n🤖 Getting specs for ${componentName}...`);

    // Step 1: Download datasheets
    const downloads = await this.downloader.searchAndDownload(componentName, componentType);

    if (downloads.length === 0) {
      console.log('   ⚠️  No datasheets found, using defaults');
      return this.getDefaultSpecs(componentName, componentType);
    }

    // Step 2: Extract text
    const extracted = await this.downloader.extractTextFromPDFs(downloads);

    // Step 3: Ask AI to analyze datasheets
    const specs = await this.analyzeWithAI(componentName, extracted);

    return specs;
  }

  /**
   * Analyze datasheets with AI
   */
  async analyzeWithAI(componentName, datasheets) {
    console.log('   🤖 Analyzing datasheets with AI...');

    // Combine all extracted text
    const combinedText = datasheets
      .filter(d => d.extracted)
      .map(d => d.text.substring(0, 5000)) // First 5000 chars each
      .join('\n\n---\n\n');

    if (!combinedText) {
      console.log('   ⚠️  No text extracted');
      return null;
    }

    // Create prompt for AI
    const prompt = `
Analyze this datasheet for component: ${componentName}

Extract key specifications:
1. Operating voltage (min, typ, max)
2. Current consumption
3. Package type
4. Pin count and pinout
5. Typical application circuit
6. Critical design notes

Datasheet text:
${combinedText}

Provide specifications in JSON format.
`;

    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt: prompt,
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      const data = await response.json();
      const specs = this.parseAIResponse(data.response);
      
      console.log('   ✓ AI analysis complete');
      return specs;

    } catch (error) {
      console.error('   ❌ AI analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Parse AI response to extract specs
   */
  parseAIResponse(response) {
    try {
      // Try to find JSON in response (look for first { to last })
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.parsed = true;
        return parsed;
      }
    } catch (error) {
      console.log(`      ⚠️  JSON parsing error: ${error.message}`);
    }

    // Try to extract key-value pairs manually
    try {
      const specs = {
        component: this.extractValue(response, /component[:\s]+([^\n,]+)/i),
        voltage: {
          min: this.extractValue(response, /voltage[:\s]+min[:\s]+([^\n,]+)/i),
          typ: this.extractValue(response, /voltage[:\s]+typ[:\s]+([^\n,]+)/i),
          max: this.extractValue(response, /voltage[:\s]+max[:\s]+([^\n,]+)/i)
        },
        current: {
          operating: this.extractValue(response, /current[:\s]+operating[:\s]+([^\n,]+)/i)
        },
        package: this.extractValue(response, /package[:\s]+([^\n,]+)/i),
        manufacturer: this.extractValue(response, /manufacturer[:\s]+([^\n,]+)/i),
        raw: response,
        parsed: false
      };
      
      return specs;
    } catch (error) {
      // Return raw response as fallback
      return {
        raw: response,
        parsed: false
      };
    }
  }

  /**
   * Extract value using regex
   */
  extractValue(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Get default specs when no datasheet found
   */
  getDefaultSpecs(componentName, componentType) {
    const defaults = {
      'IC': {
        voltage: '3.3V-5V',
        current: '10-100mA',
        package: 'DIP/SOIC'
      },
      'MOSFET': {
        voltage: '30V',
        current: '5A',
        package: 'SOT-23'
      },
      'LED': {
        voltage: '2.0V',
        current: '20mA',
        package: '0805'
      }
    };

    return defaults[componentType] || {
      voltage: 'Unknown',
      current: 'Unknown',
      package: 'Unknown'
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Automatic Datasheet Downloader                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const downloader = new DatasheetDownloader();
  const aiIntegration = new DatasheetAIIntegration(downloader);

  // Get component from command line or use example
  const componentName = process.argv[2] || 'ESP32-WROOM-32';
  const componentType = process.argv[3] || 'IC';

  console.log(`Component: ${componentName}`);
  console.log(`Type: ${componentType}\n`);

  // Search and download
  const specs = await aiIntegration.getComponentSpecs(componentName, componentType);

  console.log('\n📊 Component Specifications:');
  console.log(JSON.stringify(specs, null, 2));

  // Cleanup old downloads
  await downloader.cleanupOldDownloads(7);

  console.log('\n✅ Done!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { DatasheetDownloader, DatasheetAIIntegration };
