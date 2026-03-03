# Quick Fix: MySQL Server Not Running

## The Error
```
ERROR 2002 (HY000): Can't connect to local MySQL server through socket
```

This means **MySQL server is not running**. You need to start it first.

## Solution

### Step 1: Start MySQL from XAMPP

1. **Open XAMPP Control Panel**
   - Look for XAMPP in your Applications folder
   - Or search for "XAMPP" in Spotlight

2. **Start MySQL**
   - Click the "Start" button next to MySQL
   - Wait until it shows "Running" (green)

### Step 2: Verify MySQL is Running

You can test the connection:
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root -e "SELECT VERSION();"
```

If this works, MySQL is running!

### Step 3: Run mysql_upgrade (if still needed)

Now that MySQL is running, you can run:
```bash
sudo /Applications/XAMPP/xamppfiles/bin/mysql_upgrade -u root
```

**Note:** You might not need to run mysql_upgrade if Prisma migrations work now.

### Step 4: Try Prisma Migrations Again

Once MySQL is running, try:
```bash
cd backend
npm run prisma:migrate
```

## Alternative: Skip mysql_upgrade

If the mysql_upgrade is causing issues, you can try using `prisma db push` instead, which might work around the version mismatch:

```bash
cd backend
npx prisma db push
```

This will create the tables directly without using migrations.

## If Prisma Still Fails

If you still get the version mismatch error after starting MySQL, you can create the tables manually in phpMyAdmin. I can provide the SQL script for that.
