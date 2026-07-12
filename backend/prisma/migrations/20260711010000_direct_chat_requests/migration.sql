-- AlterTable
ALTER TABLE `direct_conversations` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending';
ALTER TABLE `direct_conversations` ADD COLUMN `requestedByUserId` VARCHAR(191) NULL;
ALTER TABLE `direct_conversations` ADD COLUMN `respondedAt` DATETIME(3) NULL;

-- Existing conversations with messages are treated as accepted
UPDATE `direct_conversations` dc
SET dc.`status` = 'accepted',
    dc.`requestedByUserId` = dc.`userOneId`,
    dc.`respondedAt` = COALESCE(dc.`updatedAt`, dc.`createdAt`)
WHERE EXISTS (
  SELECT 1 FROM `direct_messages` dm WHERE dm.`conversationId` = dc.`id`
);

UPDATE `direct_conversations`
SET `requestedByUserId` = `userOneId`
WHERE `requestedByUserId` IS NULL;

ALTER TABLE `direct_conversations` MODIFY `requestedByUserId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `direct_conversations` ADD CONSTRAINT `direct_conversations_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `direct_conversations_schoolId_status_idx` ON `direct_conversations`(`schoolId`, `status`);
