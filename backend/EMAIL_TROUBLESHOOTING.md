# Email Troubleshooting Guide

## Issue: Email Not Received After Creating School

If you created a school but didn't receive the email, follow these steps:

### Step 1: Check Backend Console Logs

When you create a school, check the backend server console for email-related logs:

**Look for these log messages:**
- `[EmailService] Initializing SMTP transporter...`
- `[EmailService] SMTP Host: smtp.hostinger.com`
- `[EmailService] SMTP User: admin***` (should show first 3 chars)
- `[EmailService] SMTP Pass: ***SET***` (should show if password is set)
- `[EmailService] 📧 Attempting to send onboarding email to...`
- `[EmailService] ✅ Email sent successfully!` OR `[EmailService] ❌ Failed to send...`

### Step 2: Verify .env Configuration

Check your `backend/.env` file has these settings:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=Adminsembuzz@1998
SMTP_FROM=admin@sembuzz.com
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Make sure there are NO quotes around the values
- Make sure there are NO spaces before/after the `=` sign
- Make sure the password is correct (case-sensitive)

### Step 3: Restart Backend Server

After updating `.env`, you MUST restart the backend server:

```bash
cd backend
# Stop the server (Ctrl+C)
npm run start:dev
```

### Step 4: Common Issues and Solutions

#### Issue: "SMTP credentials not configured"
**Solution:** 
- Check your `.env` file exists in the `backend/` directory
- Verify `SMTP_USER` and `SMTP_PASS` are set
- Restart the server after updating `.env`

#### Issue: "Authentication failed"
**Possible causes:**
- Wrong email or password
- Email account not set up for SMTP
- Need to enable "Less secure app access" or use App Password

**Solution:**
- Verify credentials in Hostinger email settings
- Check if SMTP is enabled for your email account
- Try logging into webmail with the same credentials

#### Issue: "Connection timeout" or "ECONNREFUSED"
**Possible causes:**
- Wrong SMTP host
- Port blocked by firewall
- SMTP server down

**Solution:**
- Verify Hostinger SMTP settings:
  - Host: `smtp.hostinger.com`
  - Port: `587` (TLS) or `465` (SSL)
- Try port 465 with `secure: true` if 587 doesn't work

#### Issue: Email sent but not received
**Possible causes:**
- Email in spam/junk folder
- Wrong email address
- Email server delay

**Solution:**
- Check spam/junk folder
- Verify the email address is correct
- Wait a few minutes (some servers have delays)
- Check email server logs

### Step 5: Test Email Configuration

You can test the email configuration by checking the backend logs when creating a school:

1. Create a new school
2. Watch the backend console for email logs
3. Look for success or error messages

### Step 6: Alternative SMTP Settings for Hostinger

If port 587 doesn't work, try port 465 with SSL:

Update `.env`:
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
```

And update `email.service.ts`:
```typescript
secure: true, // true for 465, false for other ports
```

### Step 7: Manual Email Check

If email sending fails, the console will log:
- The recipient email
- The reference number
- The temporary password

You can manually send this information to the school admin.

### Step 8: Verify Email in Database

Check if the school was created successfully:

1. Check the schools table in phpMyAdmin
2. Verify the admin email is correct
3. Check the `school_admins` table for the admin record

### Still Not Working?

1. **Check Hostinger Email Settings:**
   - Log into Hostinger control panel
   - Verify SMTP is enabled for your email account
   - Check if there are any restrictions

2. **Test with a Different Email Client:**
   - Try sending an email from the same account using an email client
   - This verifies the SMTP credentials work

3. **Contact Hostinger Support:**
   - Ask them to verify SMTP settings
   - Confirm the correct host, port, and authentication method

### Debug Mode

The email service now has enhanced logging. All email operations are logged to the console with detailed information.
