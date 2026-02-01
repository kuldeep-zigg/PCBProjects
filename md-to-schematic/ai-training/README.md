# AI Training System for PCB Design

Train your local AI model to become a PCB design expert! This system generates training data from your PCB specifications and provides AI-powered design assistance.

## 🎯 What This Does

1. **Extracts electronics knowledge** from your PCB designs
2. **Generates training datasets** with component info, calculations, best practices
3. **Integrates with local AI models** (Ollama, LM Studio, etc.)
4. **Provides AI design assistance** for new projects
5. **Validates designs** and suggests improvements
6. **Generates EasyEDA instructions** automatically

## 🚀 Quick Start

### Step 1: Generate Training Data

```bash
cd ai-training
npm install
node training-data-generator.js
```

This creates:
- `training-data_*.json` - Complete dataset with electronics knowledge
- `alpaca-format_*.json` - For LLaMA/Alpaca fine-tuning
- `chatml-format_*.json` - For GPT-style models

### Step 2: Use with Local AI (Ollama)

```bash
# Install Ollama
# Visit: https://ollama.ai

# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.1:8b

# Test the AI integration
node ollama-integration.js
```

### Step 3: Get AI Design Help

```bash
# Analyze your current design
npm run ollama-analyze

# Get component suggestions
node ollama-integration.js suggest "board with 10 sensors and WiFi"

# Calculate components
node ollama-integration.js calculate "LED 100mA from 5V"

# Ask questions
node ollama-integration.js chat "What is a decoupling capacitor?"
```

## 📊 Training Data Structure

The generated training data includes:

### Electronics Knowledge Base
```json
{
  "components": {
    "Raspberry Pi Pico": {
      "voltage": "3.3V logic",
      "bestPractices": ["Add decoupling caps", "..."],
      "knowledge": "GPIO pins are 3.3V..."
    },
    "TSOP4838": { ... },
    "74HC595": { ... }
  },
  "designRules": {
    "power": ["Common ground", "Bulk caps", ...],
    "signals": ["Short traces", "45° bends", ...],
    "thermal": ["Calculate power", "Add vias", ...]
  },
  "calculations": {
    "ledCurrentLimiting": "R = (Vsupply - Vled) / I",
    "powerDissipation": "P = I² × R",
    ...
  }
}
```

### Training Examples
```json
{
  "instruction": "Design a PCB for: IR Control System",
  "input": {
    "requirements": ["10 IR receivers", "10 IR LEDs", ...]
  },
  "output": {
    "design_analysis": { ... },
    "step_by_step_approach": [ ... ],
    "calculations": { ... },
    "best_practices": { ... }
  }
}
```

## 🤖 Local AI Integration

### Ollama (Recommended for Beginners)

**Why Ollama?**
- Easiest to set up
- Runs on Mac, Windows, Linux
- Free and open source
- No GPU required (CPU works fine)

**Setup:**
```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Or download from https://ollama.ai

# 2. Pull a model
ollama pull llama3.1:8b    # 8B model (recommended)
# ollama pull llama3.1:70b  # 70B model (if you have GPU)

# 3. Test it
ollama run llama3.1:8b
>>> Hello!
```

**Use with PCB Design:**
```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Check if Ollama is running
node ollama-integration.js

# Analyze your PCB
node ollama-integration.js analyze

# Interactive design help
node ai-design-assistant.js "I need a board with ESP32 and 5 sensors"
```

### LM Studio

**Why LM Studio?**
- Nice GUI interface
- Easy model management
- Good for experimentation

**Setup:**
1. Download from https://lmstudio.ai
2. Install and open LM Studio
3. Download a model (e.g., Mistral, LLaMA)
4. Start local server (Server tab → Start Server)
5. Use the chat interface or API

**Use with our system:**
```javascript
// Modify ollama-integration.js
const ollama = new OllamaIntegration('http://localhost:1234'); // LM Studio port
```

### Custom Fine-Tuning

**For Advanced Users:**

If you want to fine-tune a model specifically for PCB design:

```bash
# 1. Generate training data
node training-data-generator.js

# 2. Use the alpaca-format file for fine-tuning
# File: ai-training-data/alpaca-format_*.json

# 3. Fine-tune with your preferred framework:
#    - LLaMA-Factory
#    - Axolotl
#    - Unsloth
#    - Or use cloud services like Together.ai, RunPod
```

## 📖 Features Breakdown

### 1. Training Data Generator

**What it does:**
- Parses your PCB JSON files
- Extracts component information
- Adds electronics knowledge (Ohm's Law, calculations, best practices)
- Creates labeled training examples
- Generates multiple format outputs

**Knowledge included:**
- Component specifications (voltage, current, pinouts)
- Best practices for each component type
- Required passive components
- Design rules (power, signals, thermal, EMC)
- Electrical calculations with formulas
- Physics principles

### 2. AI Design Assistant

**What it does:**
- Analyzes user requirements
- Suggests appropriate components
- Validates designs
- Performs calculations
- Generates EasyEDA instructions

**Example usage:**
```javascript
import { AIDesignAssistant } from './ai-design-assistant.js';

const assistant = new AIDesignAssistant();

// Analyze requirements
const analysis = await assistant.analyzeRequirements(
  "I need 10 IR receivers and 10 IR LEDs with microcontroller"
);

// Validate existing design
const validation = await assistant.validateDesign(pcbData);

// Generate EasyEDA instructions
const instructions = await assistant.generateEasyEDAInstructions(pcbData);
```

### 3. Ollama Integration

**What it does:**
- Connects to local Ollama instance
- Sends PCB design questions to AI
- Provides context-aware responses
- Maintains conversation history

**Commands:**
```bash
# Analyze PCB design
node ollama-integration.js analyze

# Get component suggestions
node ollama-integration.js suggest "your requirements"

# Calculate components
node ollama-integration.js calculate "your spec"

# General chat
node ollama-integration.js chat "your question"
```

## 💡 Usage Examples

### Example 1: Analyze Current Design

```bash
# 1. Parse your PCB markdown
cd ..
node parser.js "my-design"

# 2. Generate training data
cd ai-training
node training-data-generator.js

# 3. Get AI analysis
node ollama-integration.js analyze
```

**Output:**
```
🤖 Analyzing PCB design with AI...

Design Analysis:
✅ Good: Proper component selection for IR control
⚠️ Warning: Missing decoupling capacitors
❌ Issue: No current-limiting resistors for LEDs

Recommendations:
1. Add 0.1µF capacitor near each IC (VCC to GND)
2. Calculate LED resistors: R = (5V - 1.35V) / 0.1A = 36.5Ω → Use 39Ω
3. Add 10kΩ pull-down on each MOSFET gate
4. Consider bulk 100µF capacitor at power input

Calculations:
- Total current: 1050mA
- Recommended supply: 1A or higher
- LED resistor power: 0.37W each (use 0.5W)
- Trace width: 30mil for power, 10mil for signals
```

### Example 2: Design New Board from Requirements

```bash
node ollama-integration.js suggest "board with ESP32, temperature sensor, OLED display"
```

**Output:**
```
🤖 Component Suggestions:

Microcontroller:
- ESP32-WROOM-32
  Reason: Built-in WiFi/BT, sufficient GPIOs for all peripherals
  Voltage: 3.3V
  Current: ~240mA (WiFi active)

Sensors:
- DS18B20 (Temperature)
  Interface: One-Wire
  Accuracy: ±0.5°C
  Requires: 4.7kΩ pull-up resistor

Display:
- SSD1306 OLED 128x64
  Interface: I2C
  Voltage: 3.3V
  Pins: SDA, SCL

Passive Components:
- 0.1µF ceramic caps (qty: 3) - Decoupling for IC, sensor, display
- 10µF electrolytic (qty: 1) - Bulk filtering
- 4.7kΩ resistor (qty: 1) - DS18B20 pull-up
- 10kΩ resistors (qty: 2) - I2C pull-ups

Power:
- Input: 5V USB or barrel jack
- Regulator: AMS1117-3.3V (if using 5V input)
- Protection: Schottky diode for reverse polarity

Connectors:
- USB-C for programming and power
- JST connector for external battery option
```

### Example 3: Calculate Component Values

```bash
node ollama-integration.js calculate "IR LED TSAL6400 at 100mA from 5V supply"
```

**Output:**
```
🤖 Component Calculations:

Given:
- Supply voltage (Vsupply): 5V
- LED forward voltage (Vf): 1.35V (typical for TSAL6400)
- Desired current (I): 100mA = 0.1A

Step 1: Calculate resistor value
Formula: R = (Vsupply - Vf) / I
R = (5V - 1.35V) / 0.1A
R = 3.65V / 0.1A
R = 36.5Ω

Standard Value: Use 39Ω (nearest E12 series value)

Step 2: Verify actual current
I_actual = (5V - 1.35V) / 39Ω = 93.6mA ✓ (close enough)

Step 3: Calculate power dissipation
Formula: P = I² × R
P = (0.1A)² × 39Ω
P = 0.01 × 39
P = 0.39W

Resistor Rating: Use 0.5W or 1W resistor (0.39W > 0.25W)

Recommendation:
- Component: 39Ω 0.5W resistor
- Type: Carbon film or metal film
- Tolerance: 5% is fine
- Package: Through-hole or 1206 SMD

Safety Check:
- Power margin: 0.5W / 0.39W = 1.28× ✓ (good)
- Heat dissipation: Will get warm, ensure ventilation
- PCB trace: Use 20mil minimum for 100mA current
```

### Example 4: Ask Electronics Questions

```bash
node ollama-integration.js chat "Why do I need decoupling capacitors?"
```

**Output:**
```
🤖 Answer:

Decoupling capacitors (also called bypass capacitors) are essential for:

1. Filtering High-Frequency Noise
   - ICs switching rapidly create current spikes
   - These spikes cause voltage fluctuations on power rails
   - Decoupling caps absorb these spikes locally

2. Providing Local Energy Storage
   - When IC needs sudden current burst
   - Capacitor supplies it instantly
   - Prevents voltage droop that could cause malfunction

3. Physics Explanation
   - Power supply has inductance in traces/wires
   - V = L × dI/dt (voltage drop from inductance)
   - Fast current changes (high dI/dt) cause big voltage drops
   - Capacitor acts as local "battery" to smooth this

Best Practices:
- Value: 0.1µF (100nF) ceramic for each IC
- Placement: Within 10mm (0.4") of IC power pin
- Type: Ceramic (X7R or X5R), NOT electrolytic
- Additional: 10-100µF bulk cap at power input

Example for Your Board:
- Raspberry Pi Pico: 0.1µF near each VCC pin
- 74HC595: 0.1µF between pin 16 (VCC) and pin 8 (GND)
- TSOP4838: 0.1µF close to VCC pin

Why it Matters:
Without decoupling → Random glitches, unreliable operation
With decoupling → Stable, predictable behavior
```

## 🎓 Electronics Knowledge Included

The training data teaches your AI about:

### 1. Component Knowledge
- Microcontrollers (Pico, ESP32, ATmega)
- Sensors (IR receivers, temperature, etc.)
- Interface ICs (shift registers, multiplexers)
- Power components (MOSFETs, regulators)
- Passive components (resistors, capacitors)

### 2. Design Rules
- **Power:** Bulk caps, star topology, protection
- **Signals:** Trace width, routing, termination
- **Thermal:** Heat dissipation, vias, cooling
- **EMC:** Ground planes, shielding, filtering

### 3. Calculations
- Ohm's Law (V = I × R)
- Power dissipation (P = I² × R)
- LED current limiting
- Capacitor sizing
- Trace width for current

### 4. Best Practices
- Decoupling capacitor placement
- MOSFET gate resistors and pull-downs
- Ground plane usage
- Component spacing
- Test points and debugging

### 5. Physics Principles
- Electromagnetic induction
- Capacitor charge/discharge
- Signal integrity
- Transmission line effects

## 🔧 Advanced Usage

### Custom Knowledge Base

Add your own electronics knowledge:

```javascript
// Edit training-data-generator.js

buildElectronicsKnowledge() {
  return {
    components: {
      'YourCustomComponent': {
        voltage: { ... },
        bestPractices: [ ... ],
        knowledge: 'Your explanation'
      }
    },
    // Add more...
  };
}
```

### Integration with Your Workflow

```javascript
// Your custom script
import { PCBTrainingDataGenerator } from './training-data-generator.js';
import { OllamaIntegration } from './ollama-integration.js';

const generator = new PCBTrainingDataGenerator();
const ollama = new OllamaIntegration();

// Parse your PCB
const pcbData = JSON.parse(fs.readFileSync('your-design.json'));

// Generate analysis
const analysis = generator.analyzePCBDesign(pcbData);

// Get AI feedback
const feedback = await ollama.analyzePCBDesign(pcbData);

console.log('Analysis:', analysis);
console.log('AI Feedback:', feedback);
```

### Export to EasyEDA

```javascript
import { AIDesignAssistant } from './ai-design-assistant.js';

const assistant = new AIDesignAssistant();

// Get EasyEDA instructions
const instructions = await assistant.generateEasyEDAInstructions(pcbData, analysis);

// Use instructions to create schematic
console.log('Component Library:', instructions.schematic_creation.component_library);
console.log('Placement Guide:', instructions.pcb_layout.placement_guide);
```

## 📚 Model Recommendations

### For Beginners
- **LLaMA 3.1 8B** - Good balance of speed and quality
- **Mistral 7B** - Fast, efficient

### For Better Quality
- **LLaMA 3.1 70B** - High quality (needs good GPU)
- **Mixtral 8x7B** - Good performance

### For Local CPU
- **TinyLlama 1.1B** - Runs on CPU, basic help
- **Phi-2** - Microsoft, good for CPU

## 🐛 Troubleshooting

### Ollama won't connect
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

### Model not found
```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.1:8b
```

### Slow responses
- Use smaller model (8B instead of 70B)
- Check if using GPU acceleration
- Reduce context length

### Out of memory
- Use smaller model
- Close other applications
- Reduce training data size

## 📦 Complete Workflow

```bash
# 1. Create PCB specification in markdown
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects
vim PCB1.md

# 2. Parse to JSON
cd md-to-schematic
node parser.js "my-board-v1"

# 3. Generate AI training data
cd ai-training
node training-data-generator.js

# 4. Start Ollama
ollama serve

# 5. Get AI design help
node ollama-integration.js analyze

# 6. Iterate on design
node ai-design-assistant.js "add WiFi capability"

# 7. Generate EasyEDA instructions
node ollama-integration.js chat "how do I implement this in EasyEDA?"

# 8. Create PCB in EasyEDA Pro
# Use the AI-generated instructions
```

## 🌟 Pro Tips

1. **Build Knowledge Over Time**
   - Parse multiple designs
   - Training data accumulates
   - AI learns your design patterns

2. **Ask Specific Questions**
   - Good: "Calculate 100mA LED resistor from 5V"
   - Bad: "LED resistor"

3. **Validate AI Suggestions**
   - AI helps but verify calculations
   - Check datasheets
   - Use physics formulas

4. **Use Conversation History**
   - Build context over multiple questions
   - Reference previous answers

5. **Combine Tools**
   - Use AI for ideas
   - Use calculator for verification
   - Use training data for reference

## 📄 License

MIT - Feel free to modify and extend!

## 🤝 Contributing

Add your own:
- Component knowledge
- Design rules
- Calculations
- Best practices

The more training data, the smarter the AI becomes!

---

**Happy PCB Designing with AI! 🎉**
