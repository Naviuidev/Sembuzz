-- Add Ads Admin tables (no FK constraints - avoids errno 150 on strict Hostinger/MySQL).
-- Optional: run prisma/add_ads_admin_fks.sql manually to add FKs after migration succeeds.

CREATE TABLE `ads_admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(36) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `ads_admins_email_key`(`email`),
    INDEX `ads_admins_schoolId_idx`(`schoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ads_admin_password_reset_otps` (
    `id` VARCHAR(191) NOT NULL,
    `adsAdminId` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(6) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `ads_admin_password_reset_otps_adsAdminId_idx`(`adsAdminId`),
    INDEX `ads_admin_password_reset_otps_otp_isUsed_idx`(`otp`, `isUsed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
