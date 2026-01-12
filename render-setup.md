# Quick Render.com Setup Guide

## Step-by-Step Instructions

1. **Sign up at Render.com**
   - Go to https://render.com
   - Sign up with GitHub (easiest)

2. **Create New Web Service**
   - Click "New" button (top right)
   - Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select your `BudgetSensei` repository

3. **Configure the Service**
   - **Name:** `budget-sensei` (or any name you like)
   - **Region:** Choose closest to you (e.g., `Oregon (US West)`)
   - **Branch:** `main` (or `master`)
   - **Root Directory:** (leave blank - uses root)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free` (or upgrade if you want)

4. **Add Environment Variable**
   - Scroll down to "Environment Variables"
   - Click "Add Environment Variable"
   - **Key:** `BUDGET_PASSWORD`
   - **Value:** (enter your desired password)
   - Click "Add"

5. **Deploy**
   - Scroll to bottom
   - Click "Create Web Service"
   - Render will start building and deploying
   - Wait 2-3 minutes for deployment to complete

6. **Get Your URL**
   - Once deployed, you'll see a URL like: `https://budget-sensei.onrender.com`
   - Click it to open your app
   - You should see the login prompt (username: `admin`)

## Important Notes

- **Free Tier:** Services spin down after 15 min of inactivity
- **First Request:** May take 30-60 seconds to wake up (subsequent requests are fast)
- **Custom Domain:** You can add your own domain in Settings → Custom Domains
- **HTTPS:** Automatically included, no setup needed

## Troubleshooting

- **404 Error:** Wait for deployment to finish (check "Events" tab)
- **Can't Login:** Verify `BUDGET_PASSWORD` environment variable is set
- **Service Won't Start:** Check "Logs" tab for error messages

