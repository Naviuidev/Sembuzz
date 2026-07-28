-- Platform User identity: permanent User ID with changeable email

CREATE TABLE IF NOT EXISTS `platform_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `platform_users_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add nullable platformUserId columns (skip if already added)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'super_admins' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `super_admins` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'school_admins' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `school_admins` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ads_admins' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `ads_admins` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_admins' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `category_admins` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sub_category_admins' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `sub_category_admins` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'platformUserId'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE `users` ADD COLUMN `platformUserId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed platform_users from all account emails (deduped by unique email index)
INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `super_admins` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `school_admins` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `ads_admins` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `category_admins` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `sub_category_admins` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

INSERT IGNORE INTO `platform_users` (`id`, `email`, `createdAt`, `updatedAt`)
SELECT UUID(), LOWER(TRIM(`email`)), NOW(3), NOW(3) FROM `users` WHERE `email` IS NOT NULL AND TRIM(`email`) != '';

-- Link role rows to platform_users
UPDATE `super_admins` sa
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(sa.`email`))
SET sa.`platformUserId` = pu.`id`
WHERE sa.`platformUserId` IS NULL;

UPDATE `school_admins` sa
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(sa.`email`))
SET sa.`platformUserId` = pu.`id`
WHERE sa.`platformUserId` IS NULL;

UPDATE `ads_admins` aa
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(aa.`email`))
SET aa.`platformUserId` = pu.`id`
WHERE aa.`platformUserId` IS NULL;

UPDATE `category_admins` ca
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(ca.`email`))
SET ca.`platformUserId` = pu.`id`
WHERE ca.`platformUserId` IS NULL;

UPDATE `sub_category_admins` sca
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(sca.`email`))
SET sca.`platformUserId` = pu.`id`
WHERE sca.`platformUserId` IS NULL;

UPDATE `users` u
INNER JOIN `platform_users` pu ON pu.`email` = LOWER(TRIM(u.`email`))
SET u.`platformUserId` = pu.`id`
WHERE u.`platformUserId` IS NULL;

-- Normalize stored emails to lowercase for consistency
UPDATE `super_admins` SET `email` = LOWER(TRIM(`email`));
UPDATE `school_admins` SET `email` = LOWER(TRIM(`email`));
UPDATE `ads_admins` SET `email` = LOWER(TRIM(`email`));
UPDATE `category_admins` SET `email` = LOWER(TRIM(`email`));
UPDATE `sub_category_admins` SET `email` = LOWER(TRIM(`email`));
UPDATE `users` SET `email` = LOWER(TRIM(`email`));

-- Drop old unique email constraints (index names differ between environments)
SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'super_admins' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `super_admins` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'school_admins' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `school_admins` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ads_admins' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `ads_admins` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_admins' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `category_admins` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sub_category_admins' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `sub_category_admins` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT `INDEX_NAME` FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE `users` DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Make platformUserId required and add constraints
ALTER TABLE `super_admins` MODIFY `platformUserId` VARCHAR(191) NOT NULL;
ALTER TABLE `school_admins` MODIFY `platformUserId` VARCHAR(191) NOT NULL;
ALTER TABLE `ads_admins` MODIFY `platformUserId` VARCHAR(191) NOT NULL;
ALTER TABLE `category_admins` MODIFY `platformUserId` VARCHAR(191) NOT NULL;
ALTER TABLE `sub_category_admins` MODIFY `platformUserId` VARCHAR(191) NOT NULL;
ALTER TABLE `users` MODIFY `platformUserId` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `super_admins_platformUserId_key` ON `super_admins`(`platformUserId`);
CREATE UNIQUE INDEX `users_platformUserId_key` ON `users`(`platformUserId`);
CREATE UNIQUE INDEX `school_admins_schoolId_platformUserId_key` ON `school_admins`(`schoolId`, `platformUserId`);
CREATE UNIQUE INDEX `ads_admins_schoolId_platformUserId_key` ON `ads_admins`(`schoolId`, `platformUserId`);
CREATE UNIQUE INDEX `category_admins_schoolId_platformUserId_key` ON `category_admins`(`schoolId`, `platformUserId`);
CREATE UNIQUE INDEX `sub_category_admins_schoolId_platformUserId_key` ON `sub_category_admins`(`schoolId`, `platformUserId`);

CREATE INDEX `super_admins_email_idx` ON `super_admins`(`email`);
CREATE INDEX `school_admins_email_idx` ON `school_admins`(`email`);
CREATE INDEX `school_admins_platformUserId_idx` ON `school_admins`(`platformUserId`);
CREATE INDEX `ads_admins_email_idx` ON `ads_admins`(`email`);
CREATE INDEX `ads_admins_platformUserId_idx` ON `ads_admins`(`platformUserId`);
CREATE INDEX `category_admins_email_idx` ON `category_admins`(`email`);
CREATE INDEX `category_admins_platformUserId_idx` ON `category_admins`(`platformUserId`);
CREATE INDEX `sub_category_admins_email_idx` ON `sub_category_admins`(`email`);
CREATE INDEX `sub_category_admins_platformUserId_idx` ON `sub_category_admins`(`platformUserId`);

ALTER TABLE `super_admins` ADD CONSTRAINT `super_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `school_admins` ADD CONSTRAINT `school_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ads_admins` ADD CONSTRAINT `ads_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `category_admins` ADD CONSTRAINT `category_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sub_category_admins` ADD CONSTRAINT `sub_category_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
