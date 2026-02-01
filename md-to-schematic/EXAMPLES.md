# Real-World Usage Examples

## Working with Your Current PCB

Your current board generates these files:

```bash
# Parse with project name
node parser.js "dual-ir-pcb"

# Output:
# output/dual-ir-pcb_20260201_070526.json
# output/latest.json
```

## Example Workflows

### 1. Version Control Workflow

Track your design iterations:

```bash
# Initial prototype
node parser.js "v0.1-initial"
# → output/v0.1-initial_20260201_100000.json

# After GPIO changes
node parser.js "v0.2-gpio-update"
# → output/v0.2-gpio-update_20260201_110000.json

# Production candidate
node parser.js "v1.0-production"
# → output/v1.0-production_20260201_120000.json
```

### 2. Client/Project Organization

```bash
# Different clients
node parser.js "client-acme"
node parser.js "client-techcorp"

# Different projects
node parser.js "project-alpha"
node parser.js "project-beta"

# Combined
node parser.js "acme-alpha-v1"
```

### 3. Feature-Based Naming

```bash
# Testing different configurations
node parser.js "10-ir-channels"
node parser.js "20-ir-channels"

# Different shift register configs
node parser.js "single-595"
node parser.js "cascaded-595"

# Power options
node parser.js "5v-power"
node parser.js "3v3-power"
```

### 4. Date-Based Milestones

```bash
# Monthly iterations
node parser.js "jan-2026"
node parser.js "feb-2026"

# Sprint-based
node parser.js "sprint-1"
node parser.js "sprint-2"

# Milestone releases
node parser.js "milestone-1-complete"
node parser.js "beta-release"
node parser.js "final-release"
```

## Real Session Example

Here's what a real design session looks like:

```bash
cd /Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic

# Morning: Initial design
node parser.js "morning-draft"
# ✅ Output: morning-draft_20260201_090000.json

# Afternoon: Added decoupling caps
# (Update PCB1.md with decoupling info)
node parser.js "with-decoupling"
# ✅ Output: with-decoupling_20260201_140000.json

# Evening: Final review
node parser.js "reviewed-v1"
# ✅ Output: reviewed-v1_20260201_180000.json

# Check what we have
ls output/
# morning-draft_20260201_090000.json
# with-decoupling_20260201_140000.json
# reviewed-v1_20260201_180000.json
# latest.json
```

## Comparing Versions

```bash
# Generate multiple versions
node parser.js "design-A"
node parser.js "design-B"

# Compare them
diff output/design-A_*.json output/design-B_*.json

# Or use a JSON diff tool
jq . output/design-A_*.json > /tmp/a.json
jq . output/design-B_*.json > /tmp/b.json
code --diff /tmp/a.json /tmp/b.json
```

## Batch Processing

Process multiple markdown files:

```bash
# If you have multiple PCB specs
for file in PCB*.md; do
    prefix=$(basename "$file" .md | tr '[:upper:]' '[:lower:]')
    node parser.js "$prefix"
done
```

## Integration with Git

```bash
# Create a version and commit
node parser.js "v1.0"
git add output/v1.0_*.json
git commit -m "Add PCB v1.0 schematic data"

# Tag the release
git tag -a pcb-v1.0 -m "PCB Design v1.0"
```

## Automation Script

Create a helper script `parse-and-archive.sh`:

```bash
#!/bin/bash
# Save in md-to-schematic/

PREFIX=${1:-"pcb-data"}
echo "Parsing with prefix: $PREFIX"

node parser.js "$PREFIX"

echo ""
echo "Recent files:"
ls -lht output/ | head -5

echo ""
echo "Total archived versions: $(ls output/*.json | grep -v latest | wc -l)"
```

Usage:
```bash
chmod +x parse-and-archive.sh
./parse-and-archive.sh "my-board"
```

## IST Timestamp Examples

Your files use Indian Standard Time (IST = UTC+5:30):

```
File: ziggy-ir-board_20260201_070526.json
│                     │      │  └─ Seconds: 26
│                     │      └──── Minutes: 05
│                     └─────────── Hours: 07 (7:05:26 AM IST)
│
└─────────────────────────────── Date: Feb 1, 2026

Full timestamp: February 1, 2026 at 7:05:26 AM IST
```

## Quick Reference Commands

```bash
# Parse with default prefix
npm run parse

# Parse with custom prefix
node parser.js "your-prefix"

# View latest
cat output/latest.json

# List all versions
ls -lht output/

# Count total versions
ls output/*.json | grep -v latest | wc -l

# Find specific version
ls output/ | grep "v1.0"

# Remove old versions (keep last 5)
cd output && ls -t *.json | grep -v latest | tail -n +6 | xargs rm
```

## Tips

1. **Use descriptive prefixes**: `ir-control-10ch` better than `test1`
2. **Include version numbers**: `board-v1.2` helps track progress
3. **Keep naming consistent**: Pick a scheme and stick with it
4. **Archive important versions**: Don't delete milestone files
5. **Document changes**: Keep notes of what changed between versions

## Output Directory Structure

After a few design sessions:

```
output/
├── latest.json                           # Always the newest
├── prototype-v1_20260201_090000.json     # Morning session
├── prototype-v2_20260201_140000.json     # Afternoon updates
├── prototype-v3_20260201_180000.json     # Evening refinements
├── beta-1_20260205_100000.json           # Beta milestone
├── beta-2_20260210_100000.json           # Beta update
└── production_20260215_100000.json       # Final release
```

Each file is a complete snapshot of your design at that moment!
