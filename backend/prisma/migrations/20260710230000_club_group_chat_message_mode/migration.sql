-- AlterTable
ALTER TABLE `club_group_chats` ADD COLUMN `messageMode` VARCHAR(191) NOT NULL DEFAULT 'members';

-- AlterTable
ALTER TABLE `club_group_messages` MODIFY `userId` VARCHAR(191) NULL;
ALTER TABLE `club_group_messages` ADD COLUMN `categoryAdminId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `club_group_messages` ADD CONSTRAINT `club_group_messages_categoryAdminId_fkey` FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
