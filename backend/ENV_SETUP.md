# Environment Setup Guide

## What is that API Key URL?

The URL you have (`prisma+postgres://...`) is from **Prisma Accelerate**, which is a cloud connection pooling service. Since you're using a **local MySQL database** created in phpMyAdmin, you need a **direct MySQL connection string** instead.

## How to Fix Your .env File

### Step 1: Open your `.env` file
Located at: `backend/.env`

### Step 2: Replace the DATABASE_URL

**Current (wrong):**
```env
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=..."
```

**Replace with (correct MySQL format):**
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/sembuzz"
```

### Step 3: Fill in Your MySQL Credentials

Replace these values:
- `root` - Your MySQL username (usually `root` for local)
- `YOUR_PASSWORD` - Your MySQL password (leave empty if no password: `mysql://root@localhost:3306/sembuzz`)
- `3306` - MySQL port (default is 3306)
- `sembuzz` - Your database name (already created in phpMyAdmin)

### Examples:

**If you have a password:**
```env
DATABASE_URL="mysql://root:mypassword123@localhost:3306/sembuzz"
```

**If you have NO password (empty password):**
```env
DATABASE_URL="mysql://root@localhost:3306/sembuzz"
```

**If your MySQL username is different:**
```env
DATABASE_URL="mysql://your_username:your_password@localhost:3306/sembuzz"
```

### Step 4: Add Other Required Variables

Make sure your `.env` file also has:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/sembuzz"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
```

## How to Find Your MySQL Credentials

1. **Check phpMyAdmin:**
   - When you log into phpMyAdmin, the username is usually shown
   - Common defaults: `root` with no password, or `root` with a password you set

2. **Check MySQL Configuration:**
   - On macOS with Homebrew: Usually `root` with no password
   - On XAMPP/MAMP: Usually `root` with no password or `root` with `root` as password
   - On Linux: Check `/etc/mysql/my.cnf` or MySQL config

3. **Test Connection:**
   - Try logging into phpMyAdmin - the credentials you use there are what you need

## After Updating .env

Once you've updated the `.env` file with the correct MySQL connection string:

1. **Generate Prisma Client:**
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Run Migrations (creates tables):**
   ```bash
   npm run prisma:migrate
   ```

3. **Seed Features:**
   ```bash
   npm run prisma:seed
   ```

4. **Create Super Admin:**
   ```bash
   npm run seed:super-admin
   ```

## Troubleshooting

### "Access Denied" Error
- Check your MySQL username and password
- Make sure MySQL server is running
- Try logging into phpMyAdmin with the same credentials

### "Connection Refused" Error
- Make sure MySQL server is running
- Check if port 3306 is correct
- Try: `mysql -u root -p` in terminal to test connection

### "Database doesn't exist" Error
- Make sure the database `sembuzz` exists in phpMyAdmin
- Check the database name matches exactly (case-sensitive on some systems)
