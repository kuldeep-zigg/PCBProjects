# ⚡ SYSTEM FLOW - QUICK REFERENCE

**One-Page Overview of AI PCB Design System**

---

## 🔄 SIMPLE 3-STEP FLOW

```
1. INPUT          2. PROCESS           3. OUTPUT
   ↓                  ↓                     ↓
┌─────────┐     ┌──────────┐         ┌──────────┐
│ my-     │     │ Web      │         │ Ready    │
│ board   │────>│ Scraping │────────>│ PCB      │
│ .md     │     │ + Ollama │         │ Design   │
└─────────┘     └──────────┘         └──────────┘
```

---

## 📊 DETAILED 11-STEP FLOW

```
Step 1:  User creates markdown file (inputs/my-board.md)
           ↓
Step 2:  Auto-designer detects file (npm run auto:fast)
           ↓
Step 3:  Extract components (ESP32, BME280, LM358)
           ↓
Step 4:  Multi-site scraping (11 websites searched)
           ↓
Step 5:  HTML sanitization (remove scripts/styles)
           ↓
Step 6:  Section extraction (tables, specs, text)
           ↓
Step 7:  Send bulk data to Ollama (30 KB)
           ↓
Step 8:  Ollama extracts specifications
           ↓
Step 9:  Generate schematic (EasyEDA JSON)
           ↓
Step 10: Generate BOM (LCSC markdown)
           ↓
Step 11: Quality evaluation + Learning loop
           ↓
         ✅ COMPLETE!
```

---

## 🌐 MULTI-SITE SCRAPER FLOW

```
Component Name
    ↓
┌───────────────────────┐
│ Search 11 Websites:   │
│  1. AllDataSheet      │
│  2. Octopart          │
│  3. DatasheetCatalog  │
│  4. Datasheets.com    │
│  5. Texas Instruments │
│  6. STMicroelectronics│
│  7. Microchip         │
│  8. NXP               │
│  9. ON Semiconductor  │
│  10. Vishay           │
└──────────┬────────────┘
           │
           ↓
Save HTML (raw + sanitized)
Extract sections (tables, specs)
           ↓
Send 30 KB to Ollama
           ↓
Get comprehensive specs
```

---

## 🧹 DATA PROCESSING FLOW

```
Raw HTML (88 KB)
    ↓
Remove scripts (-15 KB)
    ↓
Remove styles (-3 KB)
    ↓
Clean whitespace
    ↓
Clean HTML (70 KB)
    ↓
Extract tables (36)
Extract specs (5)
Extract metadata (11)
    ↓
Structured JSON
```

---

## 🤖 OLLAMA INTEGRATION FLOW

```
Component Data (from 11 sites)
    ↓
Compile bulk data:
• 11 sources
• 45 tables
• 50,000 chars
    ↓
Create prompt (30 KB)
    ↓
Send to Ollama (DeepSeek-R1:7b)
    ↓
Ollama analyzes & extracts:
• Voltage ranges
• Current specs
• Temperature
• Package types
• Manufacturer
    ↓
Return JSON specs
    ↓
Save to knowledge base
```

---

## 📁 FILE FLOW

```
inputs/my-board.md
    ↓
Auto-designer reads
    ↓
knowledge-base/
├── html-storage/ (raw HTML)
├── html-sanitized/ (clean)
├── html-sections/ (JSON)
└── ollama-extractions/ (specs)
    ↓
output/
├── schematic.json (EasyEDA)
├── bom.md (BOM)
├── pin-table.md (reference)
└── design-report.md (docs)
```

---

## ⚡ COMMAND FLOW

```bash
# Step 1: Organize
./organize-inputs.sh

# Step 2: Start system
npm run auto:fast
    │
    ├─> For each component:
    │   npm run scrape:multi <component>
    │       ├─> Search 11 sites
    │       ├─> Save & sanitize HTML
    │       └─> Send to Ollama
    │
    ├─> Generate pin tables
    ├─> Call Ollama for schematic
    ├─> Convert to EasyEDA
    └─> Generate BOM

# Step 3: Quality check
npm run evaluate

# Step 4: View results
cat output/schematic.json
```

---

## 🎯 KEY METRICS

```
Per Component:
├─ Websites: 11
├─ Time: 2-3 minutes
├─ HTML saved: 2-3 MB
├─ Tables: 40-50
└─ Data to Ollama: 30 KB

Per Board:
├─ Components: 3-10
├─ Total time: 5-10 minutes
├─ Success rate: 85%+
└─ Files generated: 4-6
```

---

## ✅ COMPARISON

### **Before (Old System):**
```
- 1 website
- 0 KB to Ollama
- "HTML cleaned: 0 characters"
- Missing specs
```

### **After (New System):**
```
- 11 websites
- 30 KB to Ollama
- 45 tables extracted
- Complete specs
```

---

## 🎯 USE CASES

### **Use Case 1: Simple Component**
```
Input:  LM358 op-amp
Action: npm run scrape:multi LM358
Time:   2-3 minutes
Output: Complete specs from 11 sources
```

### **Use Case 2: Complex Board**
```
Input:  ESP32 + sensors + power
Action: npm run auto:fast
Time:   5-10 minutes
Output: Schematic + BOM + Docs
```

### **Use Case 3: Learning**
```
Input:  Previous designs
Action: npm run learn
Output: Improved rules & patterns
```

---

## 📊 SYSTEM LAYERS

```
┌─────────────────────────────────┐
│  Layer 5: Learning & Feedback   │ ← Self-improvement
├─────────────────────────────────┤
│  Layer 4: Design Generation     │ ← Schematics & BOMs
├─────────────────────────────────┤
│  Layer 3: AI Reasoning          │ ← Ollama processing
├─────────────────────────────────┤
│  Layer 2: Data Processing       │ ← Sanitize & extract
├─────────────────────────────────┤
│  Layer 1: Knowledge Acquisition │ ← Web scraping
└─────────────────────────────────┘
```

---

## 🔄 CONTINUOUS LOOP

```
Design → Scrape → Extract → Generate
    ↑                              ↓
    └─── Learn ← Evaluate ←────────┘
```

---

## 📖 DOCUMENTATION

**Comprehensive Guides:**
- `SYSTEM-FLOW.md` - Complete flows (all diagrams)
- `VISUAL-FLOW.txt` - ASCII art visualization
- `MULTI-SITE-SCRAPER-GUIDE.md` - Web scraping details
- `ENHANCED-SCRAPER-GUIDE.md` - Chromium scraper
- This file - Quick reference

**Status:** Production Ready  
**Version:** 2.0  
**Updated:** February 2026

🔄🚀✨
