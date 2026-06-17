#!/bin/bash
set -e

# Determine the app root (where this script lives)
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start the Python backend on port 8000 in the background
echo "Starting Python backend on port 8000..."
cd "$APP_DIR/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Return to app root
cd "$APP_DIR"

# Wait a moment for the backend to initialise
sleep 2

# Start Caddy in the foreground (it binds to $PORT)
echo "Starting Caddy on port ${PORT:-80}..."
caddy run --config "$APP_DIR/Caddyfile" --adapter caddyfile

# If Caddy exits, kill the backend too
kill $BACKEND_PID 2>/dev/null || true
