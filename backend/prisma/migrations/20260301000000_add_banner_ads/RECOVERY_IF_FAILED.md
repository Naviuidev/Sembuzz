# Recovery: 20260301000000_add_banner_ads failed

Migration now creates the table only (no FKs). If it failed before:

```bash
npx prisma migrate resolve --rolled-back 20260301000000_add_banner_ads
```

In MySQL: `DROP TABLE IF EXISTS banner_ads;` (drop only if it was created).

Then: `git pull origin main` and `npx prisma migrate deploy`.
