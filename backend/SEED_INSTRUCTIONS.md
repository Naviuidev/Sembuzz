# Seed Data Instructions

Since Prisma 7 has some configuration complexities, here's a simple way to seed your database:

## Option 1: Using SQL (Easiest - Recommended)

### Seed Features:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select the `sembuzz` database
3. Click the "SQL" tab
4. Copy and paste the content from `prisma/seed-features.sql`
5. Click "Go"

This will add all 6 features to your database.

### Create Super Admin:

You can create a super admin directly in phpMyAdmin:

1. Go to phpMyAdmin
2. Select `sembuzz` database
3. Click on `super_admins` table
4. Click "Insert" tab
5. Fill in:
   - `id`: Leave empty (will auto-generate UUID)
   - `name`: Your admin name (e.g., "Super Admin")
   - `email`: Your email (e.g., "admin@sembuzz.com")
   - `password`: You need to hash this first (see below)
   - `createdAt`: Leave empty (auto-set)
   - `updatedAt`: Leave empty (auto-set)

**To hash the password**, you can:
- Use an online bcrypt generator: https://bcrypt-generator.com/
- Or run this in Node.js:
  ```bash
  node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"
  ```

## Option 2: Fix Prisma Client (Advanced)

If you want to use the Prisma seed scripts, we need to configure Prisma 7 properly with an adapter. This requires additional setup.

## Quick SQL for Super Admin:

If you want to create super admin via SQL, here's a template (replace the password hash):

```sql
INSERT INTO `super_admins` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`)
VALUES (
  UUID(),
  'Super Admin',
  'admin@sembuzz.com',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  NOW(),
  NOW()
);
```

## After Seeding:

Once features and super admin are created, you can:

1. Start your server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Test login:
   ```bash
   curl -X POST http://localhost:3000/super-admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sembuzz.com","password":"yourpassword"}'
   ```
