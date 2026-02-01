# AI EasyEDA Compiler

Transform engineering knowledge into manufacturable PCB designs using AI.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your requirements
echo "Design ESP32 LED board" > requirements/my-project.md

# 3. Compile!
node compiler-mvp.js

# 4. Import into EasyEDA
# File → Import → EasyEDA JSON → select output/schematic.json
```

## 📁 Project Structure

```
ai-easyeda-compiler/
├── requirements/      # Your project requirements (markdown)
├── rules-md/          # Design rules and standards  
├── examples-md/       # Reference designs
├── pdf/               # Datasheets (future)
│   ├── datasheets/
│   └── schematics/
├── output/            # Generated files
│   ├── schematic.json (EasyEDA importable)
│   ├── bom.md         (LCSC ready)
│   └── design-report.md
└── compiler-mvp.js    # Main compiler (MVP version)
```

## 💡 How It Works

```
Requirements.md
     ↓
AI Models (Ollama)
     ↓
EasyEDA JSON
     ↓
Import & Manufacture
```

## 🎯 Current Features (MVP)

- ✅ Markdown requirements parsing
- ✅ Design rules integration
- ✅ AI-powered schematic generation (Llama 3.1)
- ✅ EasyEDA JSON output
- ✅ LCSC BOM generation
- ✅ Design report

## 🔧 Prerequisites

1. **Ollama installed and running**
   ```bash
   ollama serve
   ```

2. **Models installed**
   ```bash
   ollama pull llama3.1:8b
   ```

3. **Node.js** v18+

## 📚 Usage Examples

### Example 1: ESP32 LED Board

```bash
# Use the included example
node compiler-mvp.js

# Output:
#   output/schematic.json
#   output/bom.md
#   output/design-report.md
```

### Example 2: Custom Project

```markdown
<!-- requirements/sensor-board.md -->
# Temperature Sensor Board

Design a board with:
- ESP32-WROOM-32
- BME280 temperature/humidity sensor (I2C)
- OLED display 0.96" (I2C)
- USB-C power input
- 3.3V regulation
```

```bash
node compiler-mvp.js
```

## 🎓 System Architecture

### Pipeline Stages

1. **Knowledge Loader** - Loads rules, examples, requirements
2. **Prompt Builder** - Creates structured AI prompts
3. **AI Orchestrator** - Calls Ollama models
4. **EasyEDA Writer** - Generates valid JSON
5. **BOM Generator** - Creates LCSC-ready BOM
6. **Output Writer** - Saves all files

### AI Models Used

- **Llama 3.1 8B**: Primary design generation
- **DeepSeek-R1 7B**: (Future) Circuit reasoning
- **Phi-4 14B**: (Future) Component calculations

## 📋 Output Files

### schematic.json
EasyEDA-compatible JSON format:
```json
{
  "docType": "EasyEDA Schematic",
  "components": [...],
  "nets": [...],
  "power": [...]
}
```

### bom.md
LCSC-ready Bill of Materials:
```markdown
| Designator | Component | Value | Package | LCSC | Qty |
|------------|-----------|-------|---------|------|-----|
| U1 | ESP32-WROOM-32 | ESP32 | SMD | C82899 | 1 |
```

### design-report.md
Summary and next steps

## 🔄 Workflow

```
1. Write requirements in markdown
   ├─ What board do you need?
   └─ What features?

2. Add design rules (optional)
   ├─ Component preferences
   └─ Design standards

3. Run compiler
   └─ node compiler-mvp.js

4. Review outputs
   ├─ Check schematic.json
   ├─ Review BOM
   └─ Read design report

5. Import to EasyEDA
   ├─ File → Import → EasyEDA JSON
   └─ Select output/schematic.json

6. Finalize & Order
   ├─ Generate PCB layout
   ├─ Run DRC
   └─ Order from JLCPCB
```

## 🐛 Troubleshooting

### "Ollama not found"
```bash
# Start Ollama server
ollama serve

# Verify it's running
curl http://127.0.0.1:11434/api/tags
```

### "AI did not generate valid JSON"
- AI response may need adjustment
- Try simplifying requirements
- Check logs in output/logs/

### "No requirements found"
```bash
# Create requirements file
echo "Design ESP32 board" > requirements/my-project.md
```

## 🚧 Roadmap

### MVP (Current)
- [x] Basic pipeline
- [x] Llama 3.1 integration
- [x] EasyEDA JSON output
- [x] BOM generation

### v0.2 (Next)
- [ ] PDF datasheet parsing
- [ ] Multi-model orchestration
- [ ] Component library
- [ ] Validation & error checking

### v1.0 (Future)
- [ ] Auto-routing support
- [ ] Design rule checking
- [ ] Cost optimization
- [ ] 3D preview
- [ ] Web interface

## 📚 Documentation

- **AI-EASYEDA-COMPILER-ARCHITECTURE.md** - System architecture
- **IMPLEMENTATION-COMPLETE.md** - Implementation guide
- **examples-md/** - Reference designs

## 💰 Cost

- **System**: Free (open source)
- **AI Models**: Free (local Ollama)
- **PCB Fabrication**: $2-10 per board (JLCPCB)

## 🤝 Contributing

This is a production system for serious PCB design. Contributions welcome!

## 📄 License

MIT

---

**Built for professional electronics engineers who want AI superpowers.** 🚀
