# Hostinger SMTP Configuration

## Update Your .env File

Add or update the following SMTP settings in your `backend/.env` file:

```env
# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=Adminsembuzz@1998
SMTP_FROM=admin@sembuzz.com
FRONTEND_URL=http://localhost:5173
```

## Complete .env File Example

Your complete `.env` file should look like this:

```env
# Database Configuration
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/sembuzz"

# JWT Configuration
JWT_SECRET="your-secret-key-change-in-production"

# Server Configuration
PORT=3000

# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@sembuzz.com
SMTP_PASS=Adminsembuzz@1998
SMTP_FROM=admin@sembuzz.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Email Service Configuration

The email service has been updated to use Hostinger SMTP settings:
- **Host**: `smtp.hostinger.com`
- **Port**: `587` (TLS)
- **Secure**: `false` (uses STARTTLS)
- **Authentication**: Uses the credentials from `.env`

## Testing Email Functionality

After updating your `.env` file:

1. **Restart the backend server** to load the new environment variables:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Create a test school** through the Super Admin dashboard:
   - Go to `/super-admin/schools/new`
   - Fill in the form
   - Submit
   - Check the admin email inbox for the onboarding email

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify the email and password are correct
2. **Check Hostinger email settings**: Make sure SMTP is enabled for your Hostinger email account
3. **Check server logs**: Look for error messages in the backend console
4. **Test SMTP connection**: You can test the SMTP connection using an email client

### Common Issues

- **"Authentication failed"**: Check your email and password
- **"Connection timeout"**: Verify `smtp.hostinger.com` is accessible
- **"Port blocked"**: Make sure port 587 is not blocked by firewall

## Email Template

The onboarding email includes:
- Login credentials (RefNum and Email as User ID)
- Temporary password
- School details (name, country, state, city, tenure, features)
- Login instructions
- Link to the login page

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Change the JWT_SECRET in production
- Consider using environment-specific SMTP credentials for production
