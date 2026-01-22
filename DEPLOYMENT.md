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
   - Key: `SESSION_SECRET`
   - Value: (generate a random string, e.g., run `openssl rand -base64 32` in terminal)
   - Optional: `NODE_ENV=production` (recommended)
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

### Option 2: Railway.app (Requires Paid Plan for Web Services)
⚠️ **Note:** Railway's free tier only supports databases, not web services. You'll need to upgrade to deploy this app.

### Option 3: Fly.io (Free tier available)
1. Install Fly CLI: `npm install -g @fly/cli`
2. Sign up at https://fly.io
3. Run: `fly launch` in project directory
4. Set environment variables: `fly secrets set SESSION_SECRET=your-random-secret`
5. Deploy: `fly deploy`

## Security Setup

### Setting Environment Variables

**Required:**
- `SESSION_SECRET` - A random secret string for session encryption
  - Generate one: `openssl rand -base64 32` (in terminal)
  - Or use any long random string

**Email Service (Resend) - Required for email features:**
- `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
  - Get it from https://resend.com/api-keys
- `RESEND_FROM_EMAIL` - The email address to send from
  - For testing: `onboarding@resend.dev` (no verification needed)
  - For production: Use your verified domain (e.g., `noreply@yourdomain.com`)
- `BASE_URL` - Your application's public URL
  - Example: `https://budget-sensei.onrender.com`
  - Used in email links (password reset, verification, etc.)

**Optional but Recommended:**
- `NODE_ENV=production` - Enables production optimizations and secure cookies

**Local testing:**
```bash
# Windows PowerShell
$env:SESSION_SECRET="your-random-secret-string"
$env:NODE_ENV="production"
npm start

# Linux/Mac
export SESSION_SECRET="your-random-secret-string"
export NODE_ENV="production"
npm start
```

**On hosting platform:**
- Add `SESSION_SECRET` as an environment variable in your hosting dashboard
- Generate a secure random string (use `openssl rand -base64 32`)

### Accessing the App
- The app uses username/password authentication
- Default admin account: `admin` / `likes5578`
- You can register new accounts or change the admin password

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

1. Choose a hosting platform (Render recommended for free tier)
2. Push your code to GitHub
3. Connect GitHub to the hosting platform
4. Set the `SESSION_SECRET` environment variable (generate with `openssl rand -base64 32`)
5. Set up persistent storage (mount `/data` disk on Render)
6. Deploy!

Your app will be accessible from anywhere with HTTPS and secure authentication.

