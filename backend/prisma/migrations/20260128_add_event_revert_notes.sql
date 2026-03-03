ALTER TABLE `events` ADD COLUMN `revertNotes` TEXT NULL;
CREATE INDEX `events_schoolId_idx` ON `events`(`schoolId`);
