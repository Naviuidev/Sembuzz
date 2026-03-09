# Sembuzz
Sembuzz Up-Scale

## Common commands

### Sync code / schema to the database

From the **backend** folder. Set `DATABASE_URL` in `.env` to the DB you want to update (e.g. Hostinger = production).

**When the database is production (e.g. Hostinger) – sync code to DB with:**

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

- **`npx prisma generate`** – Regenerates the Prisma client from `schema.prisma`. Run after schema changes or after pulling code that changed the schema.
- **`npx prisma migrate deploy`** – Applies all **pending** migrations to the database. Safe for production (does not create new migrations).

Use this whenever you have new migration files and want the Hostinger DB to match the code.

**Reference (all environments):**

| What you did | Command |
|--------------|---------|
| Changed `prisma/schema.prisma` | `npx prisma generate` then `npx prisma migrate dev` (dev) or `npx prisma migrate deploy` (production) |
| Only changed TypeScript/API code | No DB command needed; restart backend if it’s running |
| New migration created | `npx prisma migrate dev` (dev) or `npx prisma migrate deploy` (prod) |

- **`npx prisma generate`** – Regenerates the Prisma client after schema changes (run after pulling schema changes too).
- **`npx prisma migrate dev`** – Applies migrations in development and creates new ones if the schema changed.
- **`npx prisma migrate deploy`** – Applies existing migrations (e.g. on production server).

### Push code to Git

From the **project root** (sembuzz):

```bash
git add .
git status                    # optional: see what will be committed
git commit -m "Your message"
git push origin main          # or your branch name, e.g. master
```

### One-time: fix “Prisma Client Error” on SchoolAdmin in Prisma Studio

If Prisma Studio shows **“Unable to run script”** or **“Showing 0 of 9”** on the SchoolAdmin table, you have **orphaned** SchoolAdmin rows (their school was deleted earlier). Run this **once** from the **backend** folder:

```bash
npm run fix:orphaned-school-admins -- --fix
```

After that you don’t need to run it again: deleting a school from the app now cascade-deletes all related data (school admins, ads, categories, etc.), so new orphans are not created.

---

## Database (required for admin login)

The app uses **MySQL**. If the database is not running, you will see "Prisma Client Error" in Prisma Studio and **cannot log in** to any admin (Super Admin, School Admin, Category Admin, Sub Category Admin).

### 1. Start MySQL

- **macOS (Homebrew):** `brew services start mysql`
- **Docker:**  
  `docker run -d --name sembuzz-mysql -e MYSQL_ROOT_PASSWORD=yourpassword -e MYSQL_DATABASE=sembuzz -p 3306:3306 mysql:8`
- **MAMP / XAMPP:** Start MySQL from the control panel.

### 2. Configure connection

In `backend/.env`, set `DATABASE_URL` to your running MySQL, for example:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
```

### 3. Create DB and run migrations

From the `backend` folder:

```bash
npm run db:create        # if your project creates the DB via script
npx prisma migrate deploy
# or for dev: npx prisma migrate dev
```

### 4. Seed (optional)

```bash
npm run prisma:seed
npm run seed:super-admin
```

### 5. Verify

- Open Prisma Studio: `npx prisma studio` (e.g. http://localhost:5555). You should see tables and data, no "Unable to run script".
- Start the backend and try logging in to any admin panel.

### Troubleshooting

**Prisma P3009: "migrate found failed migrations in the target database"**

A migration is marked as failed (e.g. `20260122000000_add_schools_extra_columns`). Resolve it then run deploy again.

- If the migration’s changes **are already in the DB** (e.g. columns exist):  
  `npx prisma migrate resolve --applied 20260122000000_add_schools_extra_columns` then `npx prisma migrate deploy`
- If the migration **did not apply** and should run again:  
  `npx prisma migrate resolve --rolled-back 20260122000000_add_schools_extra_columns` then `npx prisma migrate deploy`

**Prisma Studio: “Unable to run script” or “Showing 0 of N” on SchoolAdmin**

This means some SchoolAdmin rows point to a school that no longer exists (orphaned data). Run **once** from `backend`: `npm run fix:orphaned-school-admins -- --fix`. See the “One-time: fix Prisma Client Error on SchoolAdmin” section above.

**"Column count of mysql.proc is wrong" when running `prisma db push`**

Your MariaDB/MySQL was upgraded (e.g. 10.1 → 10.4) but system tables were not.

**Option A – Using phpMyAdmin**

1. Log in to phpMyAdmin as root (or an user that can modify the `mysql` database).
2. Select the **`mysql`** database in the left sidebar.
3. Open the **SQL** tab.
4. Run this (adds the missing 21st column expected by MariaDB 10.3+):

```sql
ALTER TABLE mysql.proc
ADD COLUMN aggregate ENUM('NONE','GROUP') NOT NULL DEFAULT 'NONE' AFTER body_utf8;
```

5. Click **Go**. Then run `npx prisma db push` again from the `backend` folder.

**Option B – Command line**

Run the upgrade tool (stop any apps using the DB first if needed):

- **MariaDB:** `mariadb-upgrade -u root -p` (or `mysql_upgrade -u root -p` on some installs)
- **MySQL 8:** `mysql_upgrade -u root -p`

Then run `npx prisma db push` again.
