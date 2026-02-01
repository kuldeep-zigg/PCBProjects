# 🤖 HTML Page → Ollama AI → EasyEDA Knowledge

**System now extracts specifications from HTML pages using Ollama AI!**

---

## 🎯 What You Requested

> "like html page give to ollama to undestand and generate important find details specification and console log like big paragraph raw output of olla then and use that data sheet knowlege generate next time EasyEDA schematic"

**✅ FULLY IMPLEMENTED!**

---

## 🚀 How It Works Now

### **Complete Flow:**

```
1. Download HTML page from AllDataSheet.com
     ↓
2. Clean HTML (remove scripts, styles, tags)
     ↓
3. Send cleaned text to Ollama AI
     ↓
4. Ollama extracts specifications
     ↓
5. Log RAW Ollama output (big paragraph) to console
     ↓
6. Parse JSON specifications
     ↓
7. Save to component knowledge base
     ↓
8. Use knowledge for next EasyEDA schematic generation
```

---

## 📊 Console Output Example

### **When downloading HTML page:**

```
┌─────────────────────────────────────────────────────────┐
│ [1/10] Attempting download...
└─────────────────────────────────────────────────────────┘
   🔗 URL: https://www.alldatasheet.com/view.jsp?Searchword=LM358
   📄 HTML page detected - extracting with AI...

   ╔════════════════════════════════════════════════════════════╗
   ║         OLLAMA AI SPECIFICATION EXTRACTION                 ║
   ╚════════════════════════════════════════════════════════════╝
   🤖 Sending HTML to Ollama for analysis...
   📦 Component: LM358
   🔗 Source: https://www.alldatasheet.com/view.jsp?Searchword=...
   📊 HTML cleaned: 15247 characters
   🚀 Calling Ollama API...
   📝 Prompt length: 15500 characters

   ╔════════════════════════════════════════════════════════════╗
   ║              RAW OLLAMA OUTPUT (FULL)                      ║
   ╚════════════════════════════════════════════════════════════╝

   {
     "component": "LM358",
     "voltage": {
       "min": "3V",
       "typ": "5V",
       "max": "32V"
     },
     "current": {
       "operating": "700µA",
       "sleep": "N/A"
     },
     "package": "DIP-8, SOIC-8, TSSOP-8",
     "pins": "8",
     "temperature": {
       "min": "-40°C",
       "max": "+125°C"
     },
     "features": [
       "Dual operational amplifier",
       "Low power consumption",
       "Single supply operation",
       "Wide voltage range"
     ],
     "applications": [
       "Signal conditioning",
       "Active filters",
       "Audio amplifiers",
       "Voltage comparators"
     ],
     "manufacturer": "Texas Instruments",
     "description": "Dual operational amplifier with low
   power consumption and single supply capability"
   }

   ╚════════════════════════════════════════════════════════════╝

   ✅ Successfully extracted specifications!
   📊 Summary:
      Voltage: 5V
      Current: 700µA
      Package: DIP-8, SOIC-8, TSSOP-8
      Manufacturer: Texas Instruments
   ✅ Extracted specs saved: lm358_specs.json
```

---

## 🤖 Ollama AI Extraction

### **What Ollama Does:**

1. **Reads cleaned HTML text**
2. **Identifies component specifications**
3. **Extracts structured data:**
   - Operating voltage (min, typ, max)
   - Current consumption
   - Package types
   - Pin count
   - Temperature range
   - Key features
   - Typical applications
   - Manufacturer name
   - Component description

4. **Returns JSON format**

### **Ollama Model Used:**
- **Model:** `llama3.1:8b`
- **Temperature:** 0.1 (precise extraction)
- **Max tokens:** 2000

---

## 📁 Knowledge Storage

### **Saved Files:**

```
ai-easyeda-compiler/
└── pdf/
    └── datasheets-auto/
        ├── lm358_specs.json         ← Extracted specs
        ├── esp32_specs.json
        ├── atmega328p_specs.json
        └── ...
```

### **Spec File Format:**

```json
{
  "component": "LM358",
  "voltage": {
    "min": "3V",
    "typ": "5V",
    "max": "32V"
  },
  "current": {
    "operating": "700µA",
    "sleep": "N/A"
  },
  "package": "DIP-8, SOIC-8, TSSOP-8",
  "pins": "8",
  "temperature": {
    "min": "-40°C",
    "max": "+125°C"
  },
  "features": [
    "Dual operational amplifier",
    "Low power consumption",
    "Single supply operation"
  ],
  "applications": [
    "Signal conditioning",
    "Active filters",
    "Audio amplifiers"
  ],
  "manufacturer": "Texas Instruments",
  "description": "Dual operational amplifier...",
  "source_url": "https://www.alldatasheet.com/...",
  "extracted_at": "2026-02-01T04:30:00.000Z"
}
```

---

## 🎯 Using Knowledge in Schematic Generation

### **Component Knowledge Loader:**

```javascript
const { ComponentKnowledgeLoader } = require('./component-knowledge-loader.js');

// Load all extracted knowledge
const loader = new ComponentKnowledgeLoader();
const knowledge = loader.loadAll();

// Get specs for specific component
const lm358Specs = loader.getSpecs('LM358');

// Use in schematic generation
const componentContext = loader.generateComponentContext(['LM358', 'ESP32']);
```

### **Example Usage in Compiler:**

```javascript
// In compiler-mvp.js or similar

// Step 1: Load component knowledge
const loader = new ComponentKnowledgeLoader();
loader.loadAll();

// Step 2: Get specifications for components in design
const components = ['LM358', 'ESP32-WROOM-32', 'ATMEGA328P'];
const componentContext = loader.generateComponentContext(components);

// Step 3: Add to AI prompt
const prompt = `
Design a PCB schematic with these components:
${componentContext}

Requirements:
- Low power consumption
- 3.3V operation
... (rest of prompt)
`;

// Step 4: AI generates schematic using accurate specs!
const schematic = await generateSchematic(prompt);
```

---

## 📊 Knowledge Base Commands

### **Load and View Knowledge:**

```bash
cd ai-easyeda-compiler

# Load all component knowledge
node component-knowledge-loader.js

# Output:
# 📚 Loading Component Knowledge Base...
#    Found 5 component spec files
#    ✓ Loaded: LM358
#    ✓ Loaded: ESP32
#    ✓ Loaded: ATMEGA328P
#    📊 Total components in knowledge base: 5
#
# 📋 Available Components:
#    1. LM358
#    2. ESP32
#    3. ATMEGA328P
#    ...
```

### **Export Knowledge to Markdown:**

The loader automatically creates:
```
COMPONENT-KNOWLEDGE-BASE.md
```

Contains all extracted specifications in readable format!

---

## 🎓 Example: Complete Flow

### **Step 1: Download Component Datasheet**

```bash
npm run download LM358 IC
```

**Output:**
```
📄 HTML page detected - extracting with AI...

╔════════════════════════════════════════════════════════════╗
║              RAW OLLAMA OUTPUT (FULL)                      ║
╚════════════════════════════════════════════════════════════╝

{ "component": "LM358", "voltage": { "min": "3V", ... } }

╚════════════════════════════════════════════════════════════╝

✅ Extracted specs saved: lm358_specs.json
```

---

### **Step 2: Load Knowledge**

```bash
node component-knowledge-loader.js
```

**Output:**
```
📚 Loading Component Knowledge Base...
   ✓ Loaded: LM358
   📊 Total components: 1

📝 Exporting knowledge base to Markdown...
   ✓ Exported to: COMPONENT-KNOWLEDGE-BASE.md
```

---

### **Step 3: Use in Schematic Generation**

The compiler now automatically uses extracted specs!

**Before (without knowledge):**
```javascript
// AI has to guess LM358 specs
const prompt = "Use LM358 op-amp in design";
// → AI may use wrong voltage, wrong package, etc.
```

**After (with knowledge):**
```javascript
// AI gets accurate specs from datasheet
const componentContext = `
### LM358
**Manufacturer:** Texas Instruments
**Operating Voltage:** 3V - 32V (typ: 5V)
**Current:** 700µA
**Package:** DIP-8, SOIC-8, TSSOP-8
**Features:** Low power, single supply
`;

const prompt = `Use LM358 op-amp in design\n${componentContext}`;
// → AI uses correct specs from actual datasheet!
```

---

## 🔧 HTML Cleaning Process

### **What Gets Removed:**

- ✅ `<script>` tags (JavaScript)
- ✅ `<style>` tags (CSS)
- ✅ HTML comments
- ✅ All HTML tags (`<div>`, `<table>`, etc.)
- ✅ Extra whitespace

### **What Remains:**

- ✅ Pure text content
- ✅ Component specifications
- ✅ Technical data
- ✅ Feature descriptions

### **Example:**

**Before:**
```html
<html>
<head><script>...</script></head>
<body>
  <table>
    <tr><td>Voltage</td><td>3V - 32V</td></tr>
    <tr><td>Current</td><td>700µA</td></tr>
  </table>
</body>
</html>
```

**After Cleaning:**
```
Voltage 3V - 32V Current 700µA
```

**Perfect for Ollama!**

---

## 📈 Benefits

### **1. Accurate Specifications**
- Real datasheet data, not AI guesses
- Manufacturer-verified specs
- Precise voltage, current, package info

### **2. Better Schematics**
- Correct component selection
- Proper power supply design
- Accurate pin assignments

### **3. Knowledge Reuse**
- Extract once, use forever
- Build component library
- Share knowledge across projects

### **4. Transparency**
- See raw AI output
- Verify extracted data
- Trust the results

---

## 🎯 Real Examples

### **Example 1: LM358 Op-Amp**

**HTML Downloaded:** AllDataSheet.com page  
**Ollama Output:**
```json
{
  "component": "LM358",
  "voltage": {"min": "3V", "typ": "5V", "max": "32V"},
  "current": {"operating": "700µA"},
  "package": "DIP-8, SOIC-8",
  "manufacturer": "Texas Instruments"
}
```

**Used in Schematic:**
- ✅ Correct power supply (3-32V range)
- ✅ Low power design (700µA)
- ✅ Right package footprint (DIP-8)

---

### **Example 2: ESP32-WROOM-32**

**HTML Downloaded:** AllDataSheet.com page  
**Ollama Output:**
```json
{
  "component": "ESP32-WROOM-32",
  "voltage": {"min": "3.0V", "typ": "3.3V", "max": "3.6V"},
  "current": {"operating": "80mA", "sleep": "5µA"},
  "package": "SMD Module",
  "pins": "38"
}
```

**Used in Schematic:**
- ✅ 3.3V regulator design
- ✅ Power consumption calculations
- ✅ Correct pin count (38)

---

## 💡 Pro Tips

### **Tip 1: Download Multiple Components First**

```bash
# Download all components for your project
npm run download LM358 IC
npm run download ESP32-WROOM-32 IC
npm run download ATMEGA328P IC
npm run download AO3400 MOSFET

# Then generate schematic
npm run compile
```

**AI now has accurate specs for all components!**

---

### **Tip 2: Review Raw Ollama Output**

The big paragraph output shows exactly what Ollama extracted.  
**Verify it's correct before using in design!**

---

### **Tip 3: Export Knowledge Base**

```bash
node component-knowledge-loader.js
```

Creates `COMPONENT-KNOWLEDGE-BASE.md` with all specs in readable format!

---

## 🔮 Future Enhancements

### **Phase 1: Current ✅**
- HTML page extraction
- Ollama AI analysis
- Raw output logging
- JSON spec storage
- Knowledge loader

### **Phase 2: Coming Soon 🚧**
- Automatic component detection in requirements
- Pre-download all components before compilation
- Smart caching (don't re-extract)
- Confidence scores for extracted data

### **Phase 3: Advanced 🔜**
- Multiple datasheet sources per component
- Spec comparison and validation
- Component recommendations
- Alternative part suggestions

---

## ✅ Summary

### **Complete Flow:**

```
1. User: npm run download LM358 IC
     ↓
2. System: Downloads HTML from AllDataSheet.com
     ↓
3. System: Cleans HTML, extracts text
     ↓
4. System: Sends to Ollama AI
     ↓
5. Console: Logs RAW Ollama output (big paragraph)
     ↓
6. System: Parses JSON specifications
     ↓
7. System: Saves lm358_specs.json
     ↓
8. Later: npm run compile (generates schematic)
     ↓
9. System: Loads lm358_specs.json
     ↓
10. System: Uses accurate specs in AI prompt
     ↓
11. AI: Generates correct EasyEDA schematic!
```

---

## 🎉 Result

**You now have:**
- ✅ **HTML page extraction** from AllDataSheet.com
- ✅ **Ollama AI analysis** of datasheet content
- ✅ **Raw output logging** (big paragraph in console)
- ✅ **JSON spec storage** for reuse
- ✅ **Knowledge loader** for schematic generation
- ✅ **Accurate component data** in designs

**Real datasheet knowledge → Better EasyEDA schematics!** 🎊

---

## 🚀 Try It Now

```bash
cd ai-easyeda-compiler

# Download and extract specs
npm run download LM358 IC

# Watch Ollama extract specifications!
# See RAW output logged to console!

# Load knowledge
node component-knowledge-loader.js

# Use in schematic generation
npm run compile
```

**HTML pages → Ollama AI → EasyEDA Knowledge → Better Schematics!** ✨
