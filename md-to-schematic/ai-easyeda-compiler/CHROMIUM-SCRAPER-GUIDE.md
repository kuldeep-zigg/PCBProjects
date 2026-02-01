# 🌐 CHROMIUM WEB SCRAPER - Complete Guide

**Real Browser-Based Component Learning System**

---

## 🎯 WHAT IS THIS?

A **headless Chromium browser** that can:
- ✅ **Surf real websites** (like AllDataSheet.com, manufacturer sites)
- ✅ **Execute JavaScript** (handle dynamic content)
- ✅ **Extract component specs** (voltage, current, package, etc.)
- ✅ **Download PDFs automatically** (datasheets)
- ✅ **Take screenshots** (for debugging)
- ✅ **Navigate intelligently** (follow links, search results)
- ✅ **Learn from multiple sources** (comprehensive data gathering)

**This is MUCH more powerful than simple HTTP requests!**

---

## 🚀 INSTALLATION

### **Step 1: Install Puppeteer**

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler

# Install Puppeteer (includes Chromium)
npm install puppeteer
```

**This will download Chromium (~170 MB) - wait for it to complete!**

---

## 📚 USAGE

### **Command 1: Learn Single Component**

```bash
npm run scrape ESP32-WROOM-32
```

**What it does:**
1. Launches Chromium browser
2. Searches AllDataSheet.com
3. Extracts all text and specifications
4. Finds datasheet PDF links
5. Downloads first PDF
6. Searches manufacturer website (if detected)
7. Saves all data to `knowledge-base/web-scraped/`
8. Takes screenshot for debugging
9. Closes browser

**Output:**
```
✅ ESP32-WROOM-32_scraped.json        (AllDataSheet data)
✅ ESP32-WROOM-32_complete.json       (consolidated data)
✅ ESP32-WROOM-32_screenshot.png      (page screenshot)
📥 ESP32-WROOM-32.pdf                  (downloaded datasheet)
```

---

### **Command 2: Batch Learn Multiple Components**

```bash
npm run scrape:batch ESP32 LM358 BME280 AMS1117 MAX3232
```

**What it does:**
- Processes each component sequentially
- Waits 3 seconds between requests (polite scraping)
- Saves data for all components
- Comprehensive knowledge gathering

**Use for:**
- Learning entire BOM at once
- Building component library
- Project-specific research

---

### **Command 3: AllDataSheet Only**

```bash
npm run scrape:all LM358
```

**What it does:**
- Searches ONLY AllDataSheet.com
- Faster (no manufacturer search)
- Good for quick lookups

---

## 📊 WHAT DATA IS EXTRACTED?

### **From AllDataSheet.com:**

```json
{
  "component": "ESP32-WROOM-32",
  "source": "https://www.alldatasheet.com/view.jsp?Searchword=ESP32-WROOM-32",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "specs": {
    "voltage": "3.0V - 3.6V",
    "current": "80mA",
    "package": "QFN48",
    "manufacturer": "Espressif Systems",
    "description": "WiFi + Bluetooth SoC"
  },
  "datasheetLinks": [
    {
      "url": "https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf",
      "text": "ESP32-WROOM-32 Datasheet"
    }
  ],
  "pageText": "Full page text content..."
}
```

### **From Manufacturer Sites:**

```json
{
  "component": "ESP32-WROOM-32",
  "manufacturer": "Espressif Systems",
  "source": "https://www.espressif.com/...",
  "productInfo": {
    "title": "ESP32-WROOM-32 - Espressif Systems",
    "description": "Powerful WiFi+BT+BLE MCU module...",
    "text": "Product page content..."
  }
}
```

---

## 🎯 REAL-WORLD EXAMPLES

### **Example 1: Learn ESP32**

```bash
npm run scrape ESP32-WROOM-32
```

**Console Output:**
```
╔════════════════════════════════════════════════════════════╗
║        CHROMIUM WEB SCRAPER - LAUNCHING                    ║
╚════════════════════════════════════════════════════════════╝

🚀 Launching Chromium browser...
✅ Browser launched successfully!

┌─────────────────────────────────────────────────────────┐
│ SEARCHING: AllDataSheet.com for ESP32-WROOM-32          │
└─────────────────────────────────────────────────────────┘

🌐 Navigating to: https://www.alldatasheet.com/view.jsp?Searchword=ESP32-WROOM-32
✅ Page loaded!

📸 Screenshot saved: ESP32-WROOM-32_screenshot.png

📄 Extracted page text:
   Length: 15,432 characters
   First 500 chars: ESP32-WROOM-32 WiFi+BT+BLE MCU Module...

🔗 Found 8 datasheet links:

   1. ESP32-WROOM-32 Datasheet (PDF)
      https://www.espressif.com/.../esp32-wroom-32_datasheet_en.pdf
   2. ESP32 Technical Reference Manual
      https://www.espressif.com/.../esp32_technical_reference_manual_en.pdf
   ... and 6 more

🔍 Extracting specifications from page...

📊 Extracted specifications:
   Voltage: 3.0V - 3.6V
   Current: 80mA
   Package: QFN48
   Manufacturer: Espressif Systems

✅ Data saved: ESP32-WROOM-32_scraped.json

📥 Downloading PDF: https://www.espressif.com/.../esp32-wroom-32_datasheet_en.pdf

✅ PDF download initiated

📚 Source 2: Espressif Systems Official Site

🌐 Navigating to: https://www.espressif.com/en/products/esp32-wroom-32
✅ Page loaded!

📄 Product Information:
   Title: ESP32-WROOM-32 - Espressif Systems
   Description: Powerful, generic Wi-Fi+BT+BLE MCU module...

✅ Data saved: ESP32-WROOM-32_espressif_scraped.json

╔════════════════════════════════════════════════════════════╗
║              LEARNING COMPLETE                             ║
╚════════════════════════════════════════════════════════════╝

✅ Component: ESP32-WROOM-32
✅ Sources scraped: 2
✅ Data saved: ESP32-WROOM-32_complete.json

✅ Browser closed
```

---

### **Example 2: Batch Learn Project BOM**

```bash
npm run scrape:batch ESP32-WROOM-32 BME280 AMS1117-3.3 MAX3232 LM358
```

**What happens:**
1. Learns ESP32-WROOM-32 (waits 3s)
2. Learns BME280 (waits 3s)
3. Learns AMS1117-3.3 (waits 3s)
4. Learns MAX3232 (waits 3s)
5. Learns LM358

**Total time: ~3-5 minutes for 5 components**

**Result:**
```
knowledge-base/web-scraped/
  ├── ESP32-WROOM-32_complete.json
  ├── ESP32-WROOM-32_scraped.json
  ├── ESP32-WROOM-32_screenshot.png
  ├── BME280_complete.json
  ├── BME280_scraped.json
  ├── BME280_screenshot.png
  ├── AMS1117-3.3_complete.json
  ├── AMS1117-3.3_scraped.json
  └── ... (all 5 components)

pdf/datasheets-chromium/
  ├── ESP32-WROOM-32.pdf
  ├── BME280.pdf
  ├── AMS1117-3.3.pdf
  └── ... (downloaded PDFs)
```

---

## 🔧 ADVANCED USAGE

### **Integrate with Auto-Designer**

You can modify `auto-pcb-designer-optimized.js` to use Chromium scraper instead of simple HTTP:

```javascript
// In auto-pcb-designer-optimized.js
const { ChromiumScraper } = require('./chromium-scraper');

async downloadDatasheetsWithChromium(components) {
  const scraper = new ChromiumScraper();
  await scraper.launch();
  
  for (const comp of components) {
    await scraper.learnComponent(comp);
  }
  
  await scraper.close();
}
```

---

## 🎯 WHY USE CHROMIUM SCRAPER?

### **Advantages over HTTP requests:**

| Feature | HTTP Requests | Chromium Scraper |
|---------|---------------|------------------|
| **JavaScript rendering** | ❌ No | ✅ Yes (executes JS) |
| **Dynamic content** | ❌ Misses content | ✅ Sees everything |
| **Follow links** | ❌ Manual | ✅ Automatic |
| **Download PDFs** | ⚠️ Direct URLs only | ✅ Any PDF link |
| **Screenshots** | ❌ No | ✅ Yes (debugging) |
| **Form filling** | ❌ No | ✅ Yes (search forms) |
| **Cookie handling** | ⚠️ Manual | ✅ Automatic |
| **Human-like browsing** | ❌ No | ✅ Yes |

---

## 📸 SCREENSHOTS

The scraper saves screenshots of every page for debugging:

```bash
# View screenshots
open knowledge-base/web-scraped/ESP32-WROOM-32_screenshot.png
```

**Use for:**
- Debugging scraping issues
- Verifying correct pages loaded
- Visual record of data sources

---

## ⚠️ IMPORTANT NOTES

### **1. Respect Websites**
- Waits 3 seconds between requests
- Only scrapes public data
- Doesn't overwhelm servers

### **2. Chromium Size**
- First install downloads ~170 MB
- Stored in `node_modules/puppeteer/.local-chromium/`
- One-time download

### **3. Headless Mode**
- Runs without visible browser window
- Faster and more efficient
- Set `headless: false` to see browser

### **4. Network Required**
- Needs internet connection
- Can't run offline

---

## 🔍 TROUBLESHOOTING

### **Error: "Chromium not found"**

```bash
# Reinstall Puppeteer
npm uninstall puppeteer
npm install puppeteer
```

### **Error: "Timeout waiting for page"**

```bash
# Increase timeout in chromium-scraper.js
await page.goto(url, { 
  timeout: 60000 // 60 seconds
});
```

### **Error: "Download failed"**

Check that:
- URL is valid
- PDF is publicly accessible
- Network is working

---

## 📊 COMPARISON: HTTP vs Chromium

### **Current system (HTTP):**

```bash
npm run download ESP32 IC
# → Simple HTTP requests
# → May miss dynamic content
# → Fast but limited
```

### **New system (Chromium):**

```bash
npm run scrape ESP32-WROOM-32
# → Full browser rendering
# → Executes JavaScript
# → Sees all content
# → Slower but comprehensive
```

**Recommendation:**
- Use **HTTP** for quick searches (existing system)
- Use **Chromium** for comprehensive learning (new system)

---

## 🎯 INTEGRATION WORKFLOW

### **Complete Learning Pipeline:**

```bash
# 1. Quick HTTP search (fast)
npm run download ESP32 IC

# 2. Comprehensive Chromium scraping (thorough)
npm run scrape ESP32-WROOM-32

# 3. Harvest all knowledge
npm run harvest

# 4. Start automated designer
npm run auto:fast
```

**This gives you:**
- ✅ Fast initial results (HTTP)
- ✅ Comprehensive data (Chromium)
- ✅ Both stored in knowledge base
- ✅ Used by auto-designer

---

## 📁 FILE LOCATIONS

```
knowledge-base/
  └── web-scraped/                    ← Chromium scraped data
      ├── ESP32-WROOM-32_complete.json
      ├── ESP32-WROOM-32_scraped.json
      ├── ESP32-WROOM-32_screenshot.png
      └── ...

pdf/
  └── datasheets-chromium/            ← Chromium downloaded PDFs
      ├── ESP32-WROOM-32.pdf
      └── ...

pdf/
  └── datasheets-auto/                ← HTTP downloaded specs
      ├── esp32_specs.json
      └── ...
```

---

## 🚀 QUICK START

```bash
# 1. Install Puppeteer
npm install puppeteer

# 2. Test with single component
npm run scrape LM358

# 3. Check output
ls knowledge-base/web-scraped/
ls pdf/datasheets-chromium/

# 4. Batch learn project
npm run scrape:batch ESP32 BME280 AMS1117

# 5. Use in automated system
npm run auto:fast
```

---

## ✅ SUMMARY

**You now have:**
- ✅ Real Chromium browser for web scraping
- ✅ Intelligent component learning
- ✅ Automatic PDF downloads
- ✅ Multi-source data gathering
- ✅ Screenshot debugging
- ✅ Batch processing
- ✅ Integration with existing system

**Commands:**
```bash
npm run scrape <COMPONENT>          # Learn single component
npm run scrape:batch <COMP1> ...    # Batch learn
npm run scrape:all <COMPONENT>      # AllDataSheet only
```

**This makes your system:**
- 🧠 **Smarter** (executes JavaScript, sees dynamic content)
- 🔍 **More thorough** (multi-source learning)
- 📸 **Debuggable** (screenshots of every page)
- 🤖 **More human-like** (real browser behavior)

---

**Status: ✅ CHROMIUM SCRAPER READY**  
**Install: `npm install puppeteer`**  
**Use: `npm run scrape <COMPONENT>`**

🌐🚀✨
