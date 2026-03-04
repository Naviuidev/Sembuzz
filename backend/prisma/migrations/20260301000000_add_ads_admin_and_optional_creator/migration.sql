-- Add Ads Admin and optional creator for BannerAd/SponsoredAd
-- Only creates ads_admins + ads_admin_password_reset_otps here.
-- Alter banner_ads/sponsored_ads is in 20260303100000 (runs after those tables exist).
-- schoolId VARCHAR(36) to match baseline schools.id on Hostinger.

CREATE TABLE `ads_admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `ads_admins_email_key`(`email`),
    INDEX `ads_admins_schoolId_idx`(`schoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `ads_admins` ADD CONSTRAINT `ads_admins_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

ALTER TABLE `ads_admin_password_reset_otps` ADD CONSTRAINT `ads_admin_password_reset_otps_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
