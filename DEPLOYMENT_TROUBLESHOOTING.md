# Deployment Troubleshooting Guide

It seems your live VPS is not picking up the latest changes. This usually happens because the **process manager (PM2)** is still running the old code in memory, or the **deployment script** failed to run.

## Step 1: Check the Current Version
Visit your live API health endpoint in a browser:
`https://your-api-domain.com/api/health`

- **If you see** `"version": "1.2.0-comprehensive-lesson-fix"`:
  - The deployment SUCCEEDED. The issue might be browser caching. Try clearing cache or using Incognito mode.

- **If you DON'T see that version** (or see an old/different response):
  - The deployment FAILED or the server didn't restart. Proceed to Step 2.

## Step 2: Manual Fix on VPS (SSH)
Connect to your VPS via SSH and run these commands manually to force an update.

1. **Navigate to the project folder:**
   ```bash
   cd /www/wwwroot/teachaide-ai
   ```

2. **Pull the latest code manually:**
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```
   *(This ensures you have the code I just wrote)*

3. **Install dependencies (just in case):**
   ```bash
   npm install
   ```

4. **Restart the Backend Process:**
   This is the most critical step. PM2 needs to reload the code.
   ```bash
   pm2 restart teachaide-ai
   ```
   *If that says "process not found", run `pm2 list` to see the actual name, then restart that name.*

## Step 3: Verify the Webhook Listener
If you are using the `webhook-listener.cjs` I created earlier, ensure it is actually running.

1. **Check if listener is running:**
   ```bash
   pm2 list
   ```
   Look for `webhook-listener`.

2. **Check logs to see if it received the hook:**
   ```bash
   pm2 logs webhook-listener --lines 50
   ```
   You should see "Received webhook, deploying..."

## Summary
The most common cause is that `git pull` happened, but `pm2 restart` didn't happen or failed. Running Step 2 manually will fix it immediately.
