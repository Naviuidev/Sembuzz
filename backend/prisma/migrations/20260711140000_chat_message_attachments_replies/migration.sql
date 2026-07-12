-- AlterTable club_group_messages
ALTER TABLE `club_group_messages` ADD COLUMN `attachmentUrl` VARCHAR(1000) NULL;
ALTER TABLE `club_group_messages` ADD COLUMN `attachmentType` VARCHAR(191) NULL;
ALTER TABLE `club_group_messages` ADD COLUMN `attachmentName` VARCHAR(500) NULL;
ALTER TABLE `club_group_messages` ADD COLUMN `replyToMessageId` VARCHAR(191) NULL;

-- AlterTable direct_messages
ALTER TABLE `direct_messages` ADD COLUMN `attachmentUrl` VARCHAR(1000) NULL;
ALTER TABLE `direct_messages` ADD COLUMN `attachmentType` VARCHAR(191) NULL;
ALTER TABLE `direct_messages` ADD COLUMN `attachmentName` VARCHAR(500) NULL;
ALTER TABLE `direct_messages` ADD COLUMN `replyToMessageId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `club_group_messages` ADD CONSTRAINT `club_group_messages_replyToMessageId_fkey` FOREIGN KEY (`replyToMessageId`) REFERENCES `club_group_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_messages` ADD CONSTRAINT `direct_messages_replyToMessageId_fkey` FOREIGN KEY (`replyToMessageId`) REFERENCES `direct_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `club_group_messages_replyToMessageId_idx` ON `club_group_messages`(`replyToMessageId`);
CREATE INDEX `direct_messages_replyToMessageId_idx` ON `direct_messages`(`replyToMessageId`);
