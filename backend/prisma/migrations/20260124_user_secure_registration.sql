-- Add secure registration fields to users
ALTER TABLE `users` ADD COLUMN `firstName` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `lastName` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `profilePicUrl` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `registrationMethod` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active';
ALTER TABLE `users` ADD COLUMN `otp` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `otpExpiresAt` DATETIME(3) NULL;
CREATE INDEX `users_status_idx` ON `users`(`status`);
