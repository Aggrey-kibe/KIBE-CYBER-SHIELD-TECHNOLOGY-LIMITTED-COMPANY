#!/bin/bash
# ============================================================
# KIBE CYBERSHIELD PLATFORM — Startup Script
# Usage: bash run.sh [dev|prod]
# ============================================================

set -e

MODE=${1:-dev}

echo "═══════════════════════════════════════════════"
echo "  Kibe CyberShield Platform"
echo "  Kibe CyberShield Technologies Ltd | Nakuru, Kenya"
echo "═══════════════════════════════════════════════"
echo ""

# Load .env if it exists
if [ -f .env ]; then
    echo "Loading .env configuration..."
    export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
fi

# Install dependencies
echo "Checking dependencies..."
pip install -r requirements.txt --quiet

# Initialize database
echo "Initializing database..."
python3 -c "from app import init_db; init_db()"

if [ "$MODE" = "prod" ]; then
    echo ""
    echo "Starting production server (gunicorn)..."
    echo "Access: http://0.0.0.0:${PORT:-5000}"
    echo ""
    exec gunicorn \
        --workers 4 \
        --bind "0.0.0.0:${PORT:-5000}" \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        app:app
else
    echo ""
    echo "Starting development server..."
    echo "Access: http://localhost:${PORT:-5000}"
    echo ""
    export KCS_DEBUG=true
    exec python3 app.py
fi
