-- CreateTable: banner_ads (no FK constraints - avoids errno 150 on Hostinger)
CREATE TABLE `banner_ads` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `schoolId` VARCHAR(36) NOT NULL,
    `imageUrl` VARCHAR(1000) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `banner_ads_schoolId_idx`(`schoolId`),
    INDEX `banner_ads_startAt_idx`(`startAt`),
    INDEX `banner_ads_endAt_idx`(`endAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
