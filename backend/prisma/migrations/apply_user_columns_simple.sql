-- If run_user_columns_update.sql fails, run these ALTERs ONE AT A TIME in your MySQL client.
-- If you get "Duplicate column name", that column exists — skip that line and continue.

--ALTER TABLE `users` ADD COLUMN `approvalEmailVerifiedAt` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `verificationDocUrl` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `additionalVerificationDocUrl` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `profilePicUrl` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `registrationMethod` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active';
ALTER TABLE `users` ADD COLUMN `otp` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `otpExpiresAt` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `firstName` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `lastName` VARCHAR(191) NULL;
