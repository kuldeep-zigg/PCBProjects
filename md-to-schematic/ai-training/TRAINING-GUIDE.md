# AI Model Training Guide for PCB Design

Complete guide to train your local AI model to become a PCB design expert.

## 🎯 Training Objectives

After training, your AI model will be able to:
1. ✅ Suggest components based on requirements
2. ✅ Calculate resistor, capacitor values
3. ✅ Validate PCB designs
4. ✅ Identify design issues
5. ✅ Provide EasyEDA implementation guidance
6. ✅ Explain electronics concepts
7. ✅ Apply best practices automatically

## 📊 Training Data Overview

### What Gets Generated

```
ai-training-data/
├── training-data_timestamp.json        # Complete dataset
│   ├── metadata (title, version)
│   ├── electronics_knowledge
│   │   ├── components (specs, best practices)
│   │   ├── designRules (power, signals, thermal)
│   │   └── calculations (formulas, examples)
│   └── training_examples
│       ├── instruction
│       ├── input (requirements)
│       ├── output (design + analysis)
│       └── electronics_principles
│
├── alpaca-format_timestamp.json        # For LLaMA fine-tuning
└── chatml-format_timestamp.json        # For GPT-style models
```

### Data Quality

Each training example includes:
- **Component Specifications**: Voltage, current, pinouts
- **Best Practices**: Placement, routing, decoupling
- **Calculations**: With formulas and explanations
- **Validation**: Errors, warnings, suggestions
- **Physics**: Underlying principles (Ohm's Law, etc.)
- **Step-by-Step**: Design methodology

## 🚀 Method 1: Use Pre-Trained Model (Easiest)

**Best for: Quick start, testing, learning**

No actual training needed - just use a general model with electronics knowledge injected via prompts.

### Setup (5 minutes)

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull a model
ollama pull llama3.1:8b

# 3. Generate knowledge base
cd ai-training
node training-data-generator.js

# 4. Start using it!
node ollama-integration.js analyze
```

### How It Works

The system loads electronics knowledge into the AI's context:
```javascript
// System prompt includes:
- Component database
- Design rules
- Calculation formulas
- Best practices
- Physics principles
```

Each query gets electronics knowledge + your question = expert answer!

### Pros & Cons

✅ **Pros:**
- No training required
- Works immediately
- Easy to update knowledge
- No special hardware needed

❌ **Cons:**
- Uses context window (tokens)
- Not as deeply integrated
- May forget knowledge in long conversations

## 🔥 Method 2: Fine-Tune Model (Advanced)

**Best for: Production use, specialized applications, best performance**

Actually train the model on electronics data so it "knows" PCB design inherently.

### Requirements

- **Hardware:** 
  - GPU with 16GB+ VRAM (NVIDIA RTX 3090, 4090, or cloud GPU)
  - Or 64GB+ RAM for CPU training (very slow)

- **Software:**
  - Python 3.10+
  - PyTorch
  - Training framework (choose one):
    - Axolotl (recommended)
    - LLaMA-Factory
    - Unsloth (fastest)

### Step 1: Prepare Training Data

```bash
# Generate from your PCB designs
cd ai-training
node training-data-generator.js

# Output: alpaca-format_timestamp.json
```

### Step 2: Set Up Training Environment

```bash
# Install Axolotl (recommended)
git clone https://github.com/OpenAccess-AI-Collective/axolotl
cd axolotl
pip install -e .

# Or use Unsloth (faster)
pip install unsloth
```

### Step 3: Create Training Config

Create `pcb-design-config.yml`:

```yaml
base_model: meta-llama/Llama-3.1-8B
model_type: LlamaForCausalLM

# Your training data
datasets:
  - path: /path/to/alpaca-format_timestamp.json
    type: alpaca
    
# Training parameters
adapter: qlora  # Efficient fine-tuning
lora_r: 16
lora_alpha: 32
lora_dropout: 0.05

# Optimization
learning_rate: 0.0002
num_epochs: 3
batch_size: 4
gradient_accumulation_steps: 4

# Output
output_dir: ./pcb-design-model
```

### Step 4: Train the Model

```bash
# Start training
accelerate launch -m axolotl.cli.train pcb-design-config.yml

# Training time:
# - 8B model: 2-6 hours on RTX 4090
# - 70B model: 24-48 hours on multiple GPUs
```

### Step 5: Test Your Model

```bash
# Merge LoRA weights
python -m axolotl.cli.merge_lora pcb-design-config.yml

# Use with Ollama
ollama create pcb-expert -f Modelfile

# Test it
ollama run pcb-expert
>>> Design a PCB for 10 IR LEDs
```

### Fine-Tuning Tips

1. **Start Small**: Use 8B model first
2. **More Data**: Parse 10+ different PCB designs
3. **Quality > Quantity**: Good examples matter more
4. **Validation Set**: Hold out 10% for testing
5. **Learning Rate**: Start conservative (0.0002)
6. **Epochs**: 3-5 epochs usually sufficient

## 🌥️ Method 3: Cloud Fine-Tuning

**Best for: No local GPU, want best results**

Use cloud services to fine-tune without local hardware.

### Option A: Together.ai

```bash
# 1. Upload training data to Together.ai
# File: alpaca-format_timestamp.json

# 2. Create fine-tuning job
# Model: Llama-3.1-8B
# Training file: your uploaded file
# Epochs: 3

# 3. Wait for training (2-4 hours)

# 4. Use your model
curl https://api.together.xyz/v1/chat/completions \
  -H "Authorization: Bearer $TOGETHER_API_KEY" \
  -d '{
    "model": "your-model-id",
    "messages": [{"role": "user", "content": "Design a PCB"}]
  }'
```

Cost: ~$5-20 per training run

### Option B: RunPod

```bash
# 1. Rent GPU on RunPod ($0.20-1/hour)
# 2. Use their Jupyter notebook
# 3. Upload training data
# 4. Run training script
# 5. Download trained model
# 6. Use locally with Ollama
```

### Option C: Google Colab

Free option (with limits):

```python
# In Colab notebook
!pip install unsloth

from unsloth import FastLanguageModel
import json

# Load your training data
with open('alpaca-format.json') as f:
    training_data = json.load(f)

# Load base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3.1-8b",
    max_seq_length = 2048,
)

# Configure for fine-tuning
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    lora_alpha = 32,
    lora_dropout = 0,
)

# Train!
from trl import SFTTrainer

trainer = SFTTrainer(
    model = model,
    train_dataset = formatted_data,
    max_seq_length = 2048,
)

trainer.train()

# Save
model.save_pretrained("pcb-design-model")
```

## 📈 Training Progress Tracking

Monitor your training:

```python
# Check training loss
# Good: Loss decreases steadily
# Bad: Loss stays high or increases

# Example:
Epoch 1: loss = 2.5
Epoch 2: loss = 1.8  ✓ Good
Epoch 3: loss = 1.3  ✓ Good
```

## ✅ Validation & Testing

### Test Your Trained Model

```bash
# Test 1: Component suggestion
ollama run pcb-expert "Suggest components for IR control board"

# Test 2: Calculation
ollama run pcb-expert "Calculate LED resistor for 100mA from 5V"

# Test 3: Design validation
ollama run pcb-expert "Review this design: [paste JSON]"

# Test 4: Best practices
ollama run pcb-expert "What decoupling caps do I need for 74HC595?"
```

### Quality Metrics

✅ **Good Model Should:**
- Provide specific component values
- Show calculations with formulas
- Mention safety margins
- Cite best practices
- Warn about potential issues

❌ **Warning Signs:**
- Vague answers ("use appropriate resistor")
- Wrong calculations
- Contradictory advice
- Ignoring safety

## 🎓 Improving Your Model

### Add More Training Data

```bash
# Parse more PCB designs
node parser.js "design1"
node parser.js "design2"
node parser.js "design3"

# Regenerate training data
node training-data-generator.js

# More diverse examples = smarter AI
```

### Expand Knowledge Base

Edit `training-data-generator.js`:

```javascript
// Add new components
'ESP32': {
  voltage: { operating: '3.3V' },
  wifi: true,
  bluetooth: true,
  bestPractices: [
    'Add antenna matching network',
    'Keep RF traces away from noisy signals',
    ...
  ]
},

// Add new design rules
industrialDesign: {
  rules: [
    'Use TVS diodes on all external connections',
    'Wide temperature range components (-40°C to +85°C)',
    ...
  ]
}
```

### Iterate on Prompts

```javascript
// Test different system prompts
const prompt1 = "You are an expert electronics engineer...";
const prompt2 = "You are a PCB design AI trained on ...";

// See which produces better results
```

## 🏆 Production Deployment

Once trained and validated:

### Option 1: Local Ollama

```bash
# Create Modelfile
FROM ./pcb-design-model
PARAMETER temperature 0.7
PARAMETER top_p 0.9
SYSTEM "You are a PCB design expert..."

# Create Ollama model
ollama create pcb-expert -f Modelfile

# Use it
ollama run pcb-expert
```

### Option 2: API Server

```python
# server.py
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()
model = pipeline("text-generation", model="./pcb-design-model")

@app.post("/analyze")
def analyze_pcb(design: dict):
    prompt = f"Analyze this PCB design: {design}"
    result = model(prompt)
    return {"analysis": result}
```

### Option 3: Web Interface

```javascript
// Simple chat interface
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    model: 'pcb-expert',
    messages: [{role: 'user', content: userQuestion}]
  })
});
```

## 📊 Comparison: Methods

| Method | Setup Time | Cost | Performance | Hardware |
|--------|------------|------|-------------|----------|
| Pre-trained + Prompts | 5 min | Free | Good | Any |
| Local Fine-tune | 2-4 hours | Free | Best | GPU 16GB+ |
| Cloud Fine-tune | 1 hour | $5-50 | Best | None |
| Colab Free | 1 hour | Free* | Good | None |

*Colab free tier has time/compute limits

## 🎯 Recommended Path

**For Most Users:**
1. Start with Method 1 (Pre-trained + Prompts)
2. Use Ollama + LLaMA 3.1 8B
3. Test with your PCB designs
4. If you need better results → Method 3 (Cloud)

**For Serious Projects:**
1. Collect 20+ PCB designs
2. Generate comprehensive training data
3. Fine-tune with Unsloth or Axolotl
4. Validate thoroughly
5. Deploy locally or as API

## 💡 Real-World Example

```bash
# Complete workflow

# 1. Design 10 different PCBs (documented in markdown)
cd PCBProjects
for i in {1..10}; do vim PCB$i.md; done

# 2. Parse all designs
cd md-to-schematic
for i in {1..10}; do node parser.js "pcb-$i"; done

# 3. Generate training data
cd ai-training
node training-data-generator.js
# → Creates dataset with 10 examples + knowledge base

# 4. Fine-tune model (cloud or local)
# Upload alpaca-format_*.json to Together.ai
# Start training job
# Wait 2-4 hours

# 5. Use your trained model
ollama create my-pcb-expert -f Modelfile
ollama run my-pcb-expert

# 6. Design assistance
>>> I need a board with ESP32 and 10 sensors
[AI provides detailed component list, calculations, layout advice]

# 7. Continuous improvement
# Parse new designs → regenerate training → retrain
```

## 🐛 Troubleshooting Training

### Training Loss Not Decreasing
- **Cause**: Learning rate too low/high
- **Fix**: Try 0.0001 or 0.0003

### Model Overfitting
- **Symptom**: Repeats training examples exactly
- **Fix**: More diverse training data, lower epochs

### Out of Memory
- **Fix**: Reduce batch size, use gradient accumulation
- **Fix**: Use LoRA/QLoRA instead of full fine-tuning

### Model "Forgets" General Knowledge
- **Fix**: Mix your PCB data with general instruction data (80% PCB, 20% general)

## 📚 Additional Resources

- **Ollama Docs**: https://github.com/ollama/ollama
- **Axolotl**: https://github.com/OpenAccess-AI-Collective/axolotl
- **Unsloth**: https://github.com/unslothai/unsloth
- **LoRA Paper**: https://arxiv.org/abs/2106.09685
- **LLaMA Models**: https://huggingface.co/meta-llama

## 🎉 Success Criteria

Your AI is ready when it can:
- ✅ Calculate LED resistor correctly
- ✅ Suggest appropriate decoupling caps
- ✅ Warn about missing components
- ✅ Explain WHY (not just WHAT)
- ✅ Provide EasyEDA-specific guidance

---

**Start training your PCB design AI today! 🚀**
