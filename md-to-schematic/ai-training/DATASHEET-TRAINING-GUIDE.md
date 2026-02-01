# Training AI Models with Datasheet Knowledge

## 🎯 Two Approaches

### Approach 1: Knowledge Injection (Easy, Works Now) ✅
**Time:** 5 minutes  
**Benefit:** Immediate results, no model retraining needed  
**How:** Load datasheet knowledge into AI's context on every query

### Approach 2: Fine-Tuning (Advanced) 🔥
**Time:** 2-6 hours  
**Benefit:** Permanent knowledge, faster responses  
**How:** Actually retrain the model with datasheet data

---

## 🚀 Approach 1: Knowledge Injection (Recommended)

Your system ALREADY does this! The orchestrator loads datasheet knowledge automatically.

### How It Works Now:

```javascript
// multi-model-orchestrator.js already does this:
const systemPrompt = `You are an expert engineer.

Electronics Knowledge:
${JSON.stringify(this.knowledgeBase, null, 2)}

// Includes all datasheet specs!
`;
```

### Add More Datasheets (5 minutes):

**Step 1:** Edit `datasheet-reader.js`

```javascript
// Add your new component
'ESP32-WROOM-32': {
  component: 'ESP32-WROOM-32',
  description: 'WiFi & Bluetooth MCU',
  manufacturer: 'Espressif',
  
  electrical: {
    supply_voltage: { min: 3.0, typ: 3.3, max: 3.6, unit: 'V' },
    current_active: { typ: 80, max: 240, unit: 'mA' },
    current_sleep: { typ: 0.8, unit: 'mA' },
    wifi_current: { tx: 240, rx: 100, unit: 'mA' }
  },
  
  processor: {
    cores: 2,
    frequency: { max: 240, unit: 'MHz' },
    sram: { size: 520, unit: 'KB' },
    flash: { size: 4, unit: 'MB' }
  },
  
  gpio: {
    total_pins: 34,
    voltage_level: '3.3V',
    max_current_per_pin: '40mA',
    adc_channels: 18,
    pwm_channels: 16,
    uart: 3,
    spi: 4,
    i2c: 2
  },
  
  wireless: {
    wifi: '802.11 b/g/n',
    bluetooth: 'v4.2 BR/EDR and BLE',
    antenna: 'PCB antenna or external'
  },
  
  typical_application: `
Power Connection:
  3.3V → VDD pins (multiple)
  GND → GND pins (multiple)
  Add 0.1µF decoupling caps near each VDD pin
  Add 10µF bulk cap at power input

GPIO Usage:
  - All GPIOs are 3.3V
  - Maximum 40mA per pin
  - Some pins are strapping pins (check datasheet)
  - Avoid GPIO 6-11 (connected to flash)

WiFi Operation:
  - Peak current: 240mA (use proper power supply)
  - Add decoupling near RF section
  - Keep antenna area clear
  - PCB antenna needs ground clearance`,
  
  design_considerations: [
    'All GPIO are 3.3V - NOT 5V tolerant',
    'WiFi/BT require good power supply (low noise)',
    'Add 0.1µF decoupling caps near each VDD pin',
    'Add 10µF+ bulk capacitor at power input',
    'Some GPIOs are strapping pins - check boot behavior',
    'Keep antenna area clear of ground plane',
    'USB-to-UART chip needed for programming (CP2102, CH340)',
    'Auto-reset circuit: 0.1µF caps on EN and GPIO0',
    'Boot modes controlled by GPIO0, GPIO2 at startup'
  ]
}
```

**Step 2:** Regenerate training data

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training
npm run generate-training
```

**Step 3:** Test immediately!

```bash
npm run multi-collaborate -- "ESP32 WiFi board design"
```

The AI now knows ESP32 specs!

---

## 🔥 Approach 2: Fine-Tuning (Advanced)

This actually retrains the model with your datasheet knowledge permanently.

### Prerequisites:

**Hardware:**
- GPU with 16GB+ VRAM (NVIDIA RTX 3090, 4090), OR
- Cloud GPU (RunPod, Lambda Labs, Together.ai)

**Software:**
```bash
# Install training framework
pip install unsloth
# OR
pip install axolotl
```

### Step 1: Prepare More Datasheets

Create comprehensive datasheet library:

```bash
cd ai-training

# Add datasheets for 20+ components
node datasheet-reader.js export datasheet-library-full.json
```

Edit `datasheet-reader.js` to add:
- ESP32, ESP8266, ESP32-S3
- STM32, ATmega328P, RP2040
- More sensors (BME280, MPU6050, etc.)
- Power ICs (LM7805, AMS1117, etc.)
- Display ICs (SSD1306, ST7735, etc.)

### Step 2: Generate Training Dataset

```bash
# Parse multiple PCB designs
cd ..
node parser.js "design1"
node parser.js "design2"
node parser.js "design3"
# ... parse 10-20 designs

# Generate comprehensive training data
cd ai-training
npm run generate-training
```

This creates:
- `alpaca-format_*.json` - For LLaMA/Phi fine-tuning
- `chatml-format_*.json` - For DeepSeek fine-tuning

### Step 3A: Fine-Tune Locally (If you have GPU)

**Using Unsloth (Fastest):**

```python
# train-phi4.py
from unsloth import FastLanguageModel
import json

# Load model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Phi-4",
    max_seq_length = 4096,
    load_in_4bit = True,
)

# Prepare for fine-tuning
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    lora_alpha = 32,
    lora_dropout = 0.05,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"],
)

# Load your training data
with open('ai-training-data/alpaca-format_latest.json') as f:
    training_data = json.load(f)

# Format for training
def format_prompt(example):
    return f"""### Instruction:
{example['instruction']}

### Input:
{example['input']}

### Response:
{example['output']}"""

formatted_data = [format_prompt(ex) for ex in training_data]

# Train!
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model = model,
    train_dataset = formatted_data,
    max_seq_length = 4096,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 10,
        max_steps = 100,
        learning_rate = 2e-4,
        output_dir = "./phi4-pcb-expert",
        logging_steps = 1,
    )
)

trainer.train()

# Save fine-tuned model
model.save_pretrained("phi4-pcb-expert")
tokenizer.save_pretrained("phi4-pcb-expert")
```

**Run training:**
```bash
python train-phi4.py
# Takes 2-4 hours on RTX 4090
```

**Load in Ollama:**
```bash
# Create Modelfile
echo "FROM ./phi4-pcb-expert" > Modelfile
echo "PARAMETER temperature 0.7" >> Modelfile

# Create Ollama model
ollama create phi4-pcb-expert -f Modelfile

# Test it!
ollama run phi4-pcb-expert
```

### Step 3B: Fine-Tune on Cloud (No GPU needed)

**Using Together.ai (Easiest):**

1. Go to https://together.ai
2. Sign up (free credits available)
3. Upload your `alpaca-format_*.json`
4. Select base model: Phi-4 or LLaMA 3.1
5. Start fine-tuning (takes 2-4 hours)
6. Download fine-tuned model
7. Load into Ollama

**Using RunPod:**

```bash
# Rent GPU (~$0.20-1/hour)
# Connect via Jupyter notebook
# Run the training script above
# Download fine-tuned model
```

### Step 4: Update Orchestrator to Use Fine-Tuned Model

```javascript
// multi-model-orchestrator.js
this.models = {
  reasoning: 'deepseek-r1:7b',
  design: 'llama3.1:8b', 
  math: 'phi4-pcb-expert'  // Your fine-tuned model!
};
```

---

## 📊 Comparison

| Feature | Knowledge Injection | Fine-Tuning |
|---------|-------------------|-------------|
| **Time to implement** | 5 minutes | 2-6 hours |
| **Cost** | Free | $0-50 |
| **Knowledge updates** | Easy (edit file) | Hard (retrain) |
| **Response speed** | Same | Faster |
| **Context limit** | Uses tokens | Knowledge embedded |
| **Accuracy** | Very good | Excellent |
| **When to use** | Starting out | Production use |

---

## 🎯 Recommended Workflow

### Phase 1: Start (You are here!)
✅ Use Knowledge Injection (already working)
- Add datasheets to `datasheet-reader.js`
- Regenerate training data
- AI uses knowledge immediately

### Phase 2: Expand (Next week)
- Add 10-20 more component datasheets
- Parse 10+ different PCB designs
- Build comprehensive knowledge base

### Phase 3: Fine-Tune (Optional, later)
- When you have 50+ training examples
- If you need faster responses
- If knowledge base is too large for context

---

## 💡 Quick Start: Add ESP32 Now

**1. Add ESP32 datasheet:**

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Edit datasheet-reader.js
# Copy the ESP32 example from above into getCommonDatasheet()
```

**2. Test it:**

```bash
# View the datasheet
npm run datasheet-show -- ESP32-WROOM-32

# Ask AI about it
npm run multi-collaborate -- "ESP32 board design"
```

**3. Generate training data:**

```bash
npm run generate-training
```

Done! The AI now knows ESP32!

---

## 📚 Adding More Components

### Template for Any Component:

```javascript
'COMPONENT-NAME': {
  component: 'Part Number',
  description: 'What it does',
  manufacturer: 'Who makes it',
  
  electrical: {
    supply_voltage: { min: X, typ: Y, max: Z, unit: 'V' },
    current: { typ: X, max: Y, unit: 'mA' },
    // Add all electrical specs
  },
  
  pinout: {
    1: { name: 'PIN1', description: 'What it does' },
    2: { name: 'PIN2', description: 'What it does' },
    // Add all pins
  },
  
  typical_application: `
How to use this component:
- Circuit diagram
- Component values
- Connections
  `,
  
  design_considerations: [
    'Important rule 1',
    'Important rule 2',
    'Calculation formulas',
    'Safety concerns'
  ]
}
```

### Example Components to Add:

**Microcontrollers:**
- ESP32, ESP8266, ESP32-S3
- STM32F103, STM32F407
- ATmega328P (Arduino)
- RP2040 (already have Pico)

**Sensors:**
- BME280 (temp/humidity/pressure)
- MPU6050 (accelerometer/gyro)
- DHT22 (temp/humidity)
- HC-SR04 (ultrasonic)

**Displays:**
- SSD1306 (OLED)
- ST7735 (TFT LCD)
- HD44780 (character LCD)

**Power:**
- LM7805 (5V regulator)
- AMS1117 (3.3V regulator)
- TP4056 (LiPo charger)
- LM2596 (buck converter)

**Communication:**
- ESP-01 (WiFi module)
- HC-05 (Bluetooth)
- nRF24L01 (2.4GHz radio)
- SX1278 (LoRa)

---

## 🧪 Testing Your Training

After adding datasheets:

```bash
# Test specific component knowledge
npm run multi-collaborate -- "design with BME280 sensor"

# Test calculations
npm run multi-calculate -- "ESP32 power supply for WiFi"

# Test deep analysis
npm run multi-analyze  # On a design using new component

# Complete workflow
npm run multi-workflow -- "ESP32 weather station"
```

---

## 📈 Measuring Improvement

Before/after metrics:

**Before adding datasheet:**
- AI says: "Use appropriate voltage regulator"
- Generic advice

**After adding datasheet:**
- AI says: "Use AMS1117-3.3V, add 10µF input cap and 22µF output cap"
- Specific part numbers and values

---

## 🎓 Next Steps

1. **Today:** Add 3-5 new datasheets
2. **This Week:** Add 10-20 datasheets
3. **Next Month:** Consider fine-tuning if you have 50+ examples

---

## 💾 Backup Your Knowledge

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-training

# Export all datasheets
npm run datasheet-export -- datasheet-library-backup.json

# Backup training data
cp -r ai-training-data/ ai-training-data-backup/

# Backup design memory
cp -r design-memory/ design-memory-backup/
```

---

**Start adding datasheets now and watch your AI get smarter!** 🚀
