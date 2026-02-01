# Quick Start Guide

## What This Does

Converts your `PCB1.md` markdown file into an actual EasyEDA schematic with:
- All components placed automatically
- Connections wired
- Proper component designators

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic
npm install
```

### 2. Test the Parser

**Default (automatic prefix):**
```bash
npm run parse
```

**With custom prefix:**
```bash
node parser.js "my-board-name"
```

**Expected Output:**
```
✅ Parsed PCB specification successfully!
📊 Components found: 4
🔌 Connections found: 3
📁 Output saved to: output/my-board-name_20260201_143022.json
🔗 Latest copy: output/latest.json
⏰ Timestamp: 20260201_143022 IST
```

### 3. Check the Parsed Data

```bash
# View the latest parse
cat output/latest.json

# Or view a specific timestamped file
ls output/
cat output/my-board-name_20260201_143022.json
```

You should see JSON with all your components and connections.

**File naming format:**
- `{your-prefix}_{YYYYMMDD_HHMMSS}.json` (unique, never overwritten)
- `latest.json` (always contains the most recent parse)

### 4. Install in EasyEDA Pro

**Option 1 - Quick Load (Easiest):**
1. Open EasyEDA Pro
2. Menu: **Advanced → Extensions → Extension Setting**
3. Click **"Load Extension"**
4. Browse to: `/Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/easyeda-extension/`
5. Click Select

**Option 2 - Development Mode:**
```bash
# Get the official SDK
cd ~/Downloads
git clone https://github.com/easyeda/pro-api-sdk.git
cd pro-api-sdk
npm install

# Link your extension
mkdir -p extensions
ln -s /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/easyeda-extension extensions/md-to-schematic

# Build
npm run build
```

## Using the Extension

1. **In EasyEDA Pro:**
   - Tools → Import from Markdown
   
2. **Select File:**
   - Choose `parsed-pcb-data.json`
   
3. **Wait for Magic:**
   - Components will be placed
   - Connections will be drawn
   - Your schematic is ready!

## Important Notes

⚠️ **This is a starting point!**

The EasyEDA extension code uses conceptual API calls. You'll need to:

1. **Verify the API:** Check the real EasyEDA Pro API methods
2. **Test component names:** Make sure library parts exist
3. **Adjust positioning:** Tweak `SPACING_X` and `SPACING_Y` values

## Extending It

### Add New Component Types

Edit `parser.js` and add a new parsing function:

```javascript
parseYourNewSection() {
  const section = this.content.match(/## Your Section([\s\S]*?)---/);
  // Parse and add to this.components
}
```

Then call it in the `parse()` method.

### Change Layout

Edit `main.js` and modify the placement logic:

```javascript
// Different grid for different component types
const IR_RECEIVER_X = 100;
const IR_RECEIVER_Y = 200;
```

## Troubleshooting

**"npm: command not found"**
- Install Node.js: https://nodejs.org/

**Parser finds 0 components**
- Check markdown table format
- Ensure `---` separators exist
- Section headers must match exactly

**Extension won't load**
- Use EasyEDA Pro (not Standard)
- Check console for errors (F12 in EasyEDA)
- Verify manifest.json is valid JSON

## Next Steps

1. Run the parser and check output ✓
2. Study EasyEDA Pro API docs
3. Test the extension with a simple schematic
4. Gradually add your full PCB

---

**Need Help?** 
Check the main README.md for detailed documentation.
