#!/bin/bash

# Multi-Model AI Setup Script for PCB Design
# This script installs all required AI models for the PCB design system

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║       PCB Design Multi-Model AI Setup                                     ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Ollama is installed
echo -e "${BLUE}🔍 Checking Ollama installation...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed!${NC}"
    echo ""
    echo "Please install Ollama first:"
    echo "  Visit: https://ollama.ai"
    echo "  Or run: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}✅ Ollama is installed${NC}"
echo ""

# Check if Ollama is running
echo -e "${BLUE}🔍 Checking if Ollama is running...${NC}"
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama is not running${NC}"
    echo "Starting Ollama server..."
    echo ""
    echo "Please run this in a separate terminal:"
    echo "  ${YELLOW}ollama serve${NC}"
    echo ""
    echo "Press Enter when Ollama is running..."
    read
fi

echo -e "${GREEN}✅ Ollama is running${NC}"
echo ""

# Function to check if model is installed
check_model() {
    local model=$1
    if ollama list | grep -q "^$model"; then
        return 0
    else
        return 1
    fi
}

# Function to install model with progress
install_model() {
    local model=$1
    local name=$2
    local purpose=$3
    
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║  Installing: $name"
    echo "║  Purpose: $purpose"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    
    if check_model "$model"; then
        echo -e "${GREEN}✅ $model already installed${NC}"
        echo ""
        return 0
    fi
    
    echo -e "${BLUE}📥 Downloading $model...${NC}"
    echo "   (This may take 5-15 minutes depending on your connection)"
    echo ""
    
    if ollama pull "$model"; then
        echo ""
        echo -e "${GREEN}✅ Successfully installed $model${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Failed to install $model${NC}"
        echo "   Please try manually: ollama pull $model"
        echo ""
        return 1
    fi
}

# Install DeepSeek-R1 7B
install_model "deepseek-r1:7b" "DeepSeek-R1 7B" "Deep reasoning and analysis"

# Install Llama 3.1 8B
install_model "llama3.1:8b" "Llama 3.1 8B" "Design collaboration and suggestions"

# Install Phi-4 14B
install_model "phi4:14b" "Phi-4 14B" "Precise component calculations"

# Verify all models
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║  Verification                                                              ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

ALL_INSTALLED=true

echo "Installed Models:"
echo ""

if check_model "deepseek-r1:7b"; then
    echo -e "  ${GREEN}✅ DeepSeek-R1 7B${NC}     - Deep reasoning"
else
    echo -e "  ${RED}❌ DeepSeek-R1 7B${NC}     - Missing"
    ALL_INSTALLED=false
fi

if check_model "llama3.1:8b"; then
    echo -e "  ${GREEN}✅ Llama 3.1 8B${NC}       - Design partner"
else
    echo -e "  ${RED}❌ Llama 3.1 8B${NC}       - Missing"
    ALL_INSTALLED=false
fi

if check_model "phi4:14b"; then
    echo -e "  ${GREEN}✅ Phi-4 14B${NC}          - Calculations"
else
    echo -e "  ${RED}❌ Phi-4 14B${NC}          - Missing"
    ALL_INSTALLED=false
fi

echo ""

if [ "$ALL_INSTALLED" = true ]; then
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║  🎉 SETUP COMPLETE!                                                       ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "All models installed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Test the system:"
    echo "     ${BLUE}npm run multi-check${NC}"
    echo ""
    echo "  2. Try a complete design workflow:"
    echo "     ${BLUE}npm run multi-workflow -- \"your PCB idea\"${NC}"
    echo ""
    echo "  3. View datasheets:"
    echo "     ${BLUE}npm run datasheet-list${NC}"
    echo ""
    echo "  4. Read the guide:"
    echo "     ${BLUE}cat MULTI-MODEL-GUIDE.md${NC}"
    echo ""
    echo "Happy designing! 🚀"
    echo ""
else
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  SETUP INCOMPLETE                                                     ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Some models failed to install."
    echo ""
    echo "You can install them manually:"
    echo "  ollama pull deepseek-r1:7b"
    echo "  ollama pull llama3.1:8b"
    echo "  ollama pull phi4:14b"
    echo ""
    exit 1
fi
