# Step-by-Step: Create Tables Manually

Since Prisma migrations are failing due to MySQL version mismatch, let's create tables manually. This is actually faster!

## ✅ Step 1: Verify MySQL is Running

1. Open **XAMPP Control Panel**
2. Make sure **MySQL** shows "Running" (green)
3. If not, click "Start" and wait

## ✅ Step 2: Open phpMyAdmin

1. Open your browser
2. Go to: `http://localhost/phpmyadmin`
3. You should see the phpMyAdmin interface

## ✅ Step 3: Select Database

1. In the **left sidebar**, click on **`sembuzz`** database
2. You should see it's currently empty (no tables)

## ✅ Step 4: Run SQL Script

1. Click on the **"SQL"** tab at the top of phpMyAdmin
2. You'll see a text area for SQL queries
3. Open the file: `backend/prisma/create-tables.sql` in your code editor
4. **Copy ALL the SQL content** from that file
5. **Paste it** into the SQL text area in phpMyAdmin
6. Click the **"Go"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

## ✅ Step 5: Verify Tables Created

After running the SQL, you should see:
- ✅ Success message
- ✅ 5 tables created:
  - `super_admins`
  - `schools`
  - `school_admins`
  - `features`
  - `school_features`

Check the left sidebar - you should see these tables listed under `sembuzz` database.

## ✅ Step 6: Seed Features

Now run this command in terminal:

```bash
cd backend
npm run prisma:seed
```

This will add the 6 features (NEWS, EVENTS, ADS, etc.) to the `features` table.

## ✅ Step 7: Create Super Admin

Run this command:

```bash
npm run seed:super-admin
```

Follow the prompts to create your first super admin account.

## ✅ Step 8: Test the Server

Start your backend:

```bash
npm run start:dev
```

You should see:
```
Application is running on: http://[::1]:3000
```

## 🎉 Done!

Your backend is now ready! You can test the API endpoints:
- `POST /super-admin/auth/login`
- `GET /super-admin/schools`
- etc.

---

## Troubleshooting

**If SQL fails:**
- Make sure you selected the `sembuzz` database first
- Check that MySQL is running
- Try running the SQL statements one by one

**If seeding fails:**
- Make sure tables were created successfully
- Check that Prisma client was generated: `npm run prisma:generate`
