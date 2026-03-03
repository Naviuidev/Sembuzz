# MySQL/MariaDB Version Mismatch Fix

## The Problem

You're getting this error:
```
Column count of mysql.proc is wrong. Expected 21, found 20. 
Created with MariaDB 100108, now running 100428. 
Please use mysql_upgrade to fix this error
```

This happens when your MySQL/MariaDB server was upgraded but the system tables weren't updated.

## Solution: Run mysql_upgrade

### Option 1: Using Command Line (Recommended)

1. **Stop your MySQL/MariaDB server** (if running as a service):
   ```bash
   # On macOS with Homebrew:
   brew services stop mysql
   # or
   brew services stop mariadb
   
   # On Linux:
   sudo systemctl stop mysql
   # or
   sudo systemctl stop mariadb
   ```

2. **Run mysql_upgrade**:
   ```bash
   # If using MySQL:
   mysql_upgrade -u root -p
   
   # If using MariaDB:
   mysql_upgrade -u root -p
   
   # If no password:
   mysql_upgrade -u root
   ```

3. **Restart MySQL/MariaDB**:
   ```bash
   # On macOS with Homebrew:
   brew services start mysql
   # or
   brew services start mariadb
   
   # On Linux:
   sudo systemctl start mysql
   # or
   sudo systemctl start mariadb
   ```

### Option 2: Using XAMPP/MAMP

If you're using XAMPP or MAMP:

1. **Stop MySQL from the control panel**

2. **Open Terminal and navigate to MySQL bin directory**:
   ```bash
   # XAMPP (macOS):
   cd /Applications/XAMPP/bin
   
   # MAMP (macOS):
   cd /Applications/MAMP/Library/bin
   ```

3. **Run mysql_upgrade**:
   ```bash
   ./mysql_upgrade -u root -p
   ```

4. **Restart MySQL from control panel**

### Option 3: Manual SQL Fix (Advanced)

If mysql_upgrade doesn't work, you can try:

```bash
mysql -u root -p
```

Then in MySQL:
```sql
USE mysql;
SOURCE /usr/local/mysql/share/mysql_upgrade_info;
```

## After Fixing

Once you've run `mysql_upgrade`, try again:

```bash
cd backend
npm run prisma:migrate
```

Or if migrations still fail:

```bash
npx prisma db push
```

## Alternative: Create Tables Manually

If the upgrade doesn't work, you can create the tables manually in phpMyAdmin using SQL. I can provide the SQL script if needed.

## Check Your MySQL Version

To see what version you're running:

```bash
mysql --version
# or
mysql -u root -p -e "SELECT VERSION();"
```
