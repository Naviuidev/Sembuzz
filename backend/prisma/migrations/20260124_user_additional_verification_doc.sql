-- Optional second verification doc when admin asks for "upload one more"
ALTER TABLE `users` ADD COLUMN `additionalVerificationDocUrl` VARCHAR(191) NULL;
