# 🎯 START HERE - AI + EasyEDA Integration

**Welcome to the AI EasyEDA Compiler System v2.0!**

This guide will get you from zero to working PCB design in **5 minutes**.

---

## ✅ Prerequisites Check

Before starting, verify you have:

```bash
# 1. Node.js installed
node --version
# Should show: v18.0.0 or higher

# 2. Ollama running
ollama list
# Should show: llama3.1:8b (or similar)

# 3. EasyEDA Pro installed
# Download from: https://easyeda.com/
```

If any are missing, install them first!

---

## 🚀 5-Minute Quick Start

### Step 1: Test the AI Compiler (30 seconds)

```bash
cd ai-easyeda-compiler

# Run compiler with example requirements
npm run compile

# Or:
node compiler-mvp.js
```

**You should see:**
```
╔════════════════════════════════════════════════════════════╗
║        AI EasyEDA Compiler - MVP Version                  ║
╚════════════════════════════════════════════════════════════╝

📚 Loading knowledge base...
   Loaded 1 rule files
   Loaded 1 example files
   Loaded 1 requirement files

🤖 Generating schematic with AI...
...
✅ COMPILATION COMPLETE
```

**Check output:**
```bash
ls -la output/
# You should see:
# - schematic.json  ← This imports to EasyEDA!
# - bom.md
# - design-report.md
```

---

### Step 2: Install EasyEDA Extension (2 minutes)

1. **Open EasyEDA Pro**

2. **Go to Extensions:**
   - Click: **Extensions** (top menu)
   - Click: **Manage Extensions**

3. **Load Extension:**
   - Click: **"+ Load Local Extension"** button
   - Navigate to: `ai-easyeda-compiler/easyeda-extension/`
   - Click: **"Select Folder"**
   - Extension installs automatically

4. **Verify Installation:**
   - Check **Tools** menu
   - Should see: **"Import AI Schematic"**
   - ✅ Extension ready!

---

### Step 3: Import Your First Schematic (1 minute)

**In EasyEDA Pro:**

1. Click: **Tools** → **Import AI Schematic**

2. Browse to: `ai-easyeda-compiler/output/schematic.json`

3. Click: **Open**

4. Watch as your schematic appears! 🎉

**You should see:**
- Raspberry Pi Pico component
- IR receivers arranged in grid
- Diodes for OR network
- Resistors and capacitors
- Power symbols (VCC, GND)
- Net connections

---

### Step 4: Review & Verify (1 minute)

**Check these:**
- [ ] All components placed
- [ ] Nets connected (green/red lines)
- [ ] Power symbols present
- [ ] Labels readable

**If everything looks good:**
- ✅ **Success!** You just used AI to generate a PCB schematic!

---

## 🎓 Next Steps (Choose Your Path)

### Path 1: Design Your Own Board

```bash
# 1. Create requirements
cat > requirements/my-board.md << 'EOF'
# My First Board

Design a simple board with:
- ESP32-WROOM-32
- LED on GPIO2
- USB-C power
- 3.3V regulation
EOF

# 2. Generate
npm run compile

# 3. Import to EasyEDA
# Tools → Import AI Schematic → Select output/schematic.json
```

---

### Path 2: Learn the System

**Read in order:**

1. **QUICKSTART.md** (3 minutes)
   - System overview
   - Basic usage

2. **QUICK-INTEGRATION-REFERENCE.md** (5 minutes)
   - Common commands
   - Quick fixes
   - Workflow patterns

3. **EASYEDA-INTEGRATION-GUIDE.md** (30 minutes)
   - Complete tutorial
   - Advanced features
   - Troubleshooting

---

### Path 3: Order PCBs

**Already have a design? Order it!**

1. **In EasyEDA:**
   - Design → Convert Schematic to PCB
   - Layout PCB (or auto-route)
   - Run DRC (Design Rule Check)
   - File → Export → Gerber

2. **On JLCPCB:**
   - Go to: https://jlcpcb.com/
   - Upload gerbers
   - Select options
   - Order (10 PCBs = ~$5)

3. **Wait 10-14 days**
   - PCBs arrive
   - Assemble & test
   - Iterate if needed

---

## 🔧 Common Commands

### AI Compilation

```bash
# Generate schematic
npm run compile

# With integration check
npm run integrate

# Full pipeline
npm run quick-start

# Check system status
npm run check
```

### In EasyEDA Pro

| Command | Location | Purpose |
|---------|----------|---------|
| **Import AI Schematic** | Tools menu | Import compiler output |
| **Update Current Schematic** | Tools menu | Replace with new version |
| **Generate BOM** | Context menu | Extract BOM |
| **Validate Design** | Context menu | Check rules |

---

## 📂 Project Structure

```
ai-easyeda-compiler/
│
├── 📝 Your Work
│   └── requirements/
│       └── my-board.md       ← Write your specs here
│
├── 🤖 AI Compiler
│   ├── compiler-mvp.js       ← Main compiler
│   └── integrate.js          ← Integration automation
│
├── 🔌 EasyEDA Extension
│   └── easyeda-extension/
│       ├── manifest.json
│       └── main.js
│
├── 📤 Output (Generated)
│   └── output/
│       ├── schematic.json    ← Import this to EasyEDA
│       ├── bom.md
│       └── design-report.md
│
└── 📚 Documentation
    ├── START-HERE-INTEGRATION.md  ← You are here
    ├── QUICKSTART.md
    ├── EASYEDA-INTEGRATION-GUIDE.md
    └── QUICK-INTEGRATION-REFERENCE.md
```

---

## 🐛 Troubleshooting

### "Ollama not found"

```bash
# Start Ollama
ollama serve

# In another terminal, verify
curl http://127.0.0.1:11434/api/tags

# Try again
npm run compile
```

---

### "Extension not appearing"

1. Restart EasyEDA Pro
2. Check: Extensions → Manage Extensions
3. Verify extension folder has manifest.json + main.js
4. Try manual import: File → Import → EasyEDA JSON

---

### "No requirements found"

```bash
# Check requirements folder
ls requirements/

# Should have at least one .md file
# If empty, create one:
echo "Design ESP32 board" > requirements/test.md
```

---

### "AI generation failed"

**Check Ollama connection:**
```bash
ollama list
# Should show llama3.1:8b

# If not installed:
ollama pull llama3.1:8b
```

**Check requirements format:**
- File should be markdown (.md)
- Include project description
- List components needed
- Specify constraints

---

## 💡 Pro Tips

### 1. Write Good Requirements

**Good:**
```markdown
# WiFi Sensor Board

Design with:
- ESP32-WROOM-32 (WiFi module)
- BME280 sensor (I2C, address 0x76)
- 0.96" OLED display (I2C, address 0x3C)
- USB-C power input
- 3.3V LDO regulator (AMS1117-3.3)
- Status LED on GPIO2 with 1kΩ resistor
- Use LCSC components only
```

**Bad:**
```markdown
Make a sensor board with WiFi
```

---

### 2. Always Run Integration

```bash
# Instead of:
node compiler-mvp.js

# Do:
npm run quick-start

# This validates output and prepares for import
```

---

### 3. Keep Examples Handy

```bash
# View example requirements
cat requirements/example-esp32-led.md

# View example reference design
cat examples-md/esp32-minimal-reference.md

# Copy and modify for your project
cp requirements/example-esp32-led.md requirements/my-board.md
```

---

### 4. Check Output Before Importing

```bash
# Validate schematic JSON
cat output/schematic.json | head -50

# Check component count
grep -c '"designator"' output/schematic.json

# View BOM
cat output/bom.md
```

---

### 5. Use Verbose Mode When Debugging

```bash
# See detailed logs
npm run integrate:verbose

# Or:
node integrate.js --verbose
```

---

## 🎯 What You've Learned

After this quick start, you can:

✅ Generate schematics from text requirements  
✅ Import AI-generated designs into EasyEDA  
✅ Use the extension for automated workflows  
✅ Troubleshoot common issues  
✅ Design your own PCBs with AI assistance

---

## 📚 Learn More

**Quick References:**
- **QUICK-INTEGRATION-REFERENCE.md** - One-page cheat sheet
- **INTEGRATION-COMPLETE.md** - Full feature list

**Complete Guides:**
- **EASYEDA-INTEGRATION-GUIDE.md** - 50+ page tutorial
- **AI-EASYEDA-COMPILER-ARCHITECTURE.md** - System design

**Specifications:**
- **industrial_rules.md** - Design standards
- **ir_light_curtain_reference.md** - Complete example
- **learning_index.md** - Component datasheets

---

## 🎉 Ready to Build!

You now have a complete AI-powered PCB design system that can:

✨ Convert ideas → Schematics in 60 seconds  
✨ Import seamlessly into EasyEDA Pro  
✨ Generate production-ready BOMs  
✨ Export for manufacturing  
✨ Scale from prototype to production

**Your next PCB is just one command away!**

```bash
npm run quick-start
```

---

## 🆘 Need Help?

**Quick Help:**
- Check: QUICK-INTEGRATION-REFERENCE.md
- Read: Troubleshooting section above
- Review: Example files

**Detailed Help:**
- Read: EASYEDA-INTEGRATION-GUIDE.md
- Study: Example designs in examples-md/

**Still Stuck?**
- Check Ollama logs: `ollama logs`
- Check compiler logs: `cat output/logs/*.log`
- Validate JSON: `npm run integrate:verbose`

---

**Version:** 2.0  
**Date:** 2026-02-01  
**Status:** Production Ready ✅

**Now go build something amazing! 🚀**
