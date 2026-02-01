# Quick Reference Card

## 🚀 Essential Commands

### Setup (One Time)

```bash
# Install AI models
ollama pull deepseek-r1:7b    # Reasoning
ollama pull llama3.1:8b        # Design partner
ollama pull phi4:14b           # Calculations

# Verify installation
npm run multi-check
```

### Daily Workflow

```bash
# 1. Parse your PCB design
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic
node parser.js "my-board-name"

# 2. Run complete AI analysis
cd ai-training
node multi-model-orchestrator.js workflow "requirements"

# 3. Get specific help
npm run multi-calculate -- "LED 100mA from 5V"
npm run multi-collaborate -- "add WiFi"
npm run multi-analyze
```

## 🤖 Model Selection Guide

| Need | Use | Command |
|------|-----|---------|
| 🧠 **Deep analysis** | DeepSeek-R1 | `npm run multi-analyze` |
| 🤝 **Design ideas** | Llama 3.1 | `npm run multi-collaborate -- "req"` |
| 🔢 **Exact values** | Phi-4 | `npm run multi-calculate -- "spec"` |
| 🚀 **Complete design** | All models | `npm run multi-workflow -- "req"` |

## 📄 Datasheet Commands

```bash
# List available datasheets
npm run datasheet-list

# Show component datasheet
npm run datasheet-show -- TSOP4838

# Export library
npm run datasheet-export
```

## 💡 Common Tasks

### Calculate LED Resistor

```bash
npm run multi-calculate -- "LED: 100mA, 2V forward voltage, 5V supply"
```

### Get Component Suggestions

```bash
npm run multi-collaborate -- "microcontroller for 20 GPIO pins"
```

### Analyze Current Design

```bash
npm run multi-analyze
```

### Complete New Design

```bash
npm run multi-workflow -- "ESP32 with temperature sensor and display"
```

## 🔧 Troubleshooting

### Check Model Status

```bash
npm run multi-check
```

### If model missing:

```bash
ollama pull <model-name>
```

### Connection error:

```bash
ollama serve
```

## 📚 File Locations

```
ai-training/
├── multi-model-orchestrator.js  ← Main system
├── datasheet-reader.js           ← Component specs
├── design-memory/                ← Saved iterations
│   └── workflow-results_*.json
└── ai-training-data/             ← Training datasets
    └── training-data_*.json
```

## 🎯 Quick Examples

### Example 1: New Project

```bash
# Get AI suggestions
npm run multi-collaborate -- "board with 5 sensors"

# Create markdown spec (based on suggestions)
vim ../NewProject.md

# Parse and analyze
cd .. && node parser.js "project-v1"
cd ai-training && npm run multi-analyze
```

### Example 2: Fix Issues

```bash
# Analyze finds issues
npm run multi-analyze

# Calculate missing components
npm run multi-calculate -- "missing resistor calculation"

# Update design
vim ../PCB1.md

# Re-parse and verify
cd .. && node parser.js "fixed-v2"
cd ai-training && npm run multi-analyze
```

### Example 3: Component Research

```bash
# Check datasheet
npm run datasheet-show -- RaspberryPiPico

# Get design requirements
node datasheet-reader.js requirements RaspberryPiPico

# Ask AI about it
npm run multi-chat -- "How to use Raspberry Pi Pico GPIO?"
```

## ⚡ Performance

| Model | Speed | RAM | Best For |
|-------|-------|-----|----------|
| Llama 3.1 | Fast | 6GB | Quick suggestions |
| DeepSeek-R1 | Medium | 5GB | Deep analysis |
| Phi-4 | Slower | 10GB | Precise math |

**Full workflow: ~15-30 seconds**

## 📊 Keyboard Shortcuts (Aliases)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# PCB AI Shortcuts
alias pcb-ai='cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training'
alias pcb-parse='cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic && node parser.js'
alias pcb-workflow='npm run multi-workflow --'
alias pcb-calc='npm run multi-calculate --'
alias pcb-help='npm run multi-collaborate --'
alias pcb-check='npm run multi-analyze'
```

Usage:
```bash
pcb-ai                          # Go to AI directory
pcb-parse "my-board"            # Parse PCB
pcb-workflow "requirements"     # Complete workflow
pcb-calc "LED 100mA"            # Calculate
pcb-help "add WiFi"             # Get suggestions
pcb-check                       # Analyze design
```

## 🎓 Learning Path

**Week 1:**
- Install models
- Try `multi-check`
- Run `multi-workflow` on example
- Review datasheet library

**Week 2:**
- Parse your own design
- Use `multi-analyze`
- Calculate component values
- Iterate on design

**Week 3:**
- Use `multi-collaborate` for new project
- Build design memory
- Use datasheets with AI
- Create component library

**Week 4:**
- Master complete workflow
- Optimize your process
- Share knowledge
- Design complex boards

## 🌟 Pro Tips

1. **Always check models first**
   ```bash
   npm run multi-check
   ```

2. **Use complete workflow for new designs**
   ```bash
   npm run multi-workflow -- "your idea"
   ```

3. **Ask specific questions for best results**
   - Good: "Calculate 100mA LED resistor from 5V"
   - Bad: "LED resistor"

4. **Iterate multiple times**
   - v1 → AI feedback → v2 → AI feedback → v3 ✓

5. **Verify critical calculations**
   - AI is accurate but always double-check
   - Use datasheets
   - Check with online calculators

6. **Build your design library**
   - More designs → Better suggestions
   - Save datasheets → Faster lookups
   - Track iterations → Learn patterns

## 📞 Getting Help

**Documentation:**
- `MULTI-MODEL-GUIDE.md` - Complete guide
- `TRAINING-GUIDE.md` - Model training
- `README.md` - System overview

**Quick help:**
```bash
node multi-model-orchestrator.js
node datasheet-reader.js
```

**Check everything is working:**
```bash
npm run multi-check            # Models installed?
npm run datasheet-list         # Datasheets available?
npm run generate-training      # Training data ready?
```

---

**Print this reference and keep it handy!** 📌
