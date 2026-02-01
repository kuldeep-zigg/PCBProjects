# 🤖 VMC PCB COPILOT - Automated Design System

**One-Command PCB Design Automation for Vending Machine Controller Platform**

---

## 🎯 What This Does

VMC PCB Copilot is a **fully automated PCB design system** that reads your board requirements and instantly generates:

1. ✅ **Design Checklist** - Complete tickable checklist (schematic → layout → DFM → bring-up)
2. 🧠 **Mental Model** - Block diagrams, signal flow, power tree, dirty/clean zones
3. 📋 **BOM + Blocks** - Component selection with exact part numbers, alternates, and sourcing
4. 🔌 **Netlist Spec** - Ready for EasyEDA Pro / KiCad manual entry
5. 📖 **Master Document** - Auto-updated audit trail with daily improvement notes

**Plus:** Integrates your learned VMC hardware rules and component knowledge automatically!

---

## 🚀 Quick Start (ONE COMMAND)

```bash
# From project root
npm run vmc
```

**That's it!** The system will:
- Find your newest board request in `/ai/board_requests/`
- Apply 50+ VMC hardware rules from your knowledge base
- Generate all 4 artifacts in `/ai/output/`
- Update `/ai/master.md` with audit trail
- Give you a complete design package ready for schematic capture

---

## 📁 Project Structure

```
PCBProjects/
├── vmc-pcb-copilot.js          ← Main automation script
├── package.json                 ← npm commands
│
├── ai/                          ← VMC Design Files (Source of Truth)
│   ├── board_requests/          ← Put your board requirements here (*.md)
│   ├── keywords/                ← Design standards, part lists, checklists
│   ├── master.md                ← Living audit trail (auto-updated)
│   ├── output/                  ← Generated artifacts (checklists, BOMs, netlists)
│   └── testing_reports/         ← Bring-up and stress test results
│
└── md-to-schematic/
    └── ai-easyeda-compiler/
        ├── rules-md/
        │   └── AUTO_GENERATED_RULES.md  ← 50+ learned VMC hardware rules
        └── knowledge-base/
            └── web-scraped/      ← Component profiles (ESP32, LDO, RS485, etc.)
```

---

## 📝 How to Use

### Step 1: Create a Board Request

Create a markdown file in `/ai/board_requests/` with your requirements:

```markdown
# VMC Main Board - Rev A

## Requirements
- Input Power: 24V DC
- MCU: ESP32-WROOM-32 (Wi-Fi)
- Communication: RS485 master
- Sensors: Temperature (I2C), IR drop detection
- 6 trays x 10 motors = 60 motors total

## Constraints
- Pluggable terminal blocks for field wiring
- Clean 3.3V rail for ESP32 (isolated from motor noise)
- Test points: VIN_24, 5V, 3V3, GND, RS485_A/B

## Risks
- Motor noise coupling into ESP32 reset
- RS485 bus reliability over daisy-chain
- Thermal management of buck converter
```

### Step 2: Run the Copilot

```bash
npm run vmc
```

### Step 3: Review Generated Files

The system creates in `/ai/output/Your-Board-Name/`:

```
Design-Checklist.md      ← Tickable bring-up checklist
VMC-Mental-Model.md      ← Block diagram + signal flow
BOM-Blocks.md            ← Complete BOM with part numbers
Netlist-Spec.md          ← Netlist for schematic capture
```

### Step 4: Start Schematic Capture

Open EasyEDA Pro or KiCad and follow the generated artifacts:
1. Use **Mental Model** for block placement strategy
2. Use **Netlist Spec** for connections
3. Use **BOM** for exact component selection
4. Follow **Checklist** during design and bring-up

---

## 🛠️ VMC Hardware Standards (Auto-Applied)

The system automatically enforces these learned rules:

### Component Selection
- ✅ 0805 passives (rework-friendly)
- ✅ SOIC/TSSOP/SOT-23 ICs (avoid QFN/BGA)
- ✅ Through-hole terminal blocks for field wiring
- ✅ Popular, easily procurable parts (LCSC/DigiKey)

### Design Rules
- ✅ 100nF bypass cap near every IC power pin
- ✅ 100-1000µF bulk caps near motors and PSU input
- ✅ Separate dirty (motor/switching) from clean (MCU/sensor) zones
- ✅ Solid ground plane on bottom layer
- ✅ Test points on all critical nets
- ✅ Boot/reset/program pads accessible

### Safety & Protection
- ✅ Reverse polarity protection on 24V input
- ✅ TVS diodes on RS485 and external cables
- ✅ Flyback diodes on all inductive loads
- ✅ Fuse/PTC on input power

### Manufacturing
- ✅ Clear silkscreen labels on all connectors
- ✅ DNP footprints for tuning (termination, bias resistors)
- ✅ Different connector families for different voltages
- ✅ Minimum 0.3mm trace/clearance (0.5mm preferred)

---

## 🧠 Learned Knowledge Integration

The system pulls from your existing knowledge base:

### VMC Hardware Rules (50+ rules)
From `rules-md/AUTO_GENERATED_RULES.md`:
- Always use 100nF bypass capacitors near every IC power pin
- Separate dirty (motors, LEDs) from clean (MCU, sensors) areas
- Never power MCU directly from 24V (use buck → LDO strategy)
- Always add flyback protection for motors and coils
- Learn why motors cause resets and how to stop them
- *...and 45+ more field-tested rules*

### Component Profiles (16+ components)
From `knowledge-base/web-scraped/*.json`:
- ESP32, LDO, RS485, capacitors, sensors
- Each includes: datasheets, GitHub examples, public API data
- Multi-source verified information

---

## 📊 Example Output

### Design Checklist (excerpt)
```markdown
## ✓ Schematic Design

### Power Supply
- [ ] 24V input reverse polarity protection (P-MOSFET)
- [ ] Buck converter 24V→5V (min 1A capacity)
- [ ] LDO 5V→3.3V (min 500mA for ESP32)
- [ ] Bulk capacitors near input: 100-1000µF
- [ ] 100nF ceramic bypass caps near EVERY IC
- [ ] Test points: VIN_24, 5V, 3V3, GND

### MCU (ESP32)
- [ ] ESP32-WROOM-32 with antenna clearance
- [ ] Clean 3.3V rail (separate from motor switching)
- [ ] EN pull-up resistor 10kΩ
- [ ] BOOT and RESET buttons
- [ ] Decoupling: 10µF + 100nF near VDD pin
...
```

### Mental Model (excerpt)
```
┌─────────────────────────────────────────────────────┐
│              VMC MAIN BOARD                         │
│                                                     │
│  24V INPUT → Buck 5V → LDO 3.3V → ESP32           │
│       ↓                              ↓             │
│  Motor Power (Dirty)       Sensors (Clean)        │
│       ↓                              ↓             │
│  RS485 Bus → 6 Trays × 10 Motors                  │
└─────────────────────────────────────────────────────┘
```

### BOM + Blocks (excerpt)
```markdown
## Power Supply Block

### Buck Converter (24V → 5V)
| Part Number | Manufacturer | Package | Output | Price |
|-------------|--------------|---------|--------|-------|
| LM2596S-5.0 | TI | TO-263 | 5V @ 3A | $2-3 |

Alternate: TPS54331DR (SOIC-8, higher efficiency)

### LDO Regulator (5V → 3.3V)
| Part Number | Manufacturer | Package | Output | Price |
|-------------|--------------|---------|--------|-------|
| AMS1117-3.3 | AMS | SOT-223 | 3.3V @ 1A | $0.20 |
...
```

---

## 🔧 Advanced Usage

### Add New Components to Knowledge Base
```bash
cd md-to-schematic/ai-easyeda-compiler
npm run smart-learn "TPS54331"
```

### Process New Design Rules
```bash
cd md-to-schematic/ai-easyeda-compiler
npm run smart-learn "Always use TVS diodes on RS485 A/B lines for ESD protection"
```

### Check System Health
```bash
cd md-to-schematic/ai-easyeda-compiler
npm run status
```

---

## 📖 Workflow

```
1. Write board requirements → /ai/board_requests/My-Board.md
                                        ↓
2. Run automation → npm run vmc
                                        ↓
3. System generates → Design Checklist
                   → Mental Model
                   → BOM + Blocks
                   → Netlist Spec
                                        ↓
4. Review artifacts → /ai/output/My-Board/
                                        ↓
5. Start schematic capture in EasyEDA/KiCad
                                        ↓
6. Follow bring-up checklist
                                        ↓
7. Document results → /ai/testing_reports/
                                        ↓
8. System learns from failures → Updates /ai/master.md
```

---

## 🎓 Design Philosophy

### Priorities (in order)
1. **Reliability** - Must work in the field
2. **Serviceability** - Easy to debug and repair
3. **Debug Speed** - Fast bring-up with test points
4. Size - Not a priority
5. Cost - Not a priority

### Why?
- Small batch production (5-40 units)
- Field deployment in vending machines (hard to access)
- Startup velocity > manufacturing cost
- Learning speed > perfect design

### Result
- Large boards with plenty of test points ✅
- Through-hole connectors (easy to replace) ✅
- 0805 passives (hand-solderable) ✅
- Multiple alternates in BOM (supply chain resilience) ✅

---

## 🚨 Common Issues

### "No board requests found"
→ Create a `.md` file in `/ai/board_requests/` with your requirements

### "Ollama error"
→ Make sure Ollama is running: `ollama list`
→ Required models: deepseek-r1:7b, llama3.1:8b

### "Component knowledge not found"
→ Run: `cd md-to-schematic/ai-easyeda-compiler && npm run smart-learn "component-name"`

### "VMC rules not loaded"
→ Check: `md-to-schematic/ai-easyeda-compiler/rules-md/AUTO_GENERATED_RULES.md`
→ If empty, process VMC rules: `npm run process-vmc`

---

## 📚 Documentation

- **This README** - Quick start and usage
- **MASTER.md** - Complete system documentation (PCB design system)
- **/ai/master.md** - VMC project audit trail (auto-updated)
- **/ai/output/** - Generated design artifacts

---

## 🤝 Contributing

This is a living system that learns from every board revision:

1. **After bring-up:** Document failures in `/ai/testing_reports/`
2. **Add learnings:** Run `npm run smart-learn "your-learning-here"`
3. **Update standards:** Edit `/ai/master.md` or add keyword files
4. **Improve copilot:** Modify `vmc-pcb-copilot.js` with new rules

The system gets smarter with every board you design! 🧠

---

## 📊 System Stats

- **VMC Hardware Rules:** 50+
- **Component Profiles:** 16+
- **Automation Time:** ~5 seconds per board
- **Manual Time Saved:** 4-6 hours per design
- **Reliability:** Field-tested design patterns

---

## 🎯 Next Steps

1. **First board?** 
   - Review the example in `/ai/board_requests/VMC-MainBoard-RevA.md`
   - Run `npm run vmc` to see example output

2. **Ready to design?**
   - Create your board request in `/ai/board_requests/`
   - Run `npm run vmc`
   - Start schematic capture with generated artifacts

3. **Want to learn more?**
   - Read `/ai/master.md` for complete system overview
   - Check `MASTER.md` for PCB design system docs
   - Explore `/ai/output/` for example artifacts

---

**Built with 💡 by engineers who got tired of repeating the same mistakes.**

*"Design fast. Learn faster. Build reliable hardware."*
