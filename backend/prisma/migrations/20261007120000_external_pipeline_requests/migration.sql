DROP TABLE IF EXISTS `external_category_school_pipeline_requests`;

CREATE TABLE `external_category_school_pipeline_requests` (
  `id` VARCHAR(191) NOT NULL,
  `externalAdminId` VARCHAR(191) NOT NULL,
  `externalCategoryId` VARCHAR(191) NOT NULL,
  `schoolId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `requestMessage` TEXT NULL,
  `schoolAdminMessage` TEXT NULL,
  `reviewedBySchoolAdminId` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ext_pipeline_admin_cat_school_key`(`externalAdminId`, `externalCategoryId`, `schoolId`),
  INDEX `ext_pipeline_school_status_idx`(`schoolId`, `status`),
  INDEX `ext_pipeline_admin_idx`(`externalAdminId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_category_school_pipeline_requests` ADD CONSTRAINT `ext_pipeline_admin_fkey` FOREIGN KEY (`externalAdminId`) REFERENCES `external_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_category_school_pipeline_requests` ADD CONSTRAINT `ext_pipeline_category_fkey` FOREIGN KEY (`externalCategoryId`) REFERENCES `external_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_category_school_pipeline_requests` ADD CONSTRAINT `ext_pipeline_school_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
