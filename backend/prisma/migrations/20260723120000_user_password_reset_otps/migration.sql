-- User password reset OTPs (forgot password flow)
CREATE TABLE `user_password_reset_otps` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `user_password_reset_otps_userId_idx` (`userId`),
  INDEX `user_password_reset_otps_otp_isUsed_idx` (`otp`, `isUsed`),
  CONSTRAINT `user_password_reset_otps_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
