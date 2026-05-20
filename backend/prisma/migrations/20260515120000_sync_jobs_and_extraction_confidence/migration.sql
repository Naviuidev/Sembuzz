-- QA score for super-admin review (0–100); optional on older rows.
ALTER TABLE `university_events` ADD COLUMN `extractionConfidence` INTEGER NULL;

CREATE INDEX `university_events_extractionConfidence_idx` ON `university_events`(`extractionConfidence`);

-- Background queue for CSV / bulk sync (non-blocking HTTP).
CREATE TABLE `university_sync_jobs` (
  `id` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `batchId` VARCHAR(36) NULL,
  `sourceIds` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `progressDone` INTEGER NOT NULL DEFAULT 0,
  `progressTotal` INTEGER NOT NULL DEFAULT 0,
  `currentSourceId` VARCHAR(36) NULL,
  `message` TEXT NULL,
  `error` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,

  PRIMARY KEY (`id`),
  INDEX `university_sync_jobs_status_createdAt_idx`(`status`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
