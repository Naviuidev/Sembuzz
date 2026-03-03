-- Add verification document URL for public-domain (Gmail/Yahoo) student registrations
ALTER TABLE `users` ADD COLUMN `verificationDocUrl` VARCHAR(191) NULL;
