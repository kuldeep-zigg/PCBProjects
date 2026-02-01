# Smart Learning System - Quick Guide

## What It Does

**Intelligently validates and processes inputs:**

1. ✅ **Validates** if text is a real component or instruction
2. 🔍 **Searches multiple sources** for component data
3. 📋 **Stores instructions** as auto-generated rules
4. 💾 **Converts everything to JSON** for learning
5. 🤖 **Uses AI** to synthesize comprehensive profiles

## Data Sources

### Automatic Multi-Source Gathering:

1. **AllDataSheet.com** - Datasheets and specs
2. **GitHub** - Example circuits and code
3. **Public APIs** - SnapEDA, ComponentSearchEngine
4. **Web Scraping** - Detailed specifications
5. **AI Synthesis** - Comprehensive component profiles

## Usage

### Process any input (component or instruction):

```bash
npm run smart-learn "LM358"
# → Validates as component → Searches all sources → Saves JSON

npm run smart-learn "use bypass capacitors near ICs"
# → Validates as instruction → Stores in AUTO_GENERATED_RULES.md

npm run smart-learn "ESP32-WROOM-32"
# → Gathers from AllDataSheet, GitHub, APIs → Complete profile

npm run smart-learn "connect power supply decoupling"
# → Stores as design convention
```

## Output

### For Components:
```
knowledge-base/web-scraped/
  └── LM358_complete.json          # All gathered data
      ├── sources
      │   ├── allDataSheet          # Datasheet links + specs
      │   ├── github                # Example repositories
      │   ├── publicAPIs            # API results
      │   └── webScrape             # Detailed specs
      └── aiSynthesis               # AI-generated profile
```

### For Instructions:
```
rules-md/
  └── AUTO_GENERATED_RULES.md      # Auto-stored rules
```

## Features

### 🔍 Intelligent Validation

- **Pattern matching** for ICs (LM358, 74HC595, ESP32)
- **Keyword detection** for instructions
- **AI fallback** for ambiguous cases

### 📊 Multi-Source Data

- **AllDataSheet**: Primary datasheet source
- **GitHub**: Real-world examples and circuits
- **Public APIs**: Component databases
- **Web scraping**: Detailed specifications
- **AI synthesis**: Complete component profiles

### 💾 JSON Conversion

Everything converted to structured JSON:
- Component specifications
- Datasheet links
- Example code URLs
- Design rules
- AI analysis

### 🤖 AI Integration

- Validates ambiguous inputs
- Synthesizes data from multiple sources
- Generates comprehensive profiles
- Extracts specifications from HTML

## Examples

### Example 1: Component Search

```bash
npm run smart-learn "MAX3232"
```

**Output:**
```json
{
  "component": "MAX3232",
  "sources": {
    "allDataSheet": {
      "datasheets": ["..."],
      "detailedSpecs": {...}
    },
    "github": {
      "repositories": [...]
    },
    "publicAPIs": {...},
    "webScrape": {...}
  },
  "aiSynthesis": {
    "type": "RS-232 Transceiver",
    "specifications": {...},
    "applications": [...],
    "recommendations": [...]
  }
}
```

### Example 2: Design Rule

```bash
npm run smart-learn "always add 100nF capacitor near each IC"
```

**Stored in AUTO_GENERATED_RULES.md:**
```markdown
## Rule added 2026-02-02T...

always add 100nF capacitor near each IC

---
```

## Integration with Existing System

The smart learning system integrates with:

- ✅ `auto-pcb-designer-optimized.js` - Uses learned data
- ✅ `knowledge-harvester.js` - Enhances knowledge base
- ✅ `learning-engine.js` - Improves quality scores
- ✅ `datasheet-downloader.js` - Augments search

## Benefits

1. **Automatic Classification** - No manual sorting needed
2. **Multi-Source** - More comprehensive data
3. **JSON Format** - Easy for AI to learn from
4. **Self-Documenting** - Auto-generates rules
5. **Continuous Learning** - Grows knowledge base automatically

## Configuration

Edit `smart-learning-system.js` to:

- Add more data sources
- Customize validation patterns
- Change AI models
- Adjust scraping rules

**See [MASTER.md](../../MASTER.md) for complete documentation.**
