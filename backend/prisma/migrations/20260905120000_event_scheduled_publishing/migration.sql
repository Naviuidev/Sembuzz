-- Scheduled publishing workflow for events
ALTER TABLE `events` MODIFY `subCategoryAdminId` VARCHAR(191) NULL;

ALTER TABLE `events`
  ADD COLUMN `schoolAdminId` VARCHAR(191) NULL AFTER `subCategoryAdminId`,
  ADD COLUMN `publishAt` DATETIME(3) NULL AFTER `status`,
  ADD COLUMN `publishedAt` DATETIME(3) NULL AFTER `publishAt`;

ALTER TABLE `events`
  ADD INDEX `events_schoolAdminId_idx` (`schoolAdminId`),
  ADD INDEX `events_publishAt_idx` (`publishAt`);

ALTER TABLE `events`
  ADD CONSTRAINT `events_schoolAdminId_fkey`
  FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Legacy approved posts are treated as already published
UPDATE `events`
SET `status` = 'published', `publishedAt` = COALESCE(`publishedAt`, `updatedAt`)
WHERE `status` = 'approved';
