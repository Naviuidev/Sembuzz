-- Create upcoming_posts table (school admin scheduled news)
-- Run this in phpMyAdmin or MySQL if the table does not exist.
-- Requires: schools, categories, sub_categories tables (with VARCHAR(36) id columns).

CREATE TABLE IF NOT EXISTS `upcoming_posts` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `subCategoryId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `imageUrls` TEXT NULL,
    `scheduledTo` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `upcoming_posts_schoolId_idx`(`schoolId`),
    INDEX `upcoming_posts_scheduledTo_idx`(`scheduledTo`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (if they already exist, these will error — skip them)
ALTER TABLE `upcoming_posts` ADD CONSTRAINT `upcoming_posts_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `upcoming_posts` ADD CONSTRAINT `upcoming_posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `upcoming_posts` ADD CONSTRAINT `upcoming_posts_subCategoryId_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
