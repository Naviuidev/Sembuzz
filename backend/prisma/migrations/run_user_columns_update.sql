-- Fix "Database schema may be out of date" for `users` table.
-- Run once: mysql -u YOUR_USER -p YOUR_DATABASE < prisma/migrations/run_user_columns_update.sql
-- Or paste into MySQL Workbench / phpMyAdmin and run.

-- Add column only if it doesn't exist (MySQL 5.7+)
-- approvalEmailVerifiedAt
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'approvalEmailVerifiedAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `approvalEmailVerifiedAt` DATETIME(3) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- verificationDocUrl
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verificationDocUrl');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `verificationDocUrl` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- additionalVerificationDocUrl
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'additionalVerificationDocUrl');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `additionalVerificationDocUrl` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- profilePicUrl (in case old DB never had it)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profilePicUrl');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `profilePicUrl` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- registrationMethod
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'registrationMethod');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `registrationMethod` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- status
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT \'active\'', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- otp, otpExpiresAt
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'otp');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `otp` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'otpExpiresAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `otpExpiresAt` DATETIME(3) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- firstName, lastName
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'firstName');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `firstName` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'lastName');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `users` ADD COLUMN `lastName` VARCHAR(191) NULL', 
  'SELECT 1 AS skip');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
