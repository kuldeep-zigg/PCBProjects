# How to Use the Parser with Custom Prefixes

## Basic Usage (Default Prefix)

```bash
npm run parse
```

**Output:** `output/pcb-data_20260201_143022.json`
- Prefix: `pcb-data` (default)
- Timestamp: IST timezone
- Format: `YYYYMMDD_HHMMSS`

## Custom Prefix Usage

### Method 1: Direct Command Line

```bash
node parser.js "my-custom-prefix"
```

**Example outputs:**
```bash
node parser.js "ziggy-pcb"
# → output/ziggy-pcb_20260201_143530.json

node parser.js "ir-control-v2"
# → output/ir-control-v2_20260201_143822.json

node parser.js "prototype-A"
# → output/prototype-A_20260201_144015.json
```

### Method 2: Using NPM Script

```bash
npm run parse:custom -- "your-prefix-here"
```

**Example:**
```bash
npm run parse:custom -- "dual-pcb-system"
# → output/dual-pcb-system_20260201_144530.json
```

## Output Structure

Every run creates TWO files:

1. **Timestamped file:** `{prefix}_{timestamp}.json`
   - Unique for each run
   - Never overwritten
   - Permanent history

2. **Latest file:** `latest.json`
   - Always contains the most recent parse
   - Convenient for quick access
   - Gets overwritten each time

## File Organization

```
md-to-schematic/
├── output/
│   ├── pcb-data_20260201_120000.json
│   ├── pcb-data_20260201_130000.json
│   ├── ziggy-pcb_20260201_140000.json
│   ├── ir-control_20260201_150000.json
│   └── latest.json  ← Always the newest
```

## Timestamp Format (IST)

- **Timezone:** Indian Standard Time (IST = UTC+5:30)
- **Format:** `YYYYMMDD_HHMMSS`
- **Example:** `20260201_143022` = Feb 1, 2026, 2:30:22 PM IST

## Examples

### Project Versioning

```bash
node parser.js "v1.0"
node parser.js "v1.1"
node parser.js "v2.0-beta"
```

### Date-Based Naming

```bash
node parser.js "jan-sprint"
node parser.js "feb-milestone"
```

### Descriptive Names

```bash
node parser.js "prototype-initial"
node parser.js "prototype-revised"
node parser.js "production-ready"
```

### Client/Project Names

```bash
node parser.js "client-abc"
node parser.js "project-x"
node parser.js "demo-board"
```

## Quick Reference

```bash
# Default prefix
npm run parse

# Custom prefix (direct)
node parser.js "my-prefix"

# Custom prefix (via npm)
npm run parse:custom -- "my-prefix"

# View output
cat output/latest.json

# List all generated files
ls -la output/
```

## Tips

1. **Keep prefixes short** - Makes filenames easier to read
2. **Use hyphens, not spaces** - `ir-control` not `ir control`
3. **Be descriptive** - `dual-pcb-v2` better than `test`
4. **Version your designs** - `board-v1`, `board-v2`, etc.

## Clean Up Old Files

```bash
# Remove all output files except latest
cd output
ls | grep -v "latest.json" | xargs rm

# Or keep only last 10 files
ls -t | tail -n +11 | xargs rm
```

## Integration with EasyEDA Extension

The extension automatically looks for `output/latest.json` by default, but you can also select any specific timestamped file.

1. Parse with your prefix: `node parser.js "my-board"`
2. Open EasyEDA Pro
3. Tools → Import from Markdown
4. Select `output/my-board_20260201_143022.json` (or `output/latest.json`)

---

**Pro Tip:** Use consistent prefixes for related designs to make file management easier!
