# Database Migration Instructions

## Quick Fix: Run SQL Migration Manually

The 500 error is because the `domain` and `image` columns don't exist in your database yet.

### Option 1: Using MySQL Command Line

```bash
cd backend
mysql -u your_username -p sembuzz < prisma/migrations/add_school_domain_and_image.sql
```

Replace `your_username` with your MySQL username. You'll be prompted for your password.

### Option 2: Using MySQL Workbench or phpMyAdmin

1. Connect to your database
2. Select the `sembuzz` database
3. Run this SQL:

```sql
ALTER TABLE `schools` 
ADD COLUMN `domain` VARCHAR(255) NULL,
ADD COLUMN `image` TEXT NULL;
```

### Option 3: Using Prisma Migrate (if database version issue is fixed)

```bash
cd backend
npx prisma migrate dev --name add_school_domain_and_image
```

### After Migration

1. Regenerate Prisma Client:
```bash
cd backend
npx prisma generate
```

2. Restart the backend server

### Verify Migration

After running the migration, verify the columns exist:
```sql
DESCRIBE schools;
```

You should see `domain` and `image` columns in the output.
