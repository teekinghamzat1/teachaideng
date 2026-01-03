# Blog Module Setup Guide

I have successfully added the Blog module to your codebase! 🎉

## What's Included:
1.  **Frontend**:
    *   `/blog` - Blog Home (Lists all published posts)
    *   `/blog/:slug` - Single Post View (Rich header, formatted content)
2.  **Backend**:
    *   `BlogPost` Database Model (Title, Content, Slug, SEO fields, etc.)
    *   API Endpoint: `GET /api/blog` (Public)
    *   API Endpoint: `GET /api/blog/:slug` (Public)
    *   API Endpoint: `POST /api/blog` (Admin Protected)

## ⚠️ Important: Final Step on VPS

Since we changed the Database Schema (added `BlogPost` table), you MUST update the live database on your VPS.

**Run these commands on your VPS:**

```bash
# 1. Pull the new code
cd /www/wwwroot/teachaide-ai
git fetch origin
git reset --hard origin/main
npm install

# 2. Update the Database Schema
cd backend
npx prisma db push

# 3. Restart the Server
cd ..
pm2 restart teachaide-ai
```

## How to Manage Posts
GOOD NEWS! You now have a full **Admin Dashboard** to manage your blog.

1.  **Log in as Admin** on your site.
2.  Go to the **Admin Dashboard**.
3.  Click on the new **"Blog"** tab in the sidebar (if sidebar link is missing, go to `/admin/blog` directly).
4.  You can **Create**, **Edit**, **Delete**, and **Publish** posts visually.

No need for manual API calls anymore! 🎉

