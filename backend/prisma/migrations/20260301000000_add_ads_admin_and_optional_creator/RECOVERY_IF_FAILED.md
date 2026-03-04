# Recovery: migration 20260301000000_add_ads_admin_and_optional_creator failed

The migration now **creates only the tables** (no foreign keys), so it should always pass. FKs are optional and can be added later via `prisma/add_ads_admin_fks.sql` if you want.

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

3. **Pull latest code**

```bash
cd /var/www/Sembuzz
git pull origin main
```

4. **Run migrations again**

```bash
cd /var/www/Sembuzz/backend
npx prisma migrate deploy
```

5. **(Optional)** To add foreign keys for referential integrity, run in phpMyAdmin the SQL from `backend/prisma/add_ads_admin_fks.sql`. If it fails, you can skip it; the app works without those FKs.
