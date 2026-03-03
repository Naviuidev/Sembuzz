-- AlterTable: add external link to banner_ads
ALTER TABLE `banner_ads` ADD COLUMN `externalLink` VARCHAR(1000) NULL;

-- CreateTable: banner ad events (view/click)
CREATE TABLE `banner_ad_events` (
    `id` VARCHAR(191) NOT NULL,
    `bannerAdId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `banner_ad_events_bannerAdId_idx`(`bannerAdId`),
    INDEX `banner_ad_events_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `banner_ad_events` ADD CONSTRAINT `banner_ad_events_bannerAdId_fkey` FOREIGN KEY (`bannerAdId`) REFERENCES `banner_ads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
