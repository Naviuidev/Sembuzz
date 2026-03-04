# Recovery: migration failed (identifier too long / syntax near PRIMARY KEY)

If this migration failed with "Identifier name ... is too long" or "syntax ... near 'PRIMARY KEY'", do the following **on the VPS**.

## 0. Pull latest code and verify (required)

```bash
cd /var/www/Sembuzz
git pull origin main
```

Confirm the migration file is updated: the first line should mention MariaDB, and there must be no `DEFAULT CHARACTER SET` (use `DEFAULT CHARSET`):

```bash
head -1 backend/prisma/migrations/20260124000000_cross_admin_queries/migration.sql
grep -c "DEFAULT CHARSET" backend/prisma/migrations/20260124000000_cross_admin_queries/migration.sql
```

You should see "MariaDB-compatible" and the grep count should be **5** or more. If you see `DEFAULT CHARACTER SET` in the file, the pull did not update the file; fix that before continuing.

## 1. Mark the migration as rolled back

```bash
cd /var/www/Sembuzz/backend
npx prisma migrate resolve --rolled-back 20260124000000_cross_admin_queries
```

## 2. Drop the tables that were created before the failure

The migration creates 5 tables. The first 3 were created before it failed on the 4th. Drop those 3 so the migration can run again from scratch.

Run this SQL against your database (e.g. via Hostinger phpMyAdmin or MySQL CLI):

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `school_admin_to_category_admin_queries`;
DROP TABLE IF EXISTS `school_admin_to_sub_category_admin_queries`;
DROP TABLE IF EXISTS `category_admin_to_sub_category_admin_queries`;
DROP TABLE IF EXISTS `sub_category_admin_to_school_admin_queries`;
DROP TABLE IF EXISTS `category_admin_to_super_admin_queries`;
DROP TABLE IF EXISTS `sub_category_admin_to_super_admin_queries`;
SET FOREIGN_KEY_CHECKS = 1;
```

## 3. Deploy migrations again

```bash
npx prisma migrate deploy
```

The migration file has been updated with shorter index names (under MySQL’s 64-character limit), so it should apply successfully.
