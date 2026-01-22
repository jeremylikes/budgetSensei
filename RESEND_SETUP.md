# Resend Email Setup Guide

This guide will walk you through setting up Resend as your email service provider for BudgetSensei.

## Step 1: Get Your Resend API Key

1. Go to [Resend.com](https://resend.com) and sign up/login
2. Navigate to **API Keys** in your dashboard
3. Click **Create API Key**
4. Give it a name (e.g., "BudgetSensei Production")
5. Copy the API key (it starts with `re_`)

## Step 2: Set Up Your Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
# Resend API Key (required)
RESEND_API_KEY=re_your_actual_api_key_here

# From Email Address (required)
# For testing: onboarding@resend.dev (Resend's test domain)
# For production: Use your verified domain (e.g., noreply@yourdomain.com)
RESEND_FROM_EMAIL=onboarding@resend.dev

# Application Base URL (for email links)
BASE_URL=http://localhost:3000
```

## Step 3: Verify Your Domain (Production Only)

For production use, you'll need to verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain registrar
5. Wait for verification (usually takes a few minutes)
6. Once verified, update `RESEND_FROM_EMAIL` to use your domain:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**Note:** For development/testing, you can use `onboarding@resend.dev` without domain verification.

## Step 4: Test the Integration

1. Make sure your `.env` file is configured
2. Restart your server
3. The email service will automatically initialize when the server starts
4. Check the console logs - you should see "Resend initialized" or a warning if the API key is missing

## Available Email Functions

The email service now includes:

- **`sendWelcomeEmail(email, username, baseUrl)`** - Sent when a new user creates an account
- **`sendPasswordResetEmail(email, resetToken, baseUrl)`** - Sent when a user requests a password reset
- **`sendVerificationEmail(email, verificationToken, baseUrl)`** - Sent when a user needs to verify their email

## Usage Example

```javascript
const { sendWelcomeEmail } = require('./utils/email');

// In your registration route
await sendWelcomeEmail(userEmail, username, process.env.BASE_URL || 'http://localhost:3000');
```

## Troubleshooting

### "Resend API key not configured"
- Make sure your `.env` file exists and contains `RESEND_API_KEY`
- Restart your server after adding environment variables
- Check that the API key starts with `re_`

### "Email sending failed"
- Verify your API key is correct in Resend dashboard
- Check that `RESEND_FROM_EMAIL` is a verified email/domain
- For testing, use `onboarding@resend.dev`
- Check Resend dashboard for error logs

### Emails not received
- Check spam folder
- Verify the recipient email address is correct
- Check Resend dashboard for delivery status
- Ensure your domain is verified (for production)

## Security Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- Keep your API key secret
- Rotate API keys if they're compromised
- Use different API keys for development and production

## Next Steps

1. ✅ Set up your `.env` file with the API key
2. ✅ Test email sending in development
3. ⏳ Verify your domain for production
4. ⏳ Integrate welcome emails into registration flow
5. ⏳ Implement password reset functionality
6. ⏳ Add email verification feature
