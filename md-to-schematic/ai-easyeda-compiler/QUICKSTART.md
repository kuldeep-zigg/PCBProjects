# ⚡ Quick Start - AI EasyEDA Compiler

## 🎉 System Ready!

Your AI EasyEDA Compiler is **fully set up** and ready to use!

---

## 🚀 Test It NOW (30 seconds)

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler

# Run the compiler
node compiler-mvp.js
```

**What happens:**
1. Loads your requirements (`requirements/example-esp32-led.md`)
2. Loads design rules (`rules-md/`)
3. Loads reference examples (`examples-md/`)
4. Calls Llama 3.1 AI model (~30-60 seconds)
5. Generates EasyEDA JSON schematic
6. Generates LCSC BOM
7. Saves to `output/` folder

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║        AI EasyEDA Compiler - MVP Version                  ║
╚════════════════════════════════════════════════════════════╝

📚 Loading knowledge base...
   Loaded 1 rule files
   Loaded 1 example files
   Loaded 1 requirement files

🤖 Generating schematic with AI...
   Using Llama 3.1 for design generation
   Calling AI model (this may take 30-60 seconds)...
   AI response received, parsing JSON...

🔧 Converting to EasyEDA JSON format...
📋 Generating BOM...
💾 Saving outputs...
   ✓ Schematic: ./output/schematic.json
   ✓ BOM: ./output/bom.md
   ✓ Report: ./output/design-report.md

╔════════════════════════════════════════════════════════════╗
║                  ✅ COMPILATION COMPLETE                   ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📂 Check Your Outputs

```bash
# View generated schematic
cat output/schematic.json | head -50

# View BOM
cat output/bom.md

# View design report
cat output/design-report.md
```

---

## 🎯 Import into EasyEDA

1. Open **EasyEDA Pro**
2. **File** → **Import** → **EasyEDA JSON**
3. Select: `output/schematic.json`
4. ✅ Your AI-generated schematic appears!
5. Generate PCB layout
6. Order from JLCPCB

---

## ✏️ Design Your Own Board

### Step 1: Create Requirements

```bash
cat > requirements/my-sensor-board.md << 'EOF'
# WiFi Temperature Monitor

Design a board with:
- ESP32-WROOM-32 for WiFi connectivity
- BME280 sensor for temperature/humidity (I2C)
- 0.96" OLED display (I2C)
- USB-C power input
- 3.3V power regulation
- Status LED

Use only LCSC components.
Prefer 0805 SMD passives.
Industrial temperature range.
EOF
```

### Step 2: Compile

```bash
node compiler-mvp.js
```

### Step 3: Review & Import

```bash
# Check the output
cat output/bom.md

# Import to EasyEDA
# Then generate PCB
```

---

## 🎓 Understanding the System

### Input Files

**requirements/** - What you want to build
```markdown
# My Project
Design a board with ESP32 and sensors...
```

**rules-md/** - Design standards
```markdown
# Component Rules
- Use 0805 SMD
- LCSC parts only
- Decoupling on all ICs
```

**examples-md/** - Reference designs
```markdown
# ESP32 Reference
Components:
- U1: ESP32-WROOM-32
- C1: 0.1µF decoupling
```

### Output Files

**output/schematic.json** - EasyEDA importable schematic
**output/bom.md** - LCSC-ready BOM
**output/design-report.md** - Summary and validation

---

## 🔧 Configuration

Edit `compiler-mvp.js` if needed:

```javascript
const CONFIG = {
  ollamaUrl: 'http://127.0.0.1:11434',
  models: {
    reasoning: 'deepseek-r1:7b',    // For analysis
    design: 'llama3.1:8b',           // For generation
    math: 'phi4:14b'                 // For calculations
  }
};
```

---

## 📊 System Status

```bash
# Check Ollama is running
curl http://127.0.0.1:11434/api/tags

# Check installed models
ollama list

# Should see:
# llama3.1:8b       ✅
# deepseek-r1:7b    ✅
# phi4:14b          ✅
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Ollama"

**Solution:**
```bash
# Start Ollama
ollama serve

# In another terminal, try again
node compiler-mvp.js
```

### Issue: "AI did not generate valid JSON"

**Reasons:**
- AI response was not JSON formatted
- Model output was cut off
- Prompt needs adjustment

**Solution:**
- Check `output/logs/ai-raw-response.json`
- Simplify requirements
- Try again (AI is non-deterministic)

### Issue: "No requirements found"

**Solution:**
```bash
# Create at least one requirements file
echo "Design ESP32 board" > requirements/test.md
```

---

## 🚀 Next Steps

### Today
- [x] System installed ✅
- [x] Dependencies ready ✅
- [x] Example files created ✅
- [ ] Run first compilation
- [ ] Import to EasyEDA
- [ ] Review output

### This Week
- [ ] Design your own board
- [ ] Add custom design rules
- [ ] Create reusable templates
- [ ] Order first PCB

### Advanced
- [ ] Add PDF datasheet parsing
- [ ] Multi-model orchestration
- [ ] Custom component library
- [ ] Auto-routing integration

---

## 💡 Pro Tips

1. **Start Simple**
   - Begin with basic requirements
   - Add complexity gradually
   - Iterate on designs

2. **Build Template Library**
   - Save successful designs to examples-md/
   - Reuse proven patterns
   - Document learnings

3. **Validate Output**
   - Always review AI-generated schematics
   - Check component values
   - Verify net connections
   - Run EasyEDA DRC

4. **Use LCSC Database**
   - Search components at lcsc.com
   - Prefer "Basic" parts (cheaper assembly)
   - Check stock availability

5. **Iterate with AI**
   - If output isn't perfect, refine requirements
   - Add more detail to rules-md/
   - Provide better examples

---

## 📚 Documentation

- **README.md** - Full system documentation
- **AI-EASYEDA-COMPILER-ARCHITECTURE.md** - System design
- **IMPLEMENTATION-COMPLETE.md** - Implementation guide

---

## 🎉 You're Ready!

**Run your first compilation:**
```bash
node compiler-mvp.js
```

**Then import to EasyEDA and start manufacturing!** 🚀

---

## 🆘 Need Help?

Check the full documentation or review example files:
- `requirements/example-esp32-led.md`
- `rules-md/component-selection-rules.md`
- `examples-md/esp32-minimal-reference.md`

**The AI learns from these examples!**
