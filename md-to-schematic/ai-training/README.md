# ai-training

**→ Full documentation: [../../MASTER.md](../../MASTER.md)**

## Quick Start

```bash
# Install AI models (one-time, 15-30 min)
./setup-models.sh

# Verify models
npm run multi-check

# Run complete workflow
npm run multi-workflow -- "ESP32 with WiFi"
```

## AI Models

- **DeepSeek-R1 7B** (~4.1GB) - Deep reasoning
- **Llama 3.1 8B** (~4.7GB) - Design collaboration  
- **Phi-4 14B** (~8.3GB) - Precise calculations

## Key Files

- `multi-model-orchestrator.js` (800 lines) - Coordinates 3 models
- `ai-design-assistant.js` (600 lines) - Design AI
- `setup-models.sh` - Model installation script

## Documentation

**Complete guide:** [../../MASTER.md](../../MASTER.md)
