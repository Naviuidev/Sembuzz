-- Add adsAdminId to banner_ads and sponsored_ads. Idempotent: safe if FK/column/index already exist or missing.

-- banner_ads
SET @drop_fk = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banner_ads' AND CONSTRAINT_NAME = 'banner_ads_categoryAdminId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY') > 0, 'ALTER TABLE `banner_ads` DROP FOREIGN KEY `banner_ads_categoryAdminId_fkey`', 'SELECT 1'));
PREPARE stmt FROM @drop_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(36) NULL;
ALTER TABLE `banner_ads` MODIFY COLUMN `categoryId` VARCHAR(36) NULL;
SET @add_col = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banner_ads' AND COLUMN_NAME = 'adsAdminId') = 0, 'ALTER TABLE `banner_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL', 'SELECT 1'));
PREPARE stmt FROM @add_col; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @add_idx = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banner_ads' AND INDEX_NAME = 'banner_ads_adsAdminId_idx') = 0, 'ALTER TABLE `banner_ads` ADD INDEX `banner_ads_adsAdminId_idx`(`adsAdminId`)', 'SELECT 1'));
PREPARE stmt FROM @add_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @add_fk = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banner_ads' AND CONSTRAINT_NAME = 'banner_ads_categoryAdminId_fkey') = 0, 'ALTER TABLE `banner_ads` ADD CONSTRAINT `banner_ads_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1'));
PREPARE stmt FROM @add_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sponsored_ads
SET @drop_fk = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sponsored_ads' AND CONSTRAINT_NAME = 'sponsored_ads_categoryAdminId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY') > 0, 'ALTER TABLE `sponsored_ads` DROP FOREIGN KEY `sponsored_ads_categoryAdminId_fkey`', 'SELECT 1'));
PREPARE stmt FROM @drop_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryAdminId` VARCHAR(36) NULL;
ALTER TABLE `sponsored_ads` MODIFY COLUMN `categoryId` VARCHAR(36) NULL;
SET @add_col = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sponsored_ads' AND COLUMN_NAME = 'adsAdminId') = 0, 'ALTER TABLE `sponsored_ads` ADD COLUMN `adsAdminId` VARCHAR(191) NULL', 'SELECT 1'));
PREPARE stmt FROM @add_col; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @add_idx = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sponsored_ads' AND INDEX_NAME = 'sponsored_ads_adsAdminId_idx') = 0, 'ALTER TABLE `sponsored_ads` ADD INDEX `sponsored_ads_adsAdminId_idx`(`adsAdminId`)', 'SELECT 1'));
PREPARE stmt FROM @add_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @add_fk = (SELECT IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sponsored_ads' AND CONSTRAINT_NAME = 'sponsored_ads_categoryAdminId_fkey') = 0, 'ALTER TABLE `sponsored_ads` ADD CONSTRAINT `sponsored_ads_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1'));
PREPARE stmt FROM @add_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;
