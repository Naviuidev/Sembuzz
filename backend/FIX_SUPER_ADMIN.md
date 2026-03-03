# Fix Super Admin Login Issue

## The Problem

Login is failing with "Invalid credentials". This usually means the password wasn't hashed correctly when creating the super admin.

## Solution: Recreate Super Admin with Correct Hash

### Step 1: Generate Password Hash

Run this command to get the correct hash for password "Admin@1998":

```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@1998', 10).then(h => console.log(h))"
```

**Copy the hash** (it will start with `$2b$10$...`)

### Step 2: Update in phpMyAdmin

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select `sembuzz` database
3. Click on `super_admins` table
4. Click "SQL" tab
5. Run this SQL (replace HASH_HERE with the hash from Step 1):

```sql
-- Delete existing admin (if needed)
DELETE FROM `super_admins` WHERE email = 'admin@sembuzz.com';

-- Insert with correct hash
INSERT INTO `super_admins` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`) VALUES
(
  UUID(),
  'Super Admin',
  'admin@sembuzz.com',
  'HASH_HERE',
  NOW(),
  NOW()
);
```

### Step 3: Test Login Again

```bash
curl -X POST http://localhost:3000/super-admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sembuzz.com","password":"Admin@1998"}'
```

## Alternative: Use the Interactive Script

If SQL is complicated, you can also:

1. Delete the existing admin from phpMyAdmin
2. Run: `npm run seed:super-admin`
3. Enter:
   - Name: Super Admin
   - Email: admin@sembuzz.com
   - Password: Admin@1998

The script will automatically hash the password correctly!
