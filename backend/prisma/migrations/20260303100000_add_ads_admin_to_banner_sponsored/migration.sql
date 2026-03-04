-- Add adsAdminId to banner_ads and sponsored_ads (no FK - avoids errno 150)
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(36) NULL;
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryId` VARCHAR(36) NULL;
ALTER TABLE `banner_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `banner_ads` ADD INDEX `banner_ads_adsAdminId_idx`(`adsAdminId`);

ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(36) NULL;
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryId` VARCHAR(36) NULL;
ALTER TABLE `sponsored_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL;
ALTER TABLE `sponsored_ads` ADD INDEX `sponsored_ads_adsAdminId_idx`(`adsAdminId`);
