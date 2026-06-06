-- AlterTable
ALTER TABLE `scraped_event_sources` ADD COLUMN `logoUrl` VARCHAR(2048) NULL;

-- CreateIndex
CREATE INDEX `scraped_event_sources_scraperType_idx` ON `scraped_event_sources`(`scraperType`);

-- CreateTable
CREATE TABLE `json_event_uploads` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `json_event_uploads_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `json_event_upload_groups` (
    `id` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(500) NOT NULL,
    `calendarUrl` VARCHAR(2048) NOT NULL,
    `logoUrl` VARCHAR(2048) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `publishedSourceId` VARCHAR(36) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `json_event_upload_groups_uploadId_idx`(`uploadId`),
    INDEX `json_event_upload_groups_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `json_event_upload_events` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `startTime` VARCHAR(64) NULL,
    `endTime` VARCHAR(64) NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `venue` VARCHAR(500) NULL,
    `detailUrl` VARCHAR(2048) NULL,
    `posterUrl` VARCHAR(2048) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `json_event_upload_events_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `json_event_upload_groups` ADD CONSTRAINT `json_event_upload_groups_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `json_event_uploads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `json_event_upload_events` ADD CONSTRAINT `json_event_upload_events_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `json_event_upload_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
