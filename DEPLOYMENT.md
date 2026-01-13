# Deployment Guide for Budget Sensei

## Simplest Options (Recommended)

### Option 1: Render.com (Best Free Option - Web Services Supported)
1. Sign up at https://render.com (free tier supports web services)
2. Click "New" → "Web Service"
3. Connect your GitHub account and select this repository
4. Settings:
   - **Name:** budget-sensei (or any name)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free (or paid if you want)
5. Click "Advanced" → "Add Environment Variable":
   - Key: `BUDGET_PASSWORD`
   - Value: (your desired password)
6. **IMPORTANT - Set up Persistent Storage:**
   - Go to your service settings
   - Click "Disks" tab
   - Click "Mount New Disk"
   - Name: `data`
   - Mount Path: `/data`
   - Size: 1GB (minimum, adjust as needed)
   - Click "Mount Disk"
   - The database will automatically be stored in `/data` and persist across deployments
7. Click "Create Web Service"
8. Render will deploy and give you a URL like `https://budget-sensei.onrender.com`
9. **Note:** Free tier services spin down after 15 minutes of inactivity, but spin up automatically on first request (may take 30-60 seconds)

### Option 2: Railway.app (Requires Paid Plan for Web Services)
⚠️ **Note:** Railway's free tier only supports databases, not web services. You'll need to upgrade to deploy this app.

### Option 2: Render.com (Free tier available)
1. Sign up at https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables: Add `BUDGET_PASSWORD=yourpassword`
5. Deploy - Render gives you a URL like `https://your-app.onrender.com`

### Option 3: Fly.io (Free tier available)
1. Install Fly CLI: `npm install -g @fly/cli`
2. Sign up at https://fly.io
3. Run: `fly launch` in project directory
4. Set password: `fly secrets set BUDGET_PASSWORD=yourpassword`
5. Deploy: `fly deploy`

## Security Setup

### Setting a Password
The app uses basic HTTP authentication. Set the password via environment variable:

**Local testing:**
```bash
# Windows PowerShell
$env:BUDGET_PASSWORD="your-secure-password"
npm start

# Linux/Mac
export BUDGET_PASSWORD="your-secure-password"
npm start
```

**On hosting platform:**
- Add `BUDGET_PASSWORD` as an environment variable in your hosting dashboard
- Use a strong password (12+ characters, mix of letters, numbers, symbols)

### Accessing the App
- Username: `admin`
- Password: (whatever you set in `BUDGET_PASSWORD`)

## Alternative: Deploy from Your Laptop (More Complex)

If you want to host from your laptop:

1. **Use ngrok** (simplest for testing):
   ```bash
   npm install -g ngrok
   npm start  # Start your server
   ngrok http 3000  # Creates public URL
   ```
   - Free tier gives you a random URL that changes each time
   - Paid tier gives you a fixed domain

2. **Port Forwarding + Dynamic DNS** (permanent but complex):
   - Forward port 3000 on your router
   - Set up dynamic DNS (No-IP, DuckDNS)
   - Less secure, requires keeping laptop on

**Recommendation:** Use Railway or Render - they're free, handle HTTPS automatically, and are much simpler.

## Database Persistence

**IMPORTANT:** The database file needs to be stored in a persistent location to survive deployments. The app automatically tries to use:
1. `/data` directory (if available - recommended for Render with persistent disk)
2. `/tmp` directory (if available - temporary but persists between deployments on some platforms)
3. Project directory (fallback for local development)

### Setting Up Persistent Storage

#### Render.com
1. In your service settings, go to "Disks" tab
2. Click "Mount New Disk"
3. Name: `data`, Mount Path: `/data`, Size: 1GB+
4. The database will automatically use `/data/budget.db`

#### Railway.app
Railway provides persistent storage automatically. The app will use `/tmp` or you can set `DB_PATH` environment variable to a custom path.

#### Custom Path
You can set the `DB_PATH` environment variable to specify exactly where to store the database:
- Add environment variable: `DB_PATH=/path/to/persistent/storage`
- The database file will be stored at: `${DB_PATH}/budget.db`

### Database Backup

Your `budget.db` file is stored in the persistent location. To backup:
- Download the database file from your hosting platform's persistent storage
- Or set up automated backups (most platforms offer this)
- The database file location is logged when the server starts: `Database file: /path/to/budget.db`

## Next Steps

1. Choose a hosting platform (Railway recommended for simplicity)
2. Push your code to GitHub
3. Connect GitHub to the hosting platform
4. Set the `BUDGET_PASSWORD` environment variable
5. Deploy!

Your app will be accessible from anywhere with HTTPS and password protection.

