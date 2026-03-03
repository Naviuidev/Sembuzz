-- Create category_admin_queries and sub_category_admin_queries (used by School relation and query modules).
-- Run: mysql -u YOUR_USER -p YOUR_DATABASE < prisma/migrations/20260124_category_admin_queries.sql

CREATE TABLE IF NOT EXISTS `category_admin_queries` (
  `id` VARCHAR(191) NOT NULL,
  `categoryAdminId` VARCHAR(191) NOT NULL,
  `schoolId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `attachmentUrl` VARCHAR(191) NULL,
  `meetingType` VARCHAR(191) NULL,
  `timeZone` VARCHAR(191) NULL,
  `timeSlot` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `category_admin_queries_categoryAdminId_idx`(`categoryAdminId`),
  INDEX `category_admin_queries_schoolId_idx`(`schoolId`),
  INDEX `category_admin_queries_status_idx`(`status`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_category_admin_queries` (
  `id` VARCHAR(191) NOT NULL,
  `subCategoryAdminId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `attachmentUrl` VARCHAR(191) NULL,
  `meetingType` VARCHAR(191) NULL,
  `timeZone` VARCHAR(191) NULL,
  `timeSlot` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `sub_category_admin_queries_subCategoryAdminId_idx`(`subCategoryAdminId`),
  INDEX `sub_category_admin_queries_status_idx`(`status`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (run after tables exist; ignore if already added)
ALTER TABLE `category_admin_queries` ADD CONSTRAINT `category_admin_queries_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `category_admin_queries` ADD CONSTRAINT `category_admin_queries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sub_category_admin_queries` ADD CONSTRAINT `sub_category_admin_queries_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
