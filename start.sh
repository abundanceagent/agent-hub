#!/bin/bash
# Agent Hub — Local Setup & Launch
# Usage: bash start.sh

set -e

echo ""
echo "═══════════════════════════════════════"
echo "  Agent Hub — Starting up"
echo "═══════════════════════════════════════"
echo ""

# Always run from the directory containing this script
cd "$(dirname "$0")"

# Load .env if it exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded .env"
fi

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY is not set."
    echo "Create a .env file with: ANTHROPIC_API_KEY=sk-ant-..."
    exit 1
fi

# Find Python 3.10+
PYTHON=""
for cmd in python3.13 python3.12 python3.11 python3.10; do
    if command -v $cmd &>/dev/null; then
        PYTHON=$cmd
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "ERROR: Python 3.10+ is required. Install with: brew install python@3.11"
    exit 1
fi

echo "Using $($PYTHON --version)"

# Create virtual environment if it doesn't exist
VENV_DIR="$(dirname "$0")/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    $PYTHON -m venv "$VENV_DIR"
fi

# Use venv's python and pip
PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"

echo "Checking dependencies..."
$PIP install -q anthropic claude-agent-sdk fastapi "uvicorn[standard]" rich anyio python-dotenv

echo "Dependencies OK"
echo ""

# Kill any existing dashboard on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the dashboard
echo "Starting dashboard on http://localhost:8080 ..."
$PYTHON -m uvicorn dashboard:app --host 0.0.0.0 --port 8080 &
SERVER_PID=$!
sleep 2

open http://localhost:8080 2>/dev/null || echo "Open http://localhost:8080 in your browser"

echo ""
echo "═══════════════════════════════════════"
echo "  Dashboard: http://localhost:8080"
echo "  Press Ctrl+C to stop"
echo "═══════════════════════════════════════"
echo ""

wait $SERVER_PID
