-- AlterTable: add external link to banner_ads
ALTER TABLE `banner_ads` ADD COLUMN `externalLink` VARCHAR(1000) NULL;

-- CreateTable: banner ad events (no FK - avoids errno 150)
CREATE TABLE `banner_ad_events` (
    `id` VARCHAR(191) NOT NULL,
    `bannerAdId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `banner_ad_events_bannerAdId_idx`(`bannerAdId`),
    INDEX `banner_ad_events_createdAt_idx`(`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
