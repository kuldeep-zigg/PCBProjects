# ⚡ Quick Integration Reference

**One-page guide for AI Compiler + EasyEDA workflow**

---

## 🚀 3-Step Workflow

```bash
# 1. Generate schematic
node compiler-mvp.js

# 2. Integrate (optional but recommended)
node integrate.js

# 3. Import to EasyEDA Pro
# Tools → Import AI Schematic → Select output/schematic.json
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `compiler-mvp.js` | AI schematic generator |
| `integrate.js` | Integration automation |
| `output/schematic.json` | **← Import this to EasyEDA** |
| `output/bom.md` | LCSC-ready BOM |
| `easyeda-extension/` | EasyEDA Pro extension |

---

## 🔧 Extension Commands

**In EasyEDA Pro:**

| Command | What It Does |
|---------|--------------|
| Tools → **Import AI Schematic** | Import compiler output |
| Tools → **Import from Compiler Output** | Auto-load latest |
| Tools → **Update Current Schematic** | Replace with new version |
| Context → **Generate BOM** | Extract BOM from schematic |
| Context → **Validate Design** | Check design rules |

---

## 🎯 Common Tasks

### Create New Project

```bash
# 1. Write requirements
cat > requirements/my-board.md << EOF
# My Board
Design ESP32 board with sensors
EOF

# 2. Generate
node compiler-mvp.js

# 3. Import to EasyEDA
# Tools → Import AI Schematic
```

### Update Existing Design

```bash
# 1. Modify requirements
nano requirements/my-board.md

# 2. Regenerate
node compiler-mvp.js

# 3. Update in EasyEDA
# Extension → Update Current Schematic
```

### Generate BOM Only

```bash
# View generated BOM
cat output/bom.md

# Or extract from EasyEDA
# Context Menu → Generate BOM
```

---

## 🐛 Quick Fixes

**Ollama not connected:**
```bash
ollama serve
```

**Extension not appearing:**
- Restart EasyEDA Pro
- Check: Extensions → Manage Extensions

**Import fails:**
```bash
# Validate output
node integrate.js --verbose
```

**Component not found:**
- Use manual import (File → Import → EasyEDA JSON)
- Replace with similar component from library

---

## 📊 File Paths

```
Where things are:

Input:  requirements/[your-file].md
Output: output/schematic.json ← Import this
        output/bom.md
        output/design-report.md

Extension: easyeda-extension/
           ├── manifest.json
           └── main.js
```

---

## ⚙️ Configuration

**Change AI models** (compiler-mvp.js):
```javascript
models: {
  design: 'llama3.1:8b',  // Main generation
  reasoning: 'deepseek-r1:7b',
  math: 'phi4:14b'
}
```

**Change output path** (compiler-mvp.js):
```javascript
paths: {
  output: './output'
}
```

---

## 🎓 Workflow Patterns

### Pattern 1: Quick Prototype
```bash
node compiler-mvp.js && node integrate.js
# Import → Review → Order PCB
```

### Pattern 2: Iterative Design
```bash
# v1
node compiler-mvp.js
# Import → Review → Note issues

# v2
# Update requirements
node compiler-mvp.js
# Update Schematic → Compare → Refine
```

### Pattern 3: Production
```bash
# Generate design
node compiler-mvp.js

# Validate
node integrate.js --verbose

# Review in EasyEDA
# Import → DRC → Export Gerbers

# Order
# Upload to JLCPCB → Configure → Order
```

---

## 📋 Pre-Order Checklist

- [ ] DRC passed (no errors)
- [ ] All components have LCSC part numbers
- [ ] Power traces ≥20 mil
- [ ] Signal traces ≥10 mil
- [ ] Ground plane on bottom layer
- [ ] Mounting holes added
- [ ] Silkscreen clear and readable
- [ ] Gerbers generated
- [ ] BOM exported

---

## 💡 Pro Tips

1. **Always run integrate.js** - catches errors early
2. **Keep requirements detailed** - better AI output
3. **Use LCSC Basic parts** - lower assembly cost
4. **Order qty 10** - best price/value ratio
5. **Test with breadboard first** - validate circuit

---

## 🔗 Quick Links

- **Full Guide:** EASYEDA-INTEGRATION-GUIDE.md
- **System Docs:** README.md
- **Quick Start:** QUICKSTART.md
- **EasyEDA Pro:** https://easyeda.com/
- **JLCPCB:** https://jlcpcb.com/
- **LCSC Parts:** https://www.lcsc.com/

---

## 🆘 Need Help?

```bash
# Verbose output for debugging
node integrate.js --verbose

# Check compiler logs
cat output/logs/*.log

# Validate schematic JSON
cat output/schematic.json | head -50
```

**Still stuck?**
- Read: EASYEDA-INTEGRATION-GUIDE.md
- Check: Troubleshooting section
- Review: Example files in examples-md/

---

**Last Updated:** 2026-02-01  
**Version:** 2.0
