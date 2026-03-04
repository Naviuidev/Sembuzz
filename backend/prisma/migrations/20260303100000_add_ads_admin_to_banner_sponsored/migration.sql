-- Add adsAdminId to banner_ads and sponsored_ads (runs after those tables exist)
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` ADD INDEX `banner_ads_adsAdminId_idx`(`adsAdminId`);
ALTER TABLE `banner_ads` ADD CONSTRAINT `banner_ads_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` ADD INDEX `sponsored_ads_adsAdminId_idx`(`adsAdminId`);
ALTER TABLE `sponsored_ads` ADD CONSTRAINT `sponsored_ads_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
