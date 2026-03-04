# Recovery: migration 20260301000000_add_ads_admin_and_optional_creator failed

This migration was fixed to only create `ads_admins` and `ads_admin_password_reset_otps`. The ALTERs for `banner_ads`/`sponsored_ads` were moved to migration `20260303100000_add_ads_admin_to_banner_sponsored` (runs after those tables exist).

## Steps on the VPS

1. **Mark the failed migration as rolled back**

```bash
cd /var/www/Sembuzz/backend
npx prisma migrate resolve --rolled-back 20260301000000_add_ads_admin_and_optional_creator
```

2. **Drop the tables if they were partially created** (in phpMyAdmin or MySQL):

```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `ads_admin_password_reset_otps`;
DROP TABLE IF EXISTS `ads_admins`;
SET FOREIGN_KEY_CHECKS = 1;
```

3. **Pull latest code** (so you get the fixed migration and the new 20260303100000 migration):

```bash
cd /var/www/Sembuzz
git pull origin main
```

4. **Run migrations again**

```bash
cd /var/www/Sembuzz/backend
npx prisma migrate deploy
```

---

## If you still get errno 150 (Foreign key constraint is incorrectly formed)

1. **Confirm you pulled the latest code** – the migration must use `schoolId` VARCHAR(36), `ENGINE=InnoDB`, and explicit collation:
   ```bash
   grep -E "schoolId|ENGINE|utf8mb4" backend/prisma/migrations/20260301000000_add_ads_admin_and_optional_creator/migration.sql
   ```
   You should see `schoolId` VARCHAR(36), `ENGINE=InnoDB`, and `utf8mb4_unicode_ci`.

2. **Check that `schools` exists and matches** – in MySQL/phpMyAdmin:
   ```sql
   SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'id';
   ```
   Result should be `id`, `varchar(36)`, `utf8mb4_unicode_ci`. If `schools` is missing or the type/collation differ, create or fix the `schools` table first (e.g. from `prisma/create-tables.sql`).
