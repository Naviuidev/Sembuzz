-- Subcategory admins moderate club join requests and group chat messages

ALTER TABLE `club_group_messages` ADD COLUMN `subCategoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `club_group_memberships` ADD COLUMN `reviewedBySubCategoryAdminId` VARCHAR(191) NULL;

ALTER TABLE `club_group_messages` ADD CONSTRAINT `club_group_messages_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `club_group_memberships` ADD CONSTRAINT `club_group_memberships_reviewedBySubCategoryAdminId_fkey` FOREIGN KEY (`reviewedBySubCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
