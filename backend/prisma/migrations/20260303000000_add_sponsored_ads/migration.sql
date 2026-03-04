-- CreateTable: sponsored_ads (no FK constraints - avoids errno 150 on Hostinger)
CREATE TABLE `sponsored_ads` (
    `id` VARCHAR(191) NOT NULL,
    `categoryAdminId` VARCHAR(36) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `schoolId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `imageUrls` TEXT NULL,
    `externalLink` VARCHAR(1000) NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `sponsored_ads_schoolId_idx`(`schoolId`),
    INDEX `sponsored_ads_startAt_idx`(`startAt`),
    INDEX `sponsored_ads_endAt_idx`(`endAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: sponsored_ad_events (no FK)
CREATE TABLE `sponsored_ad_events` (
    `id` VARCHAR(191) NOT NULL,
    `sponsoredAdId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `sponsored_ad_events_sponsoredAdId_idx`(`sponsoredAdId`),
    INDEX `sponsored_ad_events_createdAt_idx`(`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
