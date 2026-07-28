-- One-time completion for partially applied 20260726120000_platform_user_identity
-- Safe to run when platform_users + platformUserId columns already exist.

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
