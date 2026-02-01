# ⚡ CHROMIUM SCRAPER - QUICK START

**Get started in 5 minutes!**

---

## 📦 STEP 1: INSTALL

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler

# Install Puppeteer (downloads Chromium ~170 MB)
npm install puppeteer
```

**Wait for it to complete - this downloads Chromium browser!**

---

## 🚀 STEP 2: TEST

```bash
# Test with a simple component
npm run scrape LM358
```

**You should see:**
```
╔════════════════════════════════════════════════════════════╗
║        CHROMIUM WEB SCRAPER - LAUNCHING                    ║
╚════════════════════════════════════════════════════════════╝

🚀 Launching Chromium browser...
✅ Browser launched successfully!

┌─────────────────────────────────────────────────────────┐
│ SEARCHING: AllDataSheet.com for LM358                   │
└─────────────────────────────────────────────────────────┘

🌐 Navigating to: https://www.alldatasheet.com/...
✅ Page loaded!
📸 Screenshot saved: LM358_screenshot.png
...
✅ Data saved: LM358_complete.json
```

---

## 📁 STEP 3: CHECK OUTPUT

```bash
# View scraped data
ls knowledge-base/web-scraped/

# Expected files:
#   LM358_complete.json
#   LM358_scraped.json
#   LM358_screenshot.png

# View downloaded PDFs
ls pdf/datasheets-chromium/

# Expected files:
#   LM358.pdf (or similar)
```

---

## 🎯 STEP 4: USE IT

### **Learn Single Component:**
```bash
npm run scrape ESP32-WROOM-32
npm run scrape BME280
npm run scrape AMS1117-3.3
```

### **Batch Learn Multiple:**
```bash
npm run scrape:batch ESP32 LM358 BME280 AMS1117 MAX3232
```

### **AllDataSheet Only (faster):**
```bash
npm run scrape:all LM358
```

---

## 📊 WHAT YOU GET

For **each component**, you get:

```
knowledge-base/web-scraped/
  ├── COMPONENT_complete.json        ← All data consolidated
  ├── COMPONENT_scraped.json         ← AllDataSheet data
  ├── COMPONENT_screenshot.png       ← Page screenshot
  └── COMPONENT_manufacturer.json    ← Mfg site data (if found)

pdf/datasheets-chromium/
  └── COMPONENT.pdf                  ← Downloaded datasheet
```

---

## 🔍 VIEW THE DATA

```bash
# View JSON data
cat knowledge-base/web-scraped/LM358_complete.json

# View screenshot
open knowledge-base/web-scraped/LM358_screenshot.png

# View PDF
open pdf/datasheets-chromium/LM358.pdf
```

---

## 🎓 INTEGRATE WITH AUTO-DESIGNER

```bash
# 1. Learn components with Chromium
npm run scrape:batch ESP32 BME280 AMS1117

# 2. Harvest knowledge
npm run harvest

# 3. Start automated designer
npm run auto:fast
```

**The auto-designer will now use the Chromium-scraped data!**

---

## ⚡ COMMANDS REFERENCE

| Command | What It Does | Example |
|---------|--------------|---------|
| `npm run scrape <COMP>` | Learn 1 component | `npm run scrape LM358` |
| `npm run scrape:batch <C1> <C2> ...` | Learn multiple | `npm run scrape:batch ESP32 LM358` |
| `npm run scrape:all <COMP>` | AllDataSheet only | `npm run scrape:all BME280` |

---

## ✅ VERIFICATION

**After scraping LM358, verify:**

```bash
# 1. Check files exist
ls knowledge-base/web-scraped/LM358*

# Should see:
✅ LM358_complete.json
✅ LM358_scraped.json  
✅ LM358_screenshot.png

# 2. Check JSON content
cat knowledge-base/web-scraped/LM358_complete.json

# Should see:
{
  "component": "LM358",
  "timestamp": "2026-02-01...",
  "sources": {
    "allDataSheet": {
      "specs": { "voltage": "...", ... },
      "datasheetLinks": [ ... ]
    }
  }
}

# 3. Check screenshot
open knowledge-base/web-scraped/LM358_screenshot.png

# Should see: Screenshot of AllDataSheet.com search results
```

---

## 🎯 REAL-WORLD EXAMPLE

**Scenario:** You're designing an ESP32 sensor board.

```bash
# 1. Learn all components
npm run scrape:batch ESP32-WROOM-32 BME280 AMS1117-3.3 SN74HC595

# 2. Check what was learned
ls knowledge-base/web-scraped/

# Output:
ESP32-WROOM-32_complete.json
ESP32-WROOM-32_screenshot.png
BME280_complete.json
BME280_screenshot.png
AMS1117-3.3_complete.json
AMS1117-3.3_screenshot.png
SN74HC595_complete.json
SN74HC595_screenshot.png

# 3. Check PDFs
ls pdf/datasheets-chromium/

# Output:
ESP32-WROOM-32.pdf
BME280.pdf
AMS1117-3.3.pdf
SN74HC595.pdf

# 4. Create your design
cat > inputs/sensor-board.md << 'EOF'
# ESP32 Sensor Board

## Components
- ESP32-WROOM-32
- BME280 environmental sensor
- AMS1117-3.3 regulator
- SN74HC595 shift register

## Requirements
- Industrial grade
- USB powered
- I2C communication
EOF

# 5. Start auto-designer
npm run auto:fast

# System will use the Chromium-scraped data!
```

---

## ⚠️ TROUBLESHOOTING

### **Error: Puppeteer not installed**
```bash
npm install puppeteer
```

### **Error: Browser failed to launch**
```bash
# On macOS, grant permissions
xattr -d com.apple.quarantine node_modules/puppeteer/.local-chromium/*/chrome-mac/Chromium.app

# Or reinstall
npm uninstall puppeteer
npm install puppeteer
```

### **Slow downloads**
- Normal! Chromium rendering takes time
- Expect 10-30 seconds per component
- Batch mode waits 3 seconds between components

---

## 🎉 YOU'RE READY!

**Three commands to remember:**

```bash
# 1. Learn one component
npm run scrape ESP32

# 2. Learn many components
npm run scrape:batch ESP32 BME280 LM358

# 3. Use in automated system
npm run auto:fast
```

---

**Next: Read `CHROMIUM-SCRAPER-GUIDE.md` for advanced usage!**

🌐🚀✨
