# Markdown to EasyEDA Schematic Converter

This tool converts markdown-based PCB specifications into EasyEDA Pro schematics.

## Overview

**Two-part system:**

1. **Parser** (`parser.js`) - Extracts component and connection data from markdown
2. **EasyEDA Extension** - Uses EasyEDA Pro API to generate the actual schematic

## Installation

### Step 1: Setup Parser

```bash
cd md-to-schematic
npm install
```

### Step 2: Parse Your Markdown

```bash
npm run parse
```

This will:
- Read `PCB1.md` from parent directory
- Extract components, connections, and metadata
- Generate `parsed-pcb-data.json`

### Step 3: Install EasyEDA Extension

#### Option A: Using EasyEDA Pro Extension Manager

1. Open EasyEDA Pro
2. Go to **Advanced → Extensions → Extension Setting**
3. Click **Load Extension**
4. Navigate to `md-to-schematic/easyeda-extension/`
5. Select the folder

#### Option B: Using EasyEDA Pro API SDK (For Development)

```bash
# Clone the official SDK
git clone https://github.com/easyeda/pro-api-sdk.git
cd pro-api-sdk
npm install

# Copy your extension files
cp -r ../md-to-schematic/easyeda-extension ./extensions/md-to-schematic

# Build
npm run build

# The built extension will be in dist/
```

## Usage

1. **Parse your markdown:**
   ```bash
   npm run parse
   ```

2. **Open EasyEDA Pro**

3. **Load the extension:**
   - Go to **Tools → Import from Markdown**
   - Select your `parsed-pcb-data.json` file
   - The schematic will be automatically generated!

## Features

### What Gets Converted:

✅ **Components:**
- Raspberry Pi Pico (MCU)
- TSOP4838 IR Receivers (10x)
- 74HC595 Shift Register
- N-Channel MOSFETs (10x)
- TSAL6400 IR LEDs (10x)

✅ **Connections:**
- IR Receiver GPIO mappings
- Shift register control signals (DATA, CLOCK, LATCH, OE)
- MOSFET gate connections
- LED driver circuits

✅ **Power Rails:**
- +5V power distribution
- +3.3V for IR receivers
- Common ground

## Customization

### Modify the Parser

Edit `parser.js` to handle different markdown formats:

```javascript
// Add new component type parsing
parseCustomComponent() {
  const section = this.content.match(/## Your Custom Section([\s\S]*?)---/);
  // Your parsing logic
}
```

### Modify Component Placement

Edit `main.js` in the EasyEDA extension:

```javascript
// Adjust grid spacing
const SPACING_X = 300; // Change horizontal spacing
const SPACING_Y = 150; // Change vertical spacing
```

### Add New Component Types

In `main.js`, extend the `placeComponent()` function:

```javascript
case 'YOUR_COMPONENT_TYPE':
  libraryComponent = await api.findComponent({
    name: 'Component Name',
    library: 'system'
  });
  break;
```

## Important Notes

### EasyEDA API Limitations

The code provided uses a **conceptual API** based on EasyEDA Pro Extension documentation. The actual API might have different method names and structures.

**Before using, you should:**

1. Read the official EasyEDA Pro API documentation:
   - https://prodocs.easyeda.com/en/api/guide/

2. Check the actual API methods available in the SDK:
   ```bash
   git clone https://github.com/easyeda/pro-api-sdk.git
   ```

3. Modify `main.js` to use the correct API calls

### Current Status

- ✅ Parser is fully functional
- ⚠️ EasyEDA extension needs API verification
- ⚠️ Component library names need to match your EasyEDA Pro library

## Next Steps

### Make it Production Ready:

1. **Test the parser:**
   ```bash
   npm run parse
   # Check parsed-pcb-data.json for accuracy
   ```

2. **Study EasyEDA Pro API:**
   - Clone the SDK
   - Read the documentation
   - Look at example extensions

3. **Adjust the extension:**
   - Update API calls to match actual EasyEDA Pro API
   - Test component placement
   - Fine-tune wire routing

4. **Add error handling:**
   - Component not found fallbacks
   - Connection validation
   - User notifications

## Markdown Format Requirements

Your markdown should follow this structure:

```markdown
## Section Title

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |

---
```

The parser specifically looks for:
- IR Receiver GPIO Mapping tables
- Shift Register Control Signal tables
- MOSFET to LED mapping tables

## Troubleshooting

**Parser not finding components:**
- Check your markdown table format
- Ensure section headers match exactly
- Tables must be separated by `---`

**Extension not loading:**
- Verify EasyEDA Pro version compatibility
- Check browser console for errors (F12)
- Ensure manifest.json is valid

**Components not placing:**
- Verify component library names in EasyEDA Pro
- Check if components exist in your library
- Try manual search in EasyEDA first

## License

MIT - Feel free to modify and extend!
