-- CreateTable
CREATE TABLE `banner_ads` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(1000) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `banner_ads_schoolId_idx`(`schoolId`),
    INDEX `banner_ads_startAt_idx`(`startAt`),
    INDEX `banner_ads_endAt_idx`(`endAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `banner_ads` ADD CONSTRAINT `banner_ads_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banner_ads` ADD CONSTRAINT `banner_ads_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
