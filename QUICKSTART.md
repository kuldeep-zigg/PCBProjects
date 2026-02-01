# 🚀 VMC PCB Copilot - Quick Start Guide

**Get from idea to PCB design artifacts in 30 seconds!**

---

## ⚡ TL;DR

```bash
cd /Users/zigg/Desktop/CODE/PCBProjects
npm run vmc
```

Done! Check `/ai/output/` for your design files.

---

## 📝 Step-by-Step (First Time)

### 1. Create Your Board Request (2 minutes)

Create a file: `/ai/board_requests/My-Board.md`

```markdown
# My VMC Board - Rev A

## Requirements
- 24V input power
- ESP32 Wi-Fi control
- 10 motor outputs
- Temperature sensor

## Constraints
- Must fit in 100x80mm enclosure
- Pluggable connectors for field wiring
```

### 2. Run the Copilot (5 seconds)

```bash
npm run vmc
```

### 3. Get Your Design Files (instant!)

The system generates in `/ai/output/My-Board/`:

```
✓ Design-Checklist.md      ← Follow this step-by-step
✓ VMC-Mental-Model.md      ← Understand the architecture
✓ BOM-Blocks.md            ← Order these exact parts
✓ Netlist-Spec.md          ← Use for schematic capture
```

### 4. Start Designing! (2-4 hours)

Open EasyEDA Pro or KiCad:
1. Create new project
2. Add components from **BOM-Blocks.md**
3. Follow layout from **VMC-Mental-Model.md**
4. Connect nets per **Netlist-Spec.md**
5. Tick off items in **Design-Checklist.md**

---

## 📖 What Each File Does

### 🔲 Design-Checklist.md
**Your step-by-step guide**

- ✅ Schematic design (power, MCU, communication, sensors)
- ✅ PCB layout (layer stack, routing, zones)
- ✅ DFM checks (trace width, clearances, silkscreen)
- ✅ Bring-up plan (power-up sequence, tests, pass criteria)

**Use it to:** Make sure you don't forget critical design elements

---

### 🧠 VMC-Mental-Model.md
**How everything connects**

- Block diagram (visual system overview)
- Signal flow (data paths, power tree)
- Dirty/Clean zone strategy (noise isolation)
- Trace width guidelines (current capacity)
- Connector pinouts (no mistakes!)

**Use it to:** Understand the big picture before diving into details

---

### 📋 BOM-Blocks.md
**Exact parts to order**

- Component blocks (power, MCU, communication, sensors)
- Primary choices (recommended parts)
- Alternates (backup if out of stock)
- Sourcing (LCSC, DigiKey, Mouser)
- Cost estimate (per board and in volume)

**Use it to:** Know exactly what to order from suppliers

---

### 🔌 Netlist-Spec.md
**Wiring instructions**

- All nets (VIN_24, GND, +5V, +3V3, RS485_A/B, I2C, etc.)
- Component connections (which pin goes where)
- Footprint assignments (0805, SOT-223, SOIC-8, etc.)
- PCB stackup (2-layer with ground plane)

**Use it to:** Wire up your schematic correctly

---

## 🎯 Example Workflow

### Scenario: You need a VMC main board with ESP32 and RS485

**Step 1: Write requirements** (2 min)
```bash
nano ai/board_requests/VMC-Main-RevA.md
```

**Step 2: Run copilot** (5 sec)
```bash
npm run vmc
```

**Step 3: Review output** (10 min)
```bash
open ai/output/VMC-Main-RevA/
```

**Step 4: Start EasyEDA Pro** (4 hours)
- Add ESP32-WROOM-32 module
- Add LM2596S buck converter
- Add AMS1117-3.3 LDO
- Add MAX3485 RS485 transceiver
- Connect per netlist
- Layout per mental model
- Tick off checklist items

**Step 5: Order PCBs** (next day)
- Export Gerbers from EasyEDA
- Upload to JLCPCB
- Order BOM parts from LCSC

**Step 6: Bring-up testing** (1 hour)
- Follow bring-up plan in checklist
- Tick off test results
- Document in `/ai/testing_reports/`

**Total time: ~7 hours** (vs 16+ hours manual)

---

## 🔧 Customization

### Want different components?
Edit the generated `BOM-Blocks.md` before ordering.

### Need to change design rules?
The copilot uses learned rules from:
- `md-to-schematic/ai-easyeda-compiler/rules-md/AUTO_GENERATED_RULES.md`

Add new rules:
```bash
cd md-to-schematic/ai-easyeda-compiler
npm run smart-learn "Always use TVS diodes on RS485 lines"
```

### Want to teach the system new components?
```bash
cd md-to-schematic/ai-easyeda-compiler
npm run smart-learn "TPS54331"
```

---

## 🚨 Troubleshooting

### "No board requests found"
**Solution:** Create a `.md` file in `/ai/board_requests/` with your requirements

### "Ollama error"
**Solution:** Start Ollama: `ollama list` (should show models)

### "Component knowledge not found"
**Solution:** Run `cd md-to-schematic/ai-easyeda-compiler && npm run smart-learn "ESP32"`

### "Generated files look generic"
**Totally normal!** The copilot gives you a **starting template**. You customize it during schematic capture based on your specific needs.

---

## 💡 Pro Tips

1. **Always read Mental Model first** - Understand the architecture before schematic
2. **Use checklist as you go** - Don't wait until the end
3. **Keep alternates handy** - BOM has backups for every critical part
4. **Document failures** - Add to `/ai/testing_reports/` so system learns
5. **Update master.md** - Add your discoveries to `/ai/master.md`

---

## 📊 What Gets Auto-Applied?

Every time you run `npm run vmc`, the system automatically:

✅ Applies 50+ VMC hardware rules (bypass caps, ground planes, protection)
✅ Uses learned component profiles (ESP32, LDO, RS485, sensors)
✅ Enforces design standards (0805 passives, rework-friendly ICs)
✅ Adds test points (VIN, 5V, 3V3, GND, RS485)
✅ Separates dirty/clean zones (motors vs MCU)
✅ Includes protection (reverse polarity, TVS, flyback)
✅ Creates bring-up plan (power-up sequence, tests)
✅ Updates audit trail (`/ai/master.md`)

---

## 🎓 Learning Resources

- **VMC-README.md** - Complete system documentation
- **MASTER.md** - PCB design system (in root directory)
- **/ai/master.md** - VMC project audit trail
- **/ai/output/** - Example generated artifacts

---

## 🤝 Next Steps

1. ✅ You've run the copilot for the first time
2. 📖 Review the generated files in `/ai/output/`
3. 🧠 Read the Mental Model to understand architecture
4. 🎨 Open EasyEDA Pro / KiCad and start designing
5. 📋 Tick off checklist items as you go
6. 🧪 Follow bring-up plan after boards arrive
7. 📝 Document results in `/ai/testing_reports/`
8. 🔄 System learns from your experience!

---

**Remember:** This system is a **design assistant**, not a magic button. It gives you:
- ✅ A solid starting point
- ✅ Field-tested design patterns
- ✅ Complete component recommendations
- ✅ Detailed bring-up procedures

You still need to:
- 🧠 Understand your requirements
- 🎨 Create the schematic and layout
- 🧪 Test and iterate
- 📝 Document learnings

**But you save 50-70% of design time** by not reinventing the wheel! 🚀

---

**Questions?** Check `VMC-README.md` for detailed documentation.

**Found a bug?** The system learns! Add your finding to `/ai/testing_reports/` and it improves for next time.
