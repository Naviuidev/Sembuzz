-- Scraped event aggregation (roadmap: EventSource / Event / SyncLog)
CREATE TABLE `scraped_event_sources` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `websiteUrl` VARCHAR(2048) NOT NULL,
    `scraperType` VARCHAR(64) NOT NULL DEFAULT 'generic',
    `selectorsJson` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `scraped_event_sources_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `scraped_event_records` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `slug` VARCHAR(320) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(2048) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `venue` VARCHAR(500) NULL,
    `city` VARCHAR(200) NULL,
    `country` VARCHAR(200) NULL,
    `sourceUrl` VARCHAR(2048) NULL,
    `sourceWebsite` VARCHAR(2048) NULL,
    `category` VARCHAR(120) NULL,
    `organizer` VARCHAR(500) NULL,
    `tags` TEXT NULL,
    `dedupeKey` VARCHAR(64) NOT NULL,
    `syncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `scraped_event_records_sourceId_idx`(`sourceId`),
    INDEX `scraped_event_records_slug_idx`(`slug`),
    INDEX `scraped_event_records_startDate_idx`(`startDate`),
    UNIQUE INDEX `scraped_event_records_sourceId_dedupeKey_key`(`sourceId`, `dedupeKey`),
    PRIMARY KEY (`id`),
    CONSTRAINT `scraped_event_records_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `scraped_event_sources` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `scraped_sync_logs` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'running',
    `totalEvents` INTEGER NOT NULL DEFAULT 0,
    `errors` TEXT NULL,

    INDEX `scraped_sync_logs_sourceId_idx`(`sourceId`),
    INDEX `scraped_sync_logs_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `scraped_sync_logs_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `scraped_event_sources` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
