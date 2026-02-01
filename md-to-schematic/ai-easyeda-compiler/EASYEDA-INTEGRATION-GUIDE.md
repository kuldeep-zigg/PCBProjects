# 🔌 EasyEDA Integration Guide

**Complete workflow: AI Compiler → EasyEDA Pro → PCB Manufacturing**

---

## 🎯 Overview

This system integrates **AI-powered schematic generation** with **EasyEDA Pro** for seamless PCB design and manufacturing.

```
┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐
│  Requirements   │  →    │ AI Compiler  │  →    │  schematic.json │
│  (Markdown)     │       │  (Ollama)    │       │  (EasyEDA)      │
└─────────────────┘       └──────────────┘       └─────────────────┘
                                                           ↓
┌─────────────────┐       ┌──────────────┐       ┌─────────────────┐
│  Manufacturing  │  ←    │  PCB Layout  │  ←    │  EasyEDA Pro    │
│  (JLCPCB)       │       │  (Gerbers)   │       │  (Import)       │
└─────────────────┘       └──────────────┘       └─────────────────┘
```

---

## 📦 What You Need

### Software
- ✅ **Node.js** v18+ (for AI compiler)
- ✅ **Ollama** (local AI models)
- ✅ **EasyEDA Pro** (schematic/PCB editor)
- ✅ AI Models installed:
  - `ollama pull llama3.1:8b`

### Files
- ✅ AI EasyEDA Compiler (this directory)
- ✅ EasyEDA Extension (`easyeda-extension/`)
- ✅ Your project requirements (markdown)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Generate Schematic with AI

```bash
cd ai-easyeda-compiler

# Option A: Use example requirements
node compiler-mvp.js

# Option B: Use custom requirements
echo "Design ESP32 sensor board" > requirements/my-board.md
node compiler-mvp.js
```

**Output:**
- `output/schematic.json` ✅
- `output/bom.md` ✅
- `output/design-report.md` ✅

---

### Step 2: Import into EasyEDA Pro

#### Method A: Using Extension (Best)

1. **Install Extension:**
   - Open EasyEDA Pro
   - Extensions → Manage Extensions
   - Click "Load Local Extension"
   - Select folder: `ai-easyeda-compiler/easyeda-extension/`
   - Click "Install"

2. **Import Schematic:**
   - Tools → **Import AI Schematic**
   - Select: `output/schematic.json`
   - Click "Open"
   - ✅ Schematic imported!

#### Method B: Manual Import

1. Open EasyEDA Pro
2. File → Import → EasyEDA JSON
3. Select: `output/schematic.json`
4. Review imported schematic
5. Adjust component positions if needed

---

### Step 3: Generate PCB & Order

1. **Convert to PCB:**
   - In EasyEDA: Design → Convert Schematic to PCB
   - PCB layout window opens

2. **Layout PCB:**
   - Auto-route or manual placement
   - Add ground plane (bottom layer)
   - Run DRC (Design Rule Check)

3. **Export for Manufacturing:**
   - File → Export → Gerber
   - Save gerbers + drill files

4. **Order from JLCPCB:**
   - Upload gerbers to jlcpcb.com
   - Select options (2-layer, 1oz copper, HASL)
   - Add SMT assembly (optional)
   - Place order

---

## 🔧 Complete Integration Workflow

### Automated Integration

Use the integration bridge for one-command workflow:

```bash
# Run full pipeline
node integrate.js

# With custom requirements
node integrate.js requirements/my-project.md

# Verbose mode
node integrate.js --verbose
```

**What it does:**
1. Runs AI compiler
2. Validates output
3. Prepares files for EasyEDA
4. Generates summary report
5. Prints import instructions

---

## 📚 Extension Features

### Available Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| **Import AI Schematic** | Import compiler output | Tools menu |
| **Import from Compiler Output** | Auto-load latest output | Tools menu |
| **Update Current Schematic** | Replace with new AI output | Tools menu |
| **Generate BOM** | Extract BOM from schematic | Context menu |
| **Validate Design** | Check design rules | Context menu |
| **Export for Manufacturing** | Generate Gerbers + BOM | Context menu |

### Import AI Schematic

Imports the AI-generated schematic JSON:
- Loads `output/schematic.json`
- Places all components
- Creates nets/wires
- Adds power symbols
- Adds labels

### Update Current Schematic

Updates an open schematic with new AI output:
- Clears current design
- Imports new components/nets
- Preserves document settings
- Useful for iterative design

### Generate BOM

Extracts BOM from current schematic:
- Groups components by value
- Counts quantities
- Exports to markdown
- Saves to `output/generated-bom.md`

### Validate Design

Checks design against rules:
- Unconnected nets
- Missing decoupling capacitors
- Power integrity
- Reports warnings/errors

---

## 🎓 Step-by-Step Tutorial

### Example: IR Light Curtain System

#### 1. Prepare Requirements

```markdown
<!-- requirements/ir-light-curtain.md -->
# IR Light Curtain System

Design a dual-PCB IR detection system:
- PCB A: RP2040 + 10× IR receivers
- PCB B: Shift register + 10× IR LEDs
- 5-pin board-to-board connection
- Use LCSC components only
```

#### 2. Run AI Compiler

```bash
node compiler-mvp.js
```

**AI generates:**
- Complete schematic (JSON)
- LCSC-ready BOM
- Design documentation
- Component specifications

#### 3. Review Output

```bash
# Check schematic
cat output/schematic.json | head -50

# Check BOM
cat output/bom.md

# Check report
cat output/design-report.md
```

#### 4. Import to EasyEDA

```bash
# Automated integration
node integrate.js
```

**In EasyEDA Pro:**
- Tools → Import AI Schematic
- Select `output/schematic.json`
- Review imported design
- Verify connections

#### 5. Generate PCB Layout

**In EasyEDA:**
1. Design → Convert Schematic to PCB
2. Arrange components (follow spacing from reference design)
3. Add ground plane:
   - Layer: Bottom
   - Net: GND
   - Fill priority: 1
4. Route power traces (20 mil width)
5. Route signal traces (10 mil width)
6. Add mounting holes (M3, 3.2mm)
7. Run DRC: Tools → Design Rule Check
8. Fix any errors

#### 6. Export for Manufacturing

**Gerber Export:**
- File → Export → Gerber
- Format: RS-274X
- Output directory: `output/gerbers/`

**BOM Export:**
- Extension → Generate BOM
- Verify LCSC part numbers
- Save as CSV for JLCPCB

#### 7. Order PCBs

**JLCPCB Upload:**
1. Go to jlcpcb.com
2. Click "Order Now"
3. Upload gerber ZIP
4. Configure:
   - Layers: 2
   - Dimensions: Auto-detect
   - Quantity: 10
   - Thickness: 1.6mm
   - Color: Green (or custom)
   - Surface Finish: HASL
5. Add SMT Assembly (optional):
   - Upload BOM CSV
   - Upload CPL file
   - Select component placement side
6. Review quote
7. Add to cart
8. Checkout

**Lead Time:** 5-7 days fabrication + 3-5 days shipping = **10-14 days total**

---

## 🔄 Iterative Design Workflow

### Scenario: Improve Initial Design

1. **Import first version:**
   ```bash
   node compiler-mvp.js
   # Import to EasyEDA
   ```

2. **Review in EasyEDA:**
   - Check component placement
   - Verify nets
   - Identify improvements

3. **Update requirements:**
   ```markdown
   <!-- requirements/ir-light-curtain-v2.md -->
   # IR Light Curtain v2
   
   Improvements:
   - Add ESD protection on data lines
   - Add indicator LEDs
   - Use 16 channels instead of 10
   ```

4. **Regenerate:**
   ```bash
   node compiler-mvp.js requirements/ir-light-curtain-v2.md
   ```

5. **Update EasyEDA:**
   - In EasyEDA: Extension → Update Current Schematic
   - Select new `output/schematic.json`
   - Compare with previous version
   - Merge changes

6. **Iterate until perfect!**

---

## ⚙️ Extension Installation (Detailed)

### Prerequisites

- **EasyEDA Pro** version 2.0 or higher
- **Node.js** (for extension development)

### Installation Steps

1. **Locate Extension Directory:**
   ```
   ai-easyeda-compiler/easyeda-extension/
   ├── manifest.json
   └── main.js
   ```

2. **Open EasyEDA Pro:**
   - Launch EasyEDA Pro
   - Sign in (if required)

3. **Load Extension:**
   - Go to: **Extensions → Manage Extensions**
   - Click: **"+ Load Local Extension"**
   - Navigate to: `ai-easyeda-compiler/easyeda-extension/`
   - Click: **"Select Folder"**

4. **Verify Installation:**
   - Check: **Tools** menu should show "Import AI Schematic"
   - Check: Console logs "AI EasyEDA Compiler Extension ready!"

5. **Test Extension:**
   - Generate a schematic: `node compiler-mvp.js`
   - In EasyEDA: Tools → Import AI Schematic
   - Select `output/schematic.json`
   - Verify import works

### Troubleshooting Installation

**Issue: Extension not appearing in Tools menu**
- Solution: Restart EasyEDA Pro
- Solution: Check console for errors (F12 → Console)

**Issue: Import fails with "Invalid JSON"**
- Solution: Verify schematic.json format
- Solution: Run `node integrate.js` to validate

**Issue: Components not placed correctly**
- Solution: Check EasyEDA library for missing components
- Solution: Use "Method B: Manual Import" instead

---

## 📊 Schematic JSON Format

### Structure

```json
{
  "docType": "EasyEDA Schematic",
  "version": "6.5.30",
  "title": "Project Name",
  "components": [
    {
      "uuid": "U1-UUID",
      "type": "Module",
      "designator": "U1",
      "value": "Raspberry Pi Pico",
      "position": { "x": 400, "y": 300 },
      "rotation": 0,
      "pins": [...]
    }
  ],
  "nets": [
    {
      "name": "+5V",
      "color": "#FF0000",
      "connections": [
        { "component": "U1", "pin": "39" },
        { "component": "C1", "pin": "1" }
      ]
    }
  ],
  "power_symbols": [...],
  "labels": [...]
}
```

### Customization

You can manually edit `output/schematic.json` before importing:

**Change component positions:**
```json
"position": { "x": 500, "y": 350 }
```

**Change net colors:**
```json
"color": "#FF0000"  // Red for power
"color": "#008000"  // Green for signals
```

**Add labels:**
```json
"labels": [
  {
    "text": "Custom Note",
    "position": { "x": 100, "y": 100 },
    "size": 12
  }
]
```

---

## 🐛 Troubleshooting

### AI Compiler Issues

**"Cannot connect to Ollama"**
```bash
# Start Ollama
ollama serve

# Verify connection
curl http://127.0.0.1:11434/api/tags

# Try again
node compiler-mvp.js
```

**"No requirements found"**
```bash
# Create requirements file
echo "Design ESP32 board" > requirements/test.md

# Run compiler
node compiler-mvp.js
```

**"AI did not generate valid JSON"**
- Check `output/logs/ai-raw-response.json`
- Simplify requirements
- Try different AI model
- Run again (AI is non-deterministic)

---

### EasyEDA Import Issues

**"Invalid JSON format"**
```bash
# Validate JSON
node integrate.js

# Check format
cat output/schematic.json | head -20
```

**"Component not found in library"**
- EasyEDA may not have exact component
- Extension creates placeholder
- Replace with similar component from library
- Or: Create custom symbol

**"Nets not connecting"**
- Manual routing may be needed
- Check pin numbers in JSON
- Verify component footprints
- Use net labels for clarity

---

### Integration Bridge Issues

**"Compiler timeout"**
- Increase timeout in `integrate.js`
- Check Ollama is responding
- Try smaller requirement file

**"Extension not found"**
```bash
# Check extension exists
ls easyeda-extension/

# Reinstall in EasyEDA
# Extensions → Manage → Load Local → Select folder
```

---

## 💡 Best Practices

### Requirements Writing

**Good:**
```markdown
# WiFi Temperature Sensor

Design a board with:
- ESP32-WROOM-32 for WiFi
- BME280 sensor (I2C address 0x76)
- 0.96" OLED display (I2C address 0x3C)
- USB-C power input (5V)
- 3.3V regulation (AMS1117-3.3)
- Status LED on GPIO2
- Use LCSC components only
- Prefer 0805 SMD passives
```

**Bad:**
```markdown
# Sensor Board

Make a board with sensors and WiFi
```

### Component Selection

- Always specify LCSC part numbers in requirements (if known)
- Prefer "Basic" parts for lower cost
- Check stock availability before finalizing
- Provide alternate parts for critical components

### Design Validation

Before ordering:
1. ✅ Run DRC in EasyEDA (no errors)
2. ✅ Check power connections (VCC, GND)
3. ✅ Verify component values (resistors, capacitors)
4. ✅ Check pin assignments match datasheet
5. ✅ Verify trace widths (power: 20mil, signal: 10mil)
6. ✅ Add mounting holes
7. ✅ Check PCB dimensions fit enclosure

### Cost Optimization

- Use 0805 SMD passives (cheapest)
- Consolidate resistor/capacitor values
- Prefer LCSC Basic parts
- Order qty 10 for best price/unit
- Consider SMT assembly (faster, fewer errors)

---

## 📁 File Structure

```
ai-easyeda-compiler/
├── compiler-mvp.js              # AI compiler (main)
├── integrate.js                 # Integration bridge
├── package.json                 # Dependencies
│
├── requirements/                # Your project specs
│   ├── example-esp32-led.md
│   └── ir_light_curtain_formal.md
│
├── rules-md/                    # Design rules
│   ├── component-selection-rules.md
│   └── industrial_rules.md
│
├── examples-md/                 # Reference designs
│   ├── esp32-minimal-reference.md
│   └── ir_light_curtain_reference.md
│
├── output/                      # Generated files
│   ├── schematic.json          ← Import this to EasyEDA
│   ├── bom.md
│   ├── design-report.md
│   └── logs/
│
└── easyeda-extension/           # EasyEDA extension
    ├── manifest.json
    └── main.js
```

---

## 🎓 Advanced Usage

### Custom AI Models

Edit `compiler-mvp.js`:
```javascript
const CONFIG = {
  models: {
    reasoning: 'deepseek-r1:7b',    // Circuit analysis
    design: 'llama3.1:8b',          // Schematic generation
    math: 'phi4:14b'                // Component calculations
  }
};
```

### Multi-Model Orchestration

For better results, integrate with the full multi-model system:

```bash
# Use multi-model orchestrator
node ai-training/multi-model-orchestrator.js

# Then run integration
node integrate.js
```

### Custom Component Libraries

Add custom components to `examples-md/`:
```markdown
# Custom Component Library

## U1: Custom Sensor Module
- Package: Custom_Module_40pin
- LCSC: C123456
- Pins:
  - Pin 1: VCC (3.3V)
  - Pin 2: GND
  - Pin 3: SDA
  - Pin 4: SCL
```

---

## 🚀 Production Workflow

### For Professional Use

1. **Design Phase:**
   - Write detailed requirements
   - Run AI compiler
   - Import to EasyEDA
   - Review and validate

2. **Prototyping:**
   - Order PCBs (qty 5-10)
   - Hand-assemble SMT (or use JLCPCB SMT)
   - Test functionality
   - Iterate design

3. **Production:**
   - Finalize design (DRC passed)
   - Order production quantity (100+)
   - Full SMT assembly
   - Quality control testing
   - Ship to customers

### Version Control

Use git for your projects:
```bash
git init
git add requirements/ output/ easyeda-extension/
git commit -m "Initial PCB design"
git tag v1.0
```

---

## 📞 Support & Resources

### Documentation
- **README.md** - System overview
- **QUICKSTART.md** - Get started in 30 seconds
- **AI-EASYEDA-COMPILER-ARCHITECTURE.md** - System design
- **EASYEDA-INTEGRATION-GUIDE.md** - This guide

### External Resources
- EasyEDA Pro: https://easyeda.com/
- JLCPCB: https://jlcpcb.com/
- LCSC Components: https://www.lcsc.com/
- Ollama: https://ollama.ai/

### Community
- EasyEDA Forum: https://easyeda.com/forum/
- JLCPCB Community: https://jlcpcb.com/forum/

---

## ✅ Integration Checklist

Before ordering PCBs:

- [ ] Requirements written and validated
- [ ] AI compiler run successfully
- [ ] Schematic JSON generated
- [ ] BOM generated with LCSC part numbers
- [ ] Imported into EasyEDA Pro
- [ ] All components placed correctly
- [ ] All nets connected properly
- [ ] Power symbols added (VCC, GND)
- [ ] Labels and notes added
- [ ] PCB layout completed
- [ ] Ground plane added (bottom layer)
- [ ] DRC passed (no errors)
- [ ] Gerbers generated
- [ ] BOM exported for JLCPCB
- [ ] Ready to order!

---

**END OF INTEGRATION GUIDE**

🎉 **You're now ready to design PCBs with AI + EasyEDA!** 🎉

For questions or issues, review the documentation or check the troubleshooting section.
