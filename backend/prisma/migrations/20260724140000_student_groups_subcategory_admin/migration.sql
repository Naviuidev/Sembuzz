-- Student chat groups are created by subcategory admins, not students
ALTER TABLE `student_chat_groups` DROP FOREIGN KEY `student_chat_groups_createdByUserId_fkey`;
ALTER TABLE `student_chat_groups` MODIFY `createdByUserId` VARCHAR(191) NULL;
ALTER TABLE `student_chat_groups` ADD COLUMN `createdBySubCategoryAdminId` VARCHAR(191) NULL;
ALTER TABLE `student_chat_groups` ADD CONSTRAINT `student_chat_groups_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `student_chat_groups` ADD CONSTRAINT `student_chat_groups_createdBySubCategoryAdminId_fkey` FOREIGN KEY (`createdBySubCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
