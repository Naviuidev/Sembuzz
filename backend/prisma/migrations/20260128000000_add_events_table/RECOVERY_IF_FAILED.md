# If migration 20260128000000_add_events_table fails

- If the `events` table already exists (e.g. created manually), the migration uses `CREATE TABLE IF NOT EXISTS` so it should not fail.
- If you see a syntax error, ensure MySQL/MariaDB version supports the syntax.
- If you need to re-run: mark as rolled back then applied, or run the SQL in `migration.sql` manually in phpMyAdmin, then `npx prisma migrate resolve --applied 20260128000000_add_events_table`.
