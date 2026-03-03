-- CreateTable: sponsored_ads
CREATE TABLE `sponsored_ads` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `imageUrls` TEXT NULL,
    `externalLink` VARCHAR(1000) NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sponsored_ads_schoolId_idx`(`schoolId`),
    INDEX `sponsored_ads_startAt_idx`(`startAt`),
    INDEX `sponsored_ads_endAt_idx`(`endAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: sponsored_ad_events
CREATE TABLE `sponsored_ad_events` (
    `id` VARCHAR(191) NOT NULL,
    `sponsoredAdId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sponsored_ad_events_sponsoredAdId_idx`(`sponsoredAdId`),
    INDEX `sponsored_ad_events_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sponsored_ads` ADD CONSTRAINT `sponsored_ads_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sponsored_ads` ADD CONSTRAINT `sponsored_ads_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sponsored_ad_events` ADD CONSTRAINT `sponsored_ad_events_sponsoredAdId_fkey` FOREIGN KEY (`sponsoredAdId`) REFERENCES `sponsored_ads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
