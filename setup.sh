#!/bin/bash
# ============================================================
# IntelliLaw Agent Sprint — Quick Start
# Run this ONCE from your IntelliLaw repo root
# ============================================================

echo "=== IntelliLaw Agent Sprint Setup ==="

# 1. Create and switch to your branch
echo "[1/5] Setting up git branch..."
git checkout -b feature/agentic-modules 2>/dev/null || git checkout feature/agentic-modules
echo "  ✓ On branch: feature/agentic-modules"

# 2. Create directory structure
echo "[2/5] Creating agent directory structure..."
mkdir -p agents/{core,tools,citation_agent,research_agent,drafter_agent,data,tests}
touch agents/__init__.py
touch agents/core/__init__.py
touch agents/tools/__init__.py
touch agents/citation_agent/__init__.py
touch agents/research_agent/__init__.py
touch agents/drafter_agent/__init__.py
touch agents/tests/__init__.py
echo "  ✓ Directory structure created"

# 3. Create .env file
echo "[3/5] Creating .env file..."
if [ ! -f agents/.env ]; then
cat > agents/.env << 'EOF'
OPENAI_API_KEY=sk-your-key-here
MONGODB_URI=mongodb://localhost:27017/intellilaw
PORT=8000
EOF
echo "  ✓ .env created (ADD YOUR OPENAI KEY!)"
else
echo "  ✓ .env already exists"
fi

# 4. Check Python
echo "[4/5] Checking Python..."
if command -v python3 &> /dev/null; then
    PYVER=$(python3 --version)
    echo "  ✓ Found: $PYVER"
else
    echo "  ✗ Python3 not found! Install Python 3.11+"
    exit 1
fi

# 5. Copy CLAUDE.md if provided
echo "[5/5] Setup complete!"
echo ""
echo "============================================"
echo "  NEXT STEPS:"
echo "============================================"
echo ""
echo "  1. Add your OpenAI API key to agents/.env"
echo "  2. Copy CLAUDE.md to your repo root"
echo "  3. Open terminal in repo root"
echo "  4. Run: claude"
echo "  5. Paste PROMPT 1 from PROMPTS.md"
echo ""
echo "  Time budget:"
echo "  • Prompt 1 (scaffold):    ~2 hrs"
echo "  • Prompt 2 (citations):   ~5 hrs"
echo "  • Prompt 3 (research):    ~7 hrs"
echo "  • Prompt 4 (drafter):     ~5 hrs"
echo "  • Prompt 5 (integration): ~5 hrs"
echo "  • Prompt 6 (testing):     ~5 hrs"
echo "============================================"
