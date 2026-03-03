-- Add category_admins and category_admin_password_reset_otps tables
CREATE TABLE IF NOT EXISTS `category_admins` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `schoolId` VARCHAR(36) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `isFirstLogin` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_admin_password_reset_otps` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `categoryAdminId` VARCHAR(36) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE,
  INDEX `idx_category_admin_id` (`categoryAdminId`),
  INDEX `idx_otp_used` (`otp`, `isUsed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
