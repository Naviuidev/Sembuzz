-- Create Super Admin Account
-- Run this in phpMyAdmin SQL tab after selecting the 'sembuzz' database
-- 
-- IMPORTANT: Replace 'YourPassword123' with your desired password
-- The password will be hashed using bcrypt
-- 
-- To hash your password, you can:
-- 1. Use an online bcrypt generator: https://bcrypt-generator.com/
-- 2. Or run: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"

-- Example: Creating super admin with email 'admin@sembuzz.com'
-- Replace the password hash below with your hashed password

INSERT INTO `super_admins` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`) VALUES
(
  UUID(),
  'Super Admin',
  'admin@sembuzz.com',
  '$2b$10$REPLACE_WITH_YOUR_HASHED_PASSWORD_HERE',
  NOW(),
  NOW()
);

-- After running, you can login with:
-- Email: admin@sembuzz.com
-- Password: (the password you hashed)
