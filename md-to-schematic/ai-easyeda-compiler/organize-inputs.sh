#!/bin/bash

# Organize inputs/ folder - Move files to correct locations

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ORGANIZING INPUTS FOLDER                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "/Users/zigg/Desktop/Zigg2.0/PCBProjects/md-to-schematic/ai-easyeda-compiler"

# Create reference folders if they don't exist
mkdir -p pdf/datasheets-manual
mkdir -p reference-images

echo "📦 Moving PDF datasheets to pdf/datasheets-manual/..."
mv inputs/*.pdf pdf/datasheets-manual/ 2>/dev/null && echo "   ✓ Moved all PDFs" || echo "   ℹ️  No PDFs to move"

echo ""
echo "🖼️  Moving images to reference-images/..."
mv inputs/*.jpg reference-images/ 2>/dev/null && echo "   ✓ Moved all JPGs" || echo "   ℹ️  No JPGs to move"

echo ""
echo "📋 Files remaining in inputs/:"
ls -lh inputs/

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ORGANIZATION COMPLETE                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ PDFs moved to: pdf/datasheets-manual/"
echo "✅ Images moved to: reference-images/"
echo ""
echo "📝 Only .md files should remain in inputs/"
echo ""
