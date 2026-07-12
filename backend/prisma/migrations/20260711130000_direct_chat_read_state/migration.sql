-- AlterTable
ALTER TABLE `direct_conversations` ADD COLUMN `userOneLastReadAt` DATETIME(3) NULL;
ALTER TABLE `direct_conversations` ADD COLUMN `userTwoLastReadAt` DATETIME(3) NULL;
