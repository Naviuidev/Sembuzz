-- Add PasswordResetOtp table for school admin password reset
CREATE TABLE IF NOT EXISTS `password_reset_otps` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `schoolAdminId` VARCHAR(36) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `isUsed` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_password_reset_otps_schoolAdminId` ON `password_reset_otps`(`schoolAdminId`);
CREATE INDEX `idx_password_reset_otps_otp_isUsed` ON `password_reset_otps`(`otp`, `isUsed`);
