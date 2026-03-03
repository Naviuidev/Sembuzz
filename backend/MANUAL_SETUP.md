# Manual Database Setup (Alternative to Prisma Migrations)

If you're having issues with Prisma migrations due to MySQL version mismatch, you can create the tables manually.

## Option 1: Using phpMyAdmin (Easiest)

1. **Start MySQL from XAMPP Control Panel**
   - Open XAMPP
   - Click "Start" next to MySQL
   - Wait until it shows "Running"

2. **Open phpMyAdmin**
   - Go to `http://localhost/phpmyadmin`
   - Select the `sembuzz` database from the left sidebar

3. **Run SQL Script**
   - Click on the "SQL" tab at the top
   - Open the file `backend/prisma/create-tables.sql`
   - Copy all the SQL content
   - Paste it into the SQL tab in phpMyAdmin
   - Click "Go" or press Ctrl+Enter

4. **Verify Tables Created**
   - You should see 5 tables:
     - `super_admins`
     - `schools`
     - `school_admins`
     - `features`
     - `school_features`

5. **Seed Features**
   ```bash
   cd backend
   npm run prisma:seed
   ```

6. **Create Super Admin**
   ```bash
   npm run seed:super-admin
   ```

## Option 2: Using MySQL Command Line

1. **Start MySQL from XAMPP**

2. **Run SQL Script**
   ```bash
   /Applications/XAMPP/xamppfiles/bin/mysql -u root sembuzz < backend/prisma/create-tables.sql
   ```

3. **Continue with seeding** (same as above)

## After Manual Setup

Once tables are created, you can:

1. **Test the connection:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Use the API endpoints** - they should work now!

## Why This Works

- Bypasses the Prisma migration system
- Creates tables directly in MySQL
- Prisma Client will still work (it just reads the schema)
- You can use Prisma normally after this

## Next Steps

After creating tables manually:
- ✅ Tables are created
- ✅ Run `npm run prisma:seed` to add features
- ✅ Run `npm run seed:super-admin` to create admin
- ✅ Start your server: `npm run start:dev`
