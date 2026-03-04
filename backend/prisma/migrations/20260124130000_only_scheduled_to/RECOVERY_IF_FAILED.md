# Recovery: migration 20260124130000_only_scheduled_to failed

This migration fails if `upcoming_posts` was created with **only** `scheduledTo` (e.g. via `create-upcoming-posts-table.sql`) and has **no** `scheduledDate` column.

## Option A: Table already has only `scheduledTo` (no `scheduledDate`)

If your table is already in the target state (`scheduledTo` DATE NOT NULL, no `scheduledDate`), mark the migration as applied and continue:

```bash
cd /var/www/Sembuzz/backend
npx prisma migrate resolve --rolled-back 20260124130000_only_scheduled_to
npx prisma migrate resolve --applied 20260124130000_only_scheduled_to
npx prisma migrate deploy
```

## Option B: Table has both `scheduledDate` and `scheduledTo`

If the table has an old structure with `scheduledDate`, fix it manually then re-run the migration:

1. Mark as rolled back:

```bash
npx prisma migrate resolve --rolled-back 20260124130000_only_scheduled_to
```

2. In MySQL/phpMyAdmin, run:

```sql
UPDATE `upcoming_posts` SET `scheduledTo` = `scheduledDate` WHERE `scheduledTo` IS NULL;
ALTER TABLE `upcoming_posts` DROP COLUMN `scheduledDate`;
ALTER TABLE `upcoming_posts` MODIFY COLUMN `scheduledTo` DATE NOT NULL;
```

3. Mark the migration as applied (so Prisma does not run it again):

```bash
npx prisma migrate resolve --applied 20260124130000_only_scheduled_to
npx prisma migrate deploy
```
