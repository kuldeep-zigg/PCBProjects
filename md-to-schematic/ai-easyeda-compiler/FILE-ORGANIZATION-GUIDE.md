# 📁 FILE ORGANIZATION GUIDE

**How to organize files for the Professional Engineering System**

---

## 🎯 **THE PROBLEM**

Your `inputs/` folder has **34 files** but the system only processes **2 files** (.md files).

**Why?** The automated system is designed to **only read `.md` (markdown) files** from inputs!

---

## 📂 **CORRECT FOLDER STRUCTURE**

### **✅ inputs/ - PCB Requirements (ONLY .md files)**
```
inputs/
  ├── example-led-blink.md          ← ✅ System reads this
  ├── my-board.md                   ← ✅ System reads this
  ├── esp32-sensor-board.md         ← ✅ Would be read
  └── industrial-controller.md      ← ✅ Would be read

❌ NO PDFs, NO JPGs, NO other files!
```

**Purpose:** User-written PCB design requirements in markdown format.

---

### **✅ pdf/datasheets-manual/ - Manual Datasheets**
```
pdf/
  ├── datasheets-auto/              ← Auto-downloaded by system
  └── datasheets-manual/            ← YOUR manually added PDFs
      ├── 2920L-Datasheet-Update.pdf
      ├── MAX3232CPE+.pdf
      ├── IRF9540NSTRLPBF.pdf
      ├── tsal6400.pdf
      └── ... all your PDF datasheets
```

**Purpose:** Datasheet PDFs for knowledge harvesting.

---

### **✅ reference-images/ - Schematic Images**
```
reference-images/
  ├── ESP32_DEV_KIT.jpg
  ├── MCP3208_connection_3pin_motor_connection.jpg
  ├── SSD1306_128x64_I2C_connection.jpg
  ├── SN74HC595N_3_in_series.jpg
  └── ... all your reference images
```

**Purpose:** Visual references for design (not processed by system).

---

### **✅ examples-md/ - Reference Designs**
```
examples-md/
  ├── esp32-minimal-reference.md
  ├── ir_light_curtain_reference.md
  └── ... working design examples
```

**Purpose:** Proven designs the system learns from.

---

### **✅ outputs/ - Generated Files (AUTO)**
```
outputs/
  ├── schematics/                   ← Generated .json files
  ├── pin-tables/                   ← Generated GPIO tables
  ├── docs/                         ← Generated documentation
  └── logs/                         ← Processing logs
```

**Purpose:** System-generated outputs (never edit manually).

---

## 🚀 **HOW TO USE THE SYSTEM**

### **Step 1: Organize Files**

Run the organization script:
```bash
chmod +x organize-inputs.sh
./organize-inputs.sh
```

**Or manually:**
```bash
# Move PDFs to datasheets folder
mkdir -p pdf/datasheets-manual
mv inputs/*.pdf pdf/datasheets-manual/

# Move images to reference folder
mkdir -p reference-images
mv inputs/*.jpg reference-images/
```

---

### **Step 2: Create PCB Requirements in Markdown**

**Example: `inputs/my-sensor-board.md`**

```markdown
# Industrial Sensor Board

## Requirements
- ESP32-WROOM-32 WiFi module
- BME280 environmental sensor
- MAX3232 RS485 transceiver
- SN74HC595 shift register
- Industrial temperature range (-40 to +85°C)
- ESD protection required

## Features
- Real-time monitoring
- RS485 communication
- Modular design
- Low power sleep mode

## Constraints
- USB power (500mA max)
- LCSC sourcing only
- 2-layer PCB
```

---

### **Step 3: Start Automated System**

```bash
npm run auto:fast
```

**System will:**
1. ✅ Scan `inputs/` every 1 minute
2. ✅ Find `.md` files only
3. ✅ Extract components (ESP32, BME280, MAX3232, etc.)
4. ✅ Download datasheets automatically
5. ✅ Generate pin tables, schematics, BOMs
6. ✅ Save to `outputs/`

---

## 📊 **CURRENT FILE LOCATIONS (Before Organization)**

### **Files in WRONG location:**

| File | Current Location | Should Be |
|------|------------------|-----------|
| **Datasheets (13 PDFs):** | | |
| 2920L-Datasheet-Update.pdf | ❌ inputs/ | ✅ pdf/datasheets-manual/ |
| MAX3232CPE+.pdf | ❌ inputs/ | ✅ pdf/datasheets-manual/ |
| IRF9540NSTRLPBF.pdf | ❌ inputs/ | ✅ pdf/datasheets-manual/ |
| tsal6400.pdf | ❌ inputs/ | ✅ pdf/datasheets-manual/ |
| ... (9 more) | ❌ inputs/ | ✅ pdf/datasheets-manual/ |
| **Images (10 JPGs):** | | |
| ESP32_DEV_KIT.jpg | ❌ inputs/ | ✅ reference-images/ |
| MCP3208_connection_*.jpg | ❌ inputs/ | ✅ reference-images/ |
| SSD1306_*.jpg | ❌ inputs/ | ✅ reference-images/ |
| ... (7 more) | ❌ inputs/ | ✅ reference-images/ |
| **Design docs (1 MD):** | | |
| satron_vending_code_explain.md | ❌ inputs/ | ✅ examples-md/ or docs/ |

### **Files in CORRECT location:**

| File | Location | Status |
|------|----------|--------|
| example-led-blink.md | ✅ inputs/ | ✅ Being processed |
| my-board.md | ✅ inputs/ | ✅ Being processed |

---

## ⚡ **QUICK FIX**

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler

# Run organization script
chmod +x organize-inputs.sh
./organize-inputs.sh

# Verify inputs/ now only has .md files
ls -lh inputs/

# Should see ONLY:
#   example-led-blink.md
#   my-board.md
#   (and any other .md files you create)
```

---

## 📝 **CREATING NEW PCB REQUIREMENTS**

**Template for `inputs/YOUR-BOARD-NAME.md`:**

```markdown
# [Your Board Name]

## Components Needed
- [Component 1 with part number]
- [Component 2 with part number]
- [Component 3 with part number]

## Requirements
- [Voltage/power requirements]
- [Temperature range]
- [Special features]

## Features
- [Feature 1]
- [Feature 2]

## Constraints
- [Any limitations]
```

**System will:**
1. Extract component names
2. Search datasheets online
3. Generate design automatically
4. Output to `outputs/`

---

## 🎯 **WHAT THE SYSTEM READS**

| Folder | Reads | Purpose |
|--------|-------|---------|
| `inputs/` | **ONLY .md files** | User requirements |
| `pdf/datasheets-auto/` | Auto-downloads | Learned datasheets |
| `pdf/datasheets-manual/` | Reference only | Manual datasheets |
| `rules-md/` | Yes | Design rules |
| `examples-md/` | Yes | Reference designs |
| `reference-images/` | No | Visual reference only |

---

## ✅ **VERIFICATION**

After organizing, run:
```bash
# Check inputs/ has only .md files
ls inputs/*.md

# Check PDFs moved
ls pdf/datasheets-manual/*.pdf

# Check images moved
ls reference-images/*.jpg

# Start system
npm run auto:fast
```

**You should see:**
```
👀 Watching: inputs/
✨ Found 2 new file(s)!
   ✓ example-led-blink.md
   ✓ my-board.md
```

---

## 🎉 **SUMMARY**

**Before:**
- ❌ 34 files in inputs/, only 2 processed
- ❌ PDFs and images mixed with requirements
- ❌ System confused

**After:**
- ✅ Only .md files in inputs/
- ✅ PDFs organized in pdf/datasheets-manual/
- ✅ Images in reference-images/
- ✅ System processes everything correctly

---

**Run: `./organize-inputs.sh` to fix automatically!** 🚀
