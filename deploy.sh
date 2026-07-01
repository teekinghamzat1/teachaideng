#!/bin/bash
set -e

echo "===== DEPLOY START ====="

PROJECT_DIR="/www/wwwroot/teachaide-ai"
APP_NAME="teachaide-ai"
BRANCH="main"

cd "$PROJECT_DIR" || { echo "Project directory not found"; exit 1; }

# ── Backup env files before git clean wipes them ──────────────────────────────
echo "Backing up .env files..."
cp .env.production /tmp/.env.production.bak 2>/dev/null || echo "No .env.production to back up"
cp backend/.env /tmp/.env.backend.bak 2>/dev/null || echo "No backend/.env to back up"

echo "Fetching latest code from GitHub..."
git fetch origin

echo "Resetting to origin/$BRANCH..."
git reset --hard origin/$BRANCH
git clean -fd

# ── Restore env files ──────────────────────────────────────────────────────────
echo "Restoring .env files..."
cp /tmp/.env.production.bak .env.production 2>/dev/null || echo "WARNING: .env.production not found. API calls may break!"
cp /tmp/.env.backend.bak backend/.env 2>/dev/null || echo "WARNING: backend/.env not found. Backend may not start correctly!"

# ── Validate .env.production exists ───────────────────────────────────────────
if [ ! -f ".env.production" ]; then
  echo ""
  echo "⚠️  ERROR: .env.production is missing!"
  echo "   Create it on the VPS with:"
  echo "   echo 'VITE_API_URL=https://teachaide.ng/api' > /www/wwwroot/teachaide-ai/.env.production"
  echo ""
  exit 1
fi

echo "Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Fixing script permissions..."
chmod -R +x node_modules/.bin || true

echo "Building frontend (baking in VITE_API_URL)..."
npm run build

echo "Restarting PM2 app..."
pm2 restart "$APP_NAME" || pm2 start backend/server.js --name "$APP_NAME"

pm2 save

echo "===== DEPLOY COMPLETE ====="
