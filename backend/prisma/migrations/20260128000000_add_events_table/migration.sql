-- Create events table if not present (used by GET /events/approved).
-- No FKs to avoid errno 150 on MariaDB; app enforces relations.
CREATE TABLE IF NOT EXISTS `events` (
    `id` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `subCategoryId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `externalLink` VARCHAR(500) NULL,
    `commentsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `imageUrls` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `revertNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `events_subCategoryAdminId_idx`(`subCategoryAdminId`),
    INDEX `events_subCategoryId_idx`(`subCategoryId`),
    INDEX `events_status_idx`(`status`),
    INDEX `events_schoolId_idx`(`schoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
