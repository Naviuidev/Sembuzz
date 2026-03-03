-- CreateTable (short index/constraint names for MySQL 64-char limit)
CREATE TABLE IF NOT EXISTS `school_admin_to_category_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `schoolAdminId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `date` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `sa2caq_schoolId`(`schoolId`),
    INDEX `sa2caq_schoolAdminId`(`schoolAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `school_admin_to_sub_category_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `schoolAdminId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `date` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `sa2scaq_schoolId`(`schoolId`),
    INDEX `sa2scaq_schoolAdminId`(`schoolAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_admin_to_sub_category_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `meetingDate` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ca2scaq_categoryId`(`categoryId`),
    INDEX `ca2scaq_categoryAdminId`(`categoryAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_category_admin_to_school_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `meetingDate` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `sca2saq_schoolId`(`schoolId`),
    INDEX `sca2saq_subCategoryAdminId`(`subCategoryAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_admin_to_super_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `meetingDate` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `customMessage` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ca2saq_categoryAdminId`(`categoryAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_category_admin_to_super_admin_queries` (
    `id` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `meetingType` VARCHAR(191) NULL,
    `meetingDate` DATETIME(3) NULL,
    `timeSlot` VARCHAR(191) NULL,
    `timeZone` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `customMessage` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `sca2saq_subCategoryAdminId`(`subCategoryAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (short names)
ALTER TABLE `school_admin_to_category_admin_queries` ADD CONSTRAINT `sa2caq_schoolAdminId_fkey` FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `school_admin_to_category_admin_queries` ADD CONSTRAINT `sa2caq_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `school_admin_to_sub_category_admin_queries` ADD CONSTRAINT `sa2scaq_schoolAdminId_fkey` FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `school_admin_to_sub_category_admin_queries` ADD CONSTRAINT `sa2scaq_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `category_admin_to_sub_category_admin_queries` ADD CONSTRAINT `ca2scaq_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `category_admin_to_sub_category_admin_queries` ADD CONSTRAINT `ca2scaq_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sub_category_admin_to_school_admin_queries` ADD CONSTRAINT `sca2saq_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sub_category_admin_to_school_admin_queries` ADD CONSTRAINT `sca2saq_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `category_admin_to_super_admin_queries` ADD CONSTRAINT `ca2saq_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sub_category_admin_to_super_admin_queries` ADD CONSTRAINT `sca2saq_sa_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
