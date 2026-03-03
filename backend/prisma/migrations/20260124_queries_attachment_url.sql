-- Add attachmentUrl to queries table (school admin → super admin)
-- Run if you get: The column `attachmentUrl` does not exist in the current database.
ALTER TABLE `queries` ADD COLUMN `attachmentUrl` VARCHAR(191) NULL AFTER `description`;
