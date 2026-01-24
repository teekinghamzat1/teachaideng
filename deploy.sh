#!/bin/bash
set -e

echo "===== DEPLOY START ====="

PROJECT_DIR="/www/wwwroot/teachaide-ai"
APP_NAME="teachaide-ai"
BRANCH="main"

cd "$PROJECT_DIR" || { echo "Project directory not found"; exit 1; }

echo "Fetching latest code from GitHub..."
git fetch origin

echo "Resetting to origin/$BRANCH..."
git reset --hard origin/$BRANCH
git clean -fd

echo "Installing npm dependencies..."
npm install

if [ -f package.json ] && npm run | grep -q "build"; then
  echo "Fixing script permissions..."
  chmod -R +x node_modules/.bin || true
  echo "Building project..."
  npm run build
else
  echo "No build step found, skipping..."
fi

echo "Restarting PM2 app..."
pm2 restart "$APP_NAME" || pm2 start backend/server.js --name "$APP_NAME"

pm2 save

echo "===== DEPLOY COMPLETE ====="
