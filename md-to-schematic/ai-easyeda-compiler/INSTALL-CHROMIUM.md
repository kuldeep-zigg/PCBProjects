# 🚀 CHROMIUM SCRAPER - INSTALLATION GUIDE

**Set up real browser-based component learning in 3 steps!**

---

## 📦 STEP 1: INSTALL PUPPETEER

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler

# Install Puppeteer (downloads Chromium browser)
npm install puppeteer
```

**This will:**
- Install Puppeteer library
- Download Chromium browser (~170 MB)
- Store in `node_modules/puppeteer/.local-chromium/`

**Wait time: 2-5 minutes depending on internet speed**

---

## ✅ STEP 2: VERIFY INSTALLATION

```bash
# Check if Puppeteer installed
npm list puppeteer

# Expected output:
# ai-easyeda-compiler@2.0.0
# └── puppeteer@21.x.x
```

---

## 🧪 STEP 3: TEST

```bash
# Test with a simple component
npm run scrape LM358
```

**Expected output:**
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
📄 Extracted page text: 12,453 characters
🔗 Found 6 datasheet links
...
✅ Data saved: LM358_complete.json
✅ Browser closed
```

---

## 📁 VERIFY OUTPUT FILES

```bash
# Check scraped data
ls knowledge-base/web-scraped/

# Should see:
LM358_complete.json
LM358_scraped.json
LM358_screenshot.png

# Check downloaded PDFs
ls pdf/datasheets-chromium/

# Should see:
LM358.pdf (or similar)
```

---

## ⚠️ TROUBLESHOOTING

### **Problem 1: Puppeteer won't install**

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install puppeteer
```

### **Problem 2: Chromium won't launch (macOS)**

```bash
# Grant permissions to Chromium
xattr -d com.apple.quarantine node_modules/puppeteer/.local-chromium/*/chrome-mac/Chromium.app

# Or reinstall
npm uninstall puppeteer
npm install puppeteer
```

### **Problem 3: "Browser closed unexpectedly"**

Check system resources:
- Memory: Need ~500 MB available
- Disk: Need ~200 MB free
- Restart computer if needed

### **Problem 4: Network timeout**

```bash
# Check internet connection
ping www.alldatasheet.com

# Try with longer timeout
# Edit chromium-scraper.js line 72:
timeout: 60000  # 60 seconds
```

---

## 🎯 WHAT TO DO AFTER INSTALLATION

### **1. Organize Your Files**

```bash
# Your inputs/ folder has PDFs and images in wrong place
./organize-inputs.sh

# This moves:
#   PDFs → pdf/datasheets-manual/
#   Images → reference-images/
#   Keeps only .md in inputs/
```

### **2. Learn Project Components**

```bash
# Learn all components for your current project
npm run scrape:batch ESP32-WROOM-32 MAX3232 BME280 LM358 SN74HC595
```

### **3. Harvest Knowledge**

```bash
# Process all scraped data
npm run harvest
```

### **4. Start System**

```bash
# Start automated designer
npm run auto:fast
```

---

## 📊 INSTALLATION VERIFICATION CHECKLIST

Check each item:

- [ ] Puppeteer installed: `npm list puppeteer`
- [ ] Chromium downloaded: Check `node_modules/puppeteer/.local-chromium/`
- [ ] Test scraper works: `npm run scrape LM358`
- [ ] Output files created: `ls knowledge-base/web-scraped/`
- [ ] Screenshot generated: `open knowledge-base/web-scraped/LM358_screenshot.png`
- [ ] Browser closes properly: No zombie processes

**If all checked: ✅ INSTALLATION COMPLETE!**

---

## 🚀 QUICK START COMMANDS

```bash
# After installation, use these commands:

# Learn one component
npm run scrape ESP32-WROOM-32

# Learn many components
npm run scrape:batch ESP32 BME280 LM358

# Quick AllDataSheet search
npm run scrape:all AMS1117

# View results
cat knowledge-base/web-scraped/ESP32-WROOM-32_complete.json
```

---

## 📈 EXPECTED PERFORMANCE

| Operation | Time | Output |
|-----------|------|--------|
| **Install Puppeteer** | 2-5 min | 170 MB downloaded |
| **First browser launch** | 2-3 sec | Chromium starts |
| **Single component** | 20-40 sec | JSON + PDF + screenshot |
| **Batch 5 components** | 2-4 min | 5× JSON, PDFs, screenshots |

---

## ✅ POST-INSTALLATION

After successful installation:

```bash
# 1. Organize files
./organize-inputs.sh

# 2. Learn components
npm run scrape:batch ESP32 BME280 AMS1117

# 3. Check results
ls knowledge-base/web-scraped/
ls pdf/datasheets-chromium/

# 4. Start using system
npm run auto:fast
```

---

## 🎉 YOU'RE READY!

**Chromium scraper is:**
- ✅ Installed (if npm install succeeded)
- ✅ Tested (if test command worked)
- ✅ Ready to use

**Start learning components:**
```bash
npm run scrape ESP32-WROOM-32
```

---

**Read: `CHROMIUM-SCRAPER-GUIDE.md` for complete documentation!**

🌐🚀✨
