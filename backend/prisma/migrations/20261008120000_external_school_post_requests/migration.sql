CREATE TABLE `external_school_post_requests` (
  `id` VARCHAR(191) NOT NULL,
  `externalAdminId` VARCHAR(191) NOT NULL,
  `externalCategoryId` VARCHAR(191) NOT NULL,
  `schoolId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `externalLink` VARCHAR(500) NULL,
  `imageUrls` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `schoolAdminMessage` TEXT NULL,
  `reviewedBySchoolAdminId` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `ext_post_school_status_idx`(`schoolId`, `status`),
  INDEX `ext_post_admin_idx`(`externalAdminId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_school_post_requests` ADD CONSTRAINT `ext_post_admin_fkey` FOREIGN KEY (`externalAdminId`) REFERENCES `external_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_school_post_requests` ADD CONSTRAINT `ext_post_category_fkey` FOREIGN KEY (`externalCategoryId`) REFERENCES `external_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_school_post_requests` ADD CONSTRAINT `ext_post_school_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
