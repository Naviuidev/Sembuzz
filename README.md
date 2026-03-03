# Sembuzz
Sembuzz Up-Scale

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
