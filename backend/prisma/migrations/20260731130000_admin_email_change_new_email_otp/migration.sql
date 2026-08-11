-- AlterTable
ALTER TABLE `admin_email_change_requests`
  ADD COLUMN `proposedNewEmail` VARCHAR(191) NULL,
  ADD COLUMN `newEmailOtp` VARCHAR(6) NULL,
  ADD COLUMN `newEmailOtpExpiresAt` DATETIME(3) NULL,
  ADD COLUMN `newEmailOtpUsed` BOOLEAN NOT NULL DEFAULT false;
