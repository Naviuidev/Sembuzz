-- MariaDB-compatible (DEFAULT CHARSET, short index names)
-- CreateTable
CREATE TABLE `school_admin_to_category_admin_queries` (
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
    PRIMARY KEY (`id`),
    INDEX `school_admin_to_category_admin_queries_schoolId_idx`(`schoolId`),
    INDEX `school_admin_to_category_admin_queries_schoolAdminId_idx`(`schoolAdminId`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_admin_to_sub_category_admin_queries` (
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
    PRIMARY KEY (`id`),
    INDEX `school_admin_to_sub_category_admin_queries_schoolId_idx`(`schoolId`),
    INDEX `school_admin_to_sub_category_admin_queries_schoolAdminId_idx`(`schoolAdminId`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_admin_to_sub_category_admin_queries` (
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
    PRIMARY KEY (`id`),
    INDEX `category_admin_to_sub_category_admin_queries_categoryId_idx`(`categoryId`),
    INDEX `category_admin_to_sub_category_admin_queries_categoryAdminId_idx`(`categoryAdminId`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable (indexes added separately for MariaDB compatibility)
CREATE TABLE `sub_category_admin_to_school_admin_queries` (
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
    PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE INDEX `sca2sa_queries_schoolId_idx` ON `sub_category_admin_to_school_admin_queries`(`schoolId`);
CREATE INDEX `sca2sa_queries_subCatAdminId_idx` ON `sub_category_admin_to_school_admin_queries`(`subCategoryAdminId`);

-- CreateTable
CREATE TABLE `category_admin_to_super_admin_queries` (
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
    PRIMARY KEY (`id`),
    INDEX `category_admin_to_super_admin_queries_categoryAdminId_idx`(`categoryAdminId`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_category_admin_to_super_admin_queries` (
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
    PRIMARY KEY (`id`),
    INDEX `sca2super_queries_subCatAdminId_idx`(`subCategoryAdminId`)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `school_admin_to_category_admin_queries` ADD CONSTRAINT `school_admin_to_category_admin_queries_schoolAdminId_fkey` FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_admin_to_category_admin_queries` ADD CONSTRAINT `school_admin_to_category_admin_queries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_admin_to_sub_category_admin_queries` ADD CONSTRAINT `school_admin_to_sub_category_admin_queries_schoolAdminId_fkey` FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_admin_to_sub_category_admin_queries` ADD CONSTRAINT `school_admin_to_sub_category_admin_queries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_admin_to_sub_category_admin_queries` ADD CONSTRAINT `category_admin_to_sub_category_admin_queries_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_admin_to_sub_category_admin_queries` ADD CONSTRAINT `category_admin_to_sub_category_admin_queries_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_category_admin_to_school_admin_queries` ADD CONSTRAINT `sub_category_admin_to_school_admin_queries_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_category_admin_to_school_admin_queries` ADD CONSTRAINT `sub_category_admin_to_school_admin_queries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_admin_to_super_admin_queries` ADD CONSTRAINT `category_admin_to_super_admin_queries_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_category_admin_to_super_admin_queries` ADD CONSTRAINT `sub_category_admin_to_super_admin_queries_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
