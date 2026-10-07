ALTER TABLE `external_school_post_requests`
  ADD COLUMN `subCategoryId` VARCHAR(191) NULL,
  ADD COLUMN `subcategoryStatus` VARCHAR(191) NULL,
  ADD COLUMN `subcategoryAdminMessage` TEXT NULL,
  ADD COLUMN `reviewedBySubCategoryAdminId` VARCHAR(191) NULL,
  ADD COLUMN `subcategoryReviewedAt` DATETIME(3) NULL,
  ADD INDEX `ext_post_subcat_status_idx`(`subCategoryId`, `subcategoryStatus`);

ALTER TABLE `external_school_post_requests` ADD CONSTRAINT `ext_post_subcat_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `external_category_subcategory_link_requests` (
  `id` VARCHAR(191) NOT NULL,
  `externalAdminId` VARCHAR(191) NOT NULL,
  `externalCategoryId` VARCHAR(191) NOT NULL,
  `subCategoryId` VARCHAR(191) NOT NULL,
  `schoolId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `subcategoryAdminMessage` TEXT NULL,
  `reviewedBySubCategoryAdminId` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `ext_cat_subcat_link_key`(`externalAdminId`, `externalCategoryId`, `subCategoryId`),
  INDEX `ext_cat_subcat_status_idx`(`subCategoryId`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_category_subcategory_link_requests` ADD CONSTRAINT `ext_cat_link_admin_fkey` FOREIGN KEY (`externalAdminId`) REFERENCES `external_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_category_subcategory_link_requests` ADD CONSTRAINT `ext_cat_link_cat_fkey` FOREIGN KEY (`externalCategoryId`) REFERENCES `external_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_category_subcategory_link_requests` ADD CONSTRAINT `ext_cat_link_sub_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_category_subcategory_link_requests` ADD CONSTRAINT `ext_cat_link_school_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `external_category_subcategory_link_messages` (
  `id` VARCHAR(191) NOT NULL,
  `linkRequestId` VARCHAR(191) NOT NULL,
  `senderRole` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ext_cat_link_msg_idx`(`linkRequestId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_category_subcategory_link_messages` ADD CONSTRAINT `ext_cat_link_msg_fkey` FOREIGN KEY (`linkRequestId`) REFERENCES `external_category_subcategory_link_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `external_school_post_subcategory_messages` (
  `id` VARCHAR(191) NOT NULL,
  `postRequestId` VARCHAR(191) NOT NULL,
  `senderRole` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ext_post_subcat_msg_idx`(`postRequestId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_school_post_subcategory_messages` ADD CONSTRAINT `ext_post_subcat_msg_fkey` FOREIGN KEY (`postRequestId`) REFERENCES `external_school_post_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
