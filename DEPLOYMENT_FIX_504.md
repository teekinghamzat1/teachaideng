# 504 Timeout Fix - Deployment Instructions

## Problem Summary
Your VPS is experiencing 504 Gateway Timeout errors when:
1. Users try to log in
2. Admin dashboard loads
3. Branding settings are fetched

This is caused by slow database queries that exceed Nginx's default 60-second timeout.

## Changes Made

### 1. Database Optimizations
- **Added indexes** to speed up queries on `User` and `UsageLog` tables
- **Parallelized queries** in admin dashboard to fetch all stats simultaneously
- **Removed N+1 query pattern** in user list endpoint (was doing DB writes for every user)

### 2. Branding Endpoint Fix
- Added **5-minute in-memory cache** to prevent repeated slow queries
- Added **fallback mechanisms** to return defaults if DB is slow
- **Parallelized** user count and settings fetch

### 3. Admin Controller Optimizations
- Dashboard stats now fetch in parallel (7 queries → 1 parallel batch)
- User list no longer performs individual usage resets (major bottleneck removed)
- Settings fetched once and reused for all users

## Deployment Steps (CRITICAL - Must Follow in Order)

### Step 1: Stop Your Backend Server
On your VPS, stop the Node.js backend:
```bash
pm2 stop backend
# OR if using systemd:
sudo systemctl stop teachaide-backend
```

### Step 2: Pull Latest Code
```bash
cd /path/to/teachaide-ai
git pull origin main
```

### Step 3: Install Dependencies (if needed)
```bash
cd backend
npm install
```

### Step 4: Apply Database Migrations
This adds the critical indexes:
```bash
cd backend
npx prisma generate
npx prisma db push
```

**IMPORTANT**: The `db push` command will add indexes without losing data. This is safe.

### Step 5: Restart Backend
```bash
pm2 restart backend
# OR
sudo systemctl restart teachaide-backend
```

### Step 6: Verify
Test these endpoints:
- `https://yourdomain.com/api/branding` - Should return JSON quickly
- `https://yourdomain.com/api/admin/dashboard` - Should load stats quickly
- Login should work without 504 errors

## Expected Performance Improvements

### Before:
- Dashboard load: 30-60+ seconds (timeout)
- User list: 20-40+ seconds (timeout)
- Branding: 5-10 seconds (timeout)

### After:
- Dashboard load: 1-3 seconds
- User list: 2-5 seconds
- Branding: <1 second (cached), 2-3 seconds (first load)

## Indexes Added

```prisma
// User model
@@index([subscriptionPlan])
@@index([schoolId])
@@index([role])

// UsageLog model
@@index([action, createdAt])
@@index([userId, action])
@@index([schoolId, action])
```

These indexes dramatically speed up:
- Counting users by subscription plan
- Filtering users by school
- Counting lesson generations
- Admin analytics queries

## Troubleshooting

### If you still see 504 errors:

1. **Check Nginx timeout settings** (on your VPS):
```bash
sudo nano /etc/nginx/sites-available/teachaide
```

Add these lines inside the `location /api/` block:
```nginx
proxy_read_timeout 120s;
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
```

Then reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

2. **Check database connection pool**:
Your DATABASE_URL should have connection pooling enabled. If you have many concurrent users, add this to your `.env`:
```
DATABASE_URL=postgresql://teachaide:password@localhost:5432/teachaide?schema=public&connection_limit=20&pool_timeout=20
```

3. **Monitor database performance**:
```bash
# Check if indexes were created
psql -U teachaide -d teachaide -c "\d+ \"User\""
psql -U teachaide -d teachaide -c "\d+ \"UsageLog\""
```

You should see the new indexes listed.

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:
```bash
cd backend
git checkout HEAD~1 prisma/schema.prisma
npx prisma generate
npx prisma db push
pm2 restart backend
```

## Additional Recommendations

1. **Set up a cron job** to reset monthly usage (prevents manual resets during user list loads):
```bash
# Add to crontab
0 0 1 * * cd /path/to/teachaide-ai/backend && node scripts/reset-monthly-usage.js
```

2. **Monitor your database size**:
```bash
psql -U teachaide -d teachaide -c "SELECT pg_size_pretty(pg_database_size('teachaide'));"
```

3. **Consider upgrading your VPS** if you have:
- More than 10,000 users
- More than 100,000 usage log entries
- Less than 2GB RAM on your server

## Files Modified

1. `backend/src/controllers/adminController.js` - Optimized dashboard and user list
2. `backend/src/controllers/brandingController.js` - Added caching and error handling
3. `backend/prisma/schema.prisma` - Added database indexes
4. `pages/Dashboard.tsx` - Fixed notification badge counts
5. `components/Layout.tsx` - Improved notification UI and mark-as-read functionality

## Contact

If you continue to experience issues after following these steps, check:
1. Backend logs: `pm2 logs backend`
2. Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Database logs: `sudo journalctl -u postgresql -f`
