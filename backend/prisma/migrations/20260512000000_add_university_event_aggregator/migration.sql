-- ============================================
-- University Event Aggregator
-- Super Admin tool: pulls external university events
-- via OpenAI GPT API. Independent of internal `events` table.
-- ============================================

-- CreateTable: university_sources
CREATE TABLE `university_sources` (
  `id` VARCHAR(191) NOT NULL,
  `universityName` VARCHAR(500) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `lastSyncedAt` DATETIME(3) NULL,
  `lastError` TEXT NULL,
  `totalEvents` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `university_sources_url_key`(`url`),
  INDEX `university_sources_status_idx`(`status`),
  INDEX `university_sources_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: university_events
CREATE TABLE `university_events` (
  `id` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `externalKey` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `summary` TEXT NULL,
  `startDate` DATETIME(3) NULL,
  `endDate` DATETIME(3) NULL,
  `rawDateText` VARCHAR(255) NULL,
  `rawTimeText` VARCHAR(255) NULL,
  `venue` VARCHAR(500) NULL,
  `organizer` VARCHAR(500) NULL,
  `category` VARCHAR(100) NULL,
  `tags` TEXT NULL,
  `registrationLink` VARCHAR(2048) NULL,
  `imageUrl` VARCHAR(2048) NULL,
  `detailUrl` VARCHAR(2048) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `university_events_sourceId_externalKey_key`(`sourceId`, `externalKey`),
  INDEX `university_events_sourceId_idx`(`sourceId`),
  INDEX `university_events_startDate_idx`(`startDate`),
  INDEX `university_events_category_idx`(`category`),
  INDEX `university_events_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: university_event_sync_runs
CREATE TABLE `university_event_sync_runs` (
  `id` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'running',
  `eventsAdded` INTEGER NOT NULL DEFAULT 0,
  `eventsUpdated` INTEGER NOT NULL DEFAULT 0,
  `eventsSkipped` INTEGER NOT NULL DEFAULT 0,
  `error` TEXT NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,

  INDEX `university_event_sync_runs_sourceId_idx`(`sourceId`),
  INDEX `university_event_sync_runs_startedAt_idx`(`startedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `university_events`
  ADD CONSTRAINT `university_events_sourceId_fkey`
  FOREIGN KEY (`sourceId`) REFERENCES `university_sources`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `university_event_sync_runs`
  ADD CONSTRAINT `university_event_sync_runs_sourceId_fkey`
  FOREIGN KEY (`sourceId`) REFERENCES `university_sources`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
