-- Link resubmitted events to the original reverted post so corrections can be cleared after approval.
ALTER TABLE `events` ADD COLUMN `resubmitFromEventId` VARCHAR(191) NULL;
CREATE INDEX `events_resubmitFromEventId_idx` ON `events`(`resubmitFromEventId`);
