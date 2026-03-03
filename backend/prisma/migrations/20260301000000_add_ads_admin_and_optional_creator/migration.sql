-- Add Ads Admin and optional creator for BannerAd/SponsoredAd
-- Uses backticks and camelCase to match existing Prisma migrations

-- Ads admins table (school-scoped ads manager)
CREATE TABLE `ads_admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ads_admins_email_key`(`email`),
    INDEX `ads_admins_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ads_admins` ADD CONSTRAINT `ads_admins_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Ads admin password reset OTPs
CREATE TABLE `ads_admin_password_reset_otps` (
    `id` VARCHAR(191) NOT NULL,
    `adsAdminId` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(6) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ads_admin_password_reset_otps_adsAdminId_idx`(`adsAdminId`),
    INDEX `ads_admin_password_reset_otps_otp_isUsed_idx`(`otp`, `isUsed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ads_admin_password_reset_otps` ADD CONSTRAINT `ads_admin_password_reset_otps_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter banner_ads: make categoryAdminId and categoryId nullable, add adsAdminId
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` ADD INDEX `banner_ads_adsAdminId_idx`(`adsAdminId`);
ALTER TABLE `banner_ads` ADD CONSTRAINT `banner_ads_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter sponsored_ads: same
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` ADD INDEX `sponsored_ads_adsAdminId_idx`(`adsAdminId`);
ALTER TABLE `sponsored_ads` ADD CONSTRAINT `sponsored_ads_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
