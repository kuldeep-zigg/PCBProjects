# Setup Instructions for Multi-Model AI PCB Design System

## 🎯 What You're Setting Up

A complete AI-powered PCB design system using three specialized models:
- **DeepSeek-R1 7B** - Deep reasoning and analysis
- **Llama 3.1 8B** - Design collaboration  
- **Phi-4 14B** - Precise component calculations

## ⚡ Quick Setup (5-30 minutes)

### Step 1: Install Ollama

**Option A: Automatic (Recommended)**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Option B: Download**
Visit https://ollama.ai and download for your OS:
- macOS: Download .dmg installer
- Linux: Use package manager
- Windows: Download .exe installer

### Step 2: Start Ollama

```bash
# Start the Ollama server
ollama serve
```

Keep this terminal open. Ollama must be running for the AI to work.

### Step 3: Install AI Models (Automatic)

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Run the setup script
./setup-models.sh
```

The script will:
1. Check Ollama installation ✓
2. Verify Ollama is running ✓
3. Download DeepSeek-R1 7B (~4.1GB)
4. Download Llama 3.1 8B (~4.7GB)
5. Download Phi-4 14B (~8.3GB)
6. Verify all installations ✓

**Total time:** 10-30 minutes (depending on internet speed)
**Total download:** ~17GB

### Step 4: Verify Installation

```bash
# Check all models are installed
npm run multi-check
```

**Expected output:**
```
✅ DeepSeek-R1 7B: Available
✅ Llama 3.1 8B: Available
✅ Phi-4 14B: Available
```

## 🔧 Manual Setup (Alternative)

If the automatic script doesn't work:

```bash
# Start Ollama (in separate terminal)
ollama serve

# Install models one by one (in another terminal)
ollama pull deepseek-r1:7b
ollama pull llama3.1:8b
ollama pull phi4:14b

# Verify
ollama list
```

## ✅ Quick Test

Test each model:

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Test deep reasoning
npm run multi-analyze

# Test design collaboration
npm run multi-collaborate -- "board with ESP32"

# Test calculations
npm run multi-calculate -- "LED 100mA from 5V"

# Test complete workflow
npm run multi-workflow -- "IR control board"
```

## 📋 System Requirements

### Minimum
- **RAM:** 16GB
- **Storage:** 20GB free space
- **CPU:** Modern multi-core (Intel i5/Ryzen 5 or better)
- **Internet:** For model downloads

### Recommended
- **RAM:** 32GB (for running all models smoothly)
- **Storage:** 50GB free space (for multiple models and training data)
- **CPU:** High-performance (Intel i7/Ryzen 7 or better)
- **GPU:** Optional (NVIDIA CUDA for 5-10x speed)

### Will It Run On My Computer?

**8GB RAM:**
- ❌ Cannot run all 3 models simultaneously
- ✅ Can run 1 model at a time
- Solution: Use single-model commands

**16GB RAM:**
- ✅ Can run all models
- May be a bit slow
- Close other applications

**32GB+ RAM:**
- ✅✅ Perfect
- Fast and smooth

## 🐛 Troubleshooting

### Problem: "Ollama not found"

**Solution:**
```bash
# Check if Ollama is installed
which ollama

# If not, install:
curl -fsSL https://ollama.ai/install.sh | sh

# Or visit https://ollama.ai
```

### Problem: "Cannot connect to Ollama"

**Solution:**
```bash
# Ollama server not running. Start it:
ollama serve

# In another terminal, try again:
npm run multi-check
```

### Problem: "Model pull fails"

**Solutions:**
1. Check internet connection
2. Free up disk space (need 20GB+)
3. Try again (may be temporary network issue)
4. Try smaller model first:
   ```bash
   ollama pull llama3.1:8b  # Try this first
   ```

### Problem: "Out of memory" errors

**Solutions:**
1. Close other applications
2. Use one model at a time
3. Use smaller variants:
   ```bash
   # Instead of phi4:14b, try:
   ollama pull phi3:3.8b
   ```

### Problem: Very slow responses

**Check:**
1. CPU usage (should be high when processing)
2. RAM usage (should have 5-10GB free)
3. Other applications running

**Solutions:**
1. Close browser tabs
2. Close other programs
3. Use smaller models for quick iterations
4. Consider GPU acceleration if you have NVIDIA GPU

## 🎓 After Setup

### 1. Read the Documentation

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Quick reference
cat QUICK-REFERENCE.md

# Complete guide
cat MULTI-MODEL-GUIDE.md

# Training guide (advanced)
cat TRAINING-GUIDE.md
```

### 2. Try Example Workflows

```bash
# Example 1: Component suggestions
npm run multi-collaborate -- "temperature sensor board"

# Example 2: Calculate resistor
npm run multi-calculate -- "LED 100mA 2V from 5V"

# Example 3: Analyze design
# First parse your PCB
cd .. && node parser.js "my-board"
cd ai-training && npm run multi-analyze

# Example 4: Complete design workflow
npm run multi-workflow -- "ESP32 with OLED display"
```

### 3. Explore Datasheets

```bash
# List available datasheets
npm run datasheet-list

# Show component details
npm run datasheet-show -- TSOP4838

# Export library
npm run datasheet-export
```

## 💡 Usage Tips

### Tip 1: Keep Ollama Running

```bash
# Start in separate terminal and leave it running
ollama serve

# Or run in background (macOS/Linux)
ollama serve > /dev/null 2>&1 &
```

### Tip 2: Create Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# PCB AI shortcuts
alias pcb-ai='cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training'
alias pcb-start='ollama serve > /dev/null 2>&1 &'
alias pcb-check='npm run multi-check'
alias pcb-workflow='npm run multi-workflow --'
```

Then:
```bash
pcb-start    # Start Ollama
pcb-ai       # Go to AI directory
pcb-check    # Verify models
pcb-workflow "your idea"  # Design!
```

### Tip 3: Monitor Resources

```bash
# macOS
top

# Linux
htop

# Watch for high CPU/RAM usage during AI processing
```

## 📊 What to Expect

### Download Sizes
- DeepSeek-R1 7B: 4.1GB
- Llama 3.1 8B: 4.7GB
- Phi-4 14B: 8.3GB
- **Total: ~17GB**

### Response Times (16GB RAM, no GPU)
- Quick query: 2-5 seconds
- Component calculation: 5-15 seconds
- Deep analysis: 10-30 seconds
- Complete workflow: 30-60 seconds

### Disk Usage
- Models: ~17GB
- Training data: ~1MB
- Design memory: ~1-10MB per project
- **Total: ~17-20GB**

## 🚀 Ready to Go!

If you see all green checkmarks:

```
✅ DeepSeek-R1 7B: Available
✅ Llama 3.1 8B: Available
✅ Phi-4 14B: Available
```

**You're ready to design PCBs with AI!** 🎉

Start with:
```bash
npm run multi-workflow -- "your PCB idea here"
```

## 📞 Need Help?

1. **Check documentation:**
   - `QUICK-REFERENCE.md` - Command reference
   - `MULTI-MODEL-GUIDE.md` - Detailed guide
   - `TRAINING-GUIDE.md` - Advanced features

2. **Verify setup:**
   ```bash
   npm run multi-check
   ollama list
   ```

3. **Test connection:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. **Check logs:**
   ```bash
   # Ollama logs
   journalctl -u ollama  # Linux
   ~/Library/Logs/Ollama # macOS
   ```

## 🔄 Updating Models

To update to newer model versions:

```bash
# Update specific model
ollama pull deepseek-r1:7b

# Or update all
ollama pull deepseek-r1:7b
ollama pull llama3.1:8b
ollama pull phi4:14b
```

## 🗑️ Uninstall

To remove models and free space:

```bash
# Remove specific model
ollama rm deepseek-r1:7b

# List all models
ollama list

# Remove all
ollama rm deepseek-r1:7b llama3.1:8b phi4:14b
```

---

**Happy PCB Designing! 🚀**
