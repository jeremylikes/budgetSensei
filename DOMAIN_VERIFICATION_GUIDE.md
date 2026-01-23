# Domain Verification Guide for Resend

To send emails to **any email address** (Gmail, Outlook, Yahoo, etc.), you need to verify your own domain in Resend. This guide walks you through the process.

## Why Domain Verification is Needed

When using Resend's test domain (`onboarding@resend.dev`), you can only send emails to the email address associated with your Resend account. To send emails to **any recipient**, you must:

1. Own a domain (e.g., `yourdomain.com`)
2. Verify it in Resend
3. Use an email address from that domain as your "from" address

## Step 1: Get a Domain (If You Don't Have One)

If you don't already own a domain, you can purchase one from:
- **Namecheap** (https://www.namecheap.com) - ~$10-15/year
- **Google Domains** (https://domains.google) - ~$12/year
- **Cloudflare** (https://www.cloudflare.com/products/registrar) - ~$8-10/year
- **GoDaddy** (https://www.godaddy.com) - ~$12-15/year

**Note:** You only need the domain for email - you don't need to host a website on it.

## Step 2: Verify Your Domain in Resend

1. **Go to Resend Dashboard**
   - Visit https://resend.com
   - Log in to your account
   - Navigate to **"Domains"** in the left sidebar

2. **Add Your Domain**
   - Click **"Add Domain"** button
   - Enter your domain (e.g., `yourdomain.com` - without `www` or `http://`)
   - Click **"Add"**

3. **Get DNS Records**
   - Resend will show you DNS records that need to be added to your domain
   - **Important:** DKIM, SPF, and DMARC are email authentication protocols that use **TXT records** (not separate record types). In your domain registrar, you'll select "TXT Record" from the dropdown.
   - You'll typically need:
     - **DKIM:** TXT record (Host: `resend._domainkey`) - **Required**
     - **SPF:** TXT record (Host: `send`) - **Required**
     - **SPF MX:** MX record (Host: `send`) - **Optional** (for receiving bounce/feedback emails)
     - **DMARC:** TXT record (Host: `_dmarc`) - Optional but recommended

4. **Add DNS Records to Your Domain**

   **Important:** DKIM, SPF, and DMARC are not DNS record types - they are email authentication protocols that use **TXT records** (and sometimes **MX records**). In your domain registrar, you'll select "TXT Record" or "MX Record" from the dropdown.

   ### For Namecheap (Step-by-Step):

   1. **Go to Namecheap Advanced DNS**
      - Log in to Namecheap
      - Go to **Domain List** → Click **Manage** next to your domain
      - Click the **"Advanced DNS"** tab

   2. **Add DKIM Record (TXT)**
      - In the "Host Records" section, click the dropdown that says **"A Record"**
      - Select **"TXT Record"** from the dropdown
      - **Host:** Enter `resend._domainkey` (exactly as Resend shows)
      - **Value:** Copy the entire value from Resend (it's a long string starting with `p=MIGfMA0GCSqGSIb3...`)
      - **TTL:** Leave as "Automatic" or set to 30 min
      - Click the green checkmark ✓ to save

   3. **Add SPF Record (TXT)**
      - Click **"ADD NEW RECORD"** button
      - Select **"TXT Record"** from the dropdown
      - **Host:** Enter `send` (exactly as Resend shows)
      - **Value:** Copy the entire value from Resend (starts with `v=spf1 include:amazonses.com...`)
      - **TTL:** Leave as "Automatic" or set to 30 min
      - Click the green checkmark ✓ to save

   4. **Add SPF MX Record (Optional but Recommended)**
      
      **Note:** The MX record is used for receiving bounce/feedback emails. If you can't add it, you can still send emails, but you won't receive bounce notifications.
      
      **Option A: If MX Record appears in Host Records dropdown**
      - Click **"ADD NEW RECORD"** button
      - Click the dropdown to open it
      - Scroll down in the dropdown menu - "MX Record" should be below TXT Record, URL Redirect Record, etc.
      - If you see it, select **"MX Record"** from the dropdown
      - **Host:** Enter `send` (exactly as Resend shows)
      - **Value:** Copy the value from Resend (looks like `feedback-smtp.us-east-1.amazonses.com`)
      - **Priority:** Enter `10` (the number Resend provides)
      - **TTL:** Leave as "Automatic" or set to 30 min
      - Click the green checkmark ✓ to save
      
      **Option B: If MX Record is not in the dropdown**
      - Some Namecheap accounts may not show MX records in the Host Records section
      - **You can skip this record** - it's optional for sending emails
      - The TXT records (DKIM and SPF) are the essential ones for email authentication
      - You'll still be able to send emails, but won't receive bounce/feedback notifications
      - Resend will still verify your domain with just the TXT records

   5. **Add DMARC Record (TXT) - Optional but Recommended**
      - Click **"ADD NEW RECORD"** button
      - Select **"TXT Record"** from the dropdown
      - **Host:** Enter `_dmarc` (exactly as Resend shows)
      - **Value:** Copy the value from Resend (looks like `v=DMARC1; p=none;`)
      - **TTL:** Leave as "Automatic" or set to 30 min
      - Click the green checkmark ✓ to save

   6. **Save All Changes**
      - After adding all records, click the green **"SAVE ALL CHANGES"** button at the bottom
      - Namecheap will confirm the changes

   **Important Notes:**
   - Copy the **exact** values from Resend - don't modify them
   - The "Host" field in Namecheap corresponds to the "Host" or "Name" field in Resend
   - For the root domain (`@`), leave the Host field empty or use `@` (depending on Namecheap's interface)
   - DNS changes can take 5-30 minutes to propagate

5. **Wait for Verification**
   - DNS changes can take a few minutes to a few hours to propagate
   - Resend will automatically check and verify your domain
   - You'll see a "Verified" status in the Resend dashboard when it's ready
   - Usually takes 5-30 minutes, but can take up to 24 hours

## Step 3: Update Your Environment Variables

Once your domain is verified, update your `RESEND_FROM_EMAIL`:

### For Local Development (.env file):
```env
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Note:** You can use any email address from your verified domain:
- `noreply@yourdomain.com`
- `hello@yourdomain.com`
- `support@yourdomain.com`
- etc.

### For Render Deployment:
1. Go to your Render dashboard
2. Navigate to your service → **Environment** tab
3. Find `RESEND_FROM_EMAIL`
4. Update it to: `noreply@yourdomain.com` (or your preferred email)
5. Click **"Save Changes"**
6. Render will automatically redeploy

## Step 4: Test It

1. Restart your local server (if testing locally)
2. Try registering a new account with any email address
3. The verification email should now be sent successfully

## Troubleshooting

### "Domain not verified" error
- Check that all DNS records are added correctly
- Wait a bit longer for DNS propagation (can take up to 24 hours)
- Verify the records in Resend dashboard match what you added

### "Invalid from address" error
- Make sure the email address uses your verified domain
- Check that the domain shows as "Verified" in Resend dashboard

### Emails still not sending
- Verify `RESEND_FROM_EMAIL` is set correctly
- Check server logs for specific error messages
- Ensure your Resend API key is valid

## Cost Considerations

- **Domain:** ~$10-15/year (one-time purchase)
- **Resend:** Free tier includes 3,000 emails/month, then $20/month for 50,000 emails

## Alternative: Use Your Existing Domain

If you already own a domain (even if it's used for a website), you can:
1. Add the Resend DNS records to your existing domain
2. Use an email like `noreply@yourdomain.com` for BudgetSensei
3. This won't interfere with your website or existing email

## Quick Checklist

- [ ] Purchase a domain (if needed)
- [ ] Add domain to Resend dashboard
- [ ] Add all DNS records to your domain registrar
- [ ] Wait for verification (check Resend dashboard)
- [ ] Update `RESEND_FROM_EMAIL` in `.env` (local) and Render (production)
- [ ] Restart server and test

Once verified, you'll be able to send emails to **any email address**!
