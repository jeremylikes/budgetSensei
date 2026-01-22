# Setting Up Environment Variables in Render

This guide shows you exactly how to add the Resend API key and other environment variables in Render's dashboard.

## Step-by-Step Instructions

### 1. Access Your Render Dashboard
1. Go to https://render.com and log in
2. Click on your **budget-sensei** service (or whatever you named it)

### 2. Navigate to Environment Variables
1. In your service dashboard, click on the **"Environment"** tab (in the left sidebar)
2. You'll see a section called **"Environment Variables"**

### 3. Add Required Variables

Click **"Add Environment Variable"** for each of these:

#### Required Variables:

1. **SESSION_SECRET**
   - **Key:** `SESSION_SECRET`
   - **Value:** Generate a random string (run `openssl rand -base64 32` in terminal, or use any long random string)
   - **Example:** `aB3xK9mP2qR7vT5wY8zA1bC4dE6fG0hI3jK5lM8nO1pQ4rS7tU0vW3xY6zA9`

2. **RESEND_API_KEY**
   - **Key:** `RESEND_API_KEY`
   - **Value:** Your Resend API key (starts with `re_`)
   - **Where to get it:** https://resend.com → Dashboard → API Keys → Copy your key
   - **Example:** `re_1234567890abcdefghijklmnopqrstuvwxyz`

3. **RESEND_FROM_EMAIL**
   - **Key:** `RESEND_FROM_EMAIL`
   - **Value:** 
     - **For testing:** `onboarding@resend.dev` (no verification needed)
     - **For production:** Your verified domain email (e.g., `noreply@yourdomain.com`)
   - **Note:** For production, you must verify your domain in Resend first

4. **BASE_URL**
   - **Key:** `BASE_URL`
   - **Value:** Your Render service URL
   - **Example:** `https://budget-sensei.onrender.com`
   - **Note:** This is used in email links (password reset, verification, etc.)

#### Optional (Recommended):

5. **NODE_ENV**
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - **Why:** Enables production optimizations and secure cookies

### 4. Save and Redeploy

1. After adding all variables, click **"Save Changes"**
2. Render will automatically trigger a new deployment
3. Wait for the deployment to complete (usually 2-5 minutes)

### 5. Verify It's Working

1. Check the deployment logs in Render
2. Look for any warnings about missing environment variables
3. If you see "Resend API key not configured", double-check that `RESEND_API_KEY` is set correctly

## Quick Checklist

- [ ] `SESSION_SECRET` - Random secret string
- [ ] `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
- [ ] `RESEND_FROM_EMAIL` - Email address (use `onboarding@resend.dev` for testing)
- [ ] `BASE_URL` - Your Render service URL
- [ ] `NODE_ENV` - Set to `production` (optional but recommended)

## Troubleshooting

### "Resend API key not configured" in logs
- Make sure `RESEND_API_KEY` is set in Render's environment variables
- Check that the key starts with `re_`
- Redeploy after adding the variable

### Emails not sending
- Verify `RESEND_API_KEY` is correct in Resend dashboard
- Check that `RESEND_FROM_EMAIL` is a verified email/domain
- For testing, use `onboarding@resend.dev`
- Check Resend dashboard for error logs

### Environment variables not taking effect
- Make sure you clicked "Save Changes" after adding variables
- Wait for the automatic redeployment to complete
- Check that variable names match exactly (case-sensitive)

## Security Notes

- ✅ Environment variables in Render are encrypted and secure
- ✅ Never commit your `.env` file or API keys to Git
- ✅ Use different API keys for development and production
- ✅ Rotate API keys if they're compromised

## Alternative: Using render.yaml

If you prefer to manage environment variables in code (not recommended for secrets), you can add them to `render.yaml`:

```yaml
envVars:
  - key: RESEND_API_KEY
    sync: false  # This means you must set the value in Render dashboard
```

**Note:** Even with `sync: false`, you still need to set the actual value in Render's dashboard. The `render.yaml` just documents which variables are needed.
