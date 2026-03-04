# Recovery: migration failed (identifier too long)

If this migration failed on MySQL with "Identifier name ... is too long", do the following **on the VPS** (after pulling the fixed migration).

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
SET FOREIGN_KEY_CHECKS = 1;
```

## 3. Deploy migrations again

```bash
npx prisma migrate deploy
```

The migration file has been updated with shorter index names (under MySQL’s 64-character limit), so it should apply successfully.
