-- CreateTable
CREATE TABLE `student_chat_group_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedByRole` VARCHAR(191) NULL,
    `reviewedByAdminId` VARCHAR(191) NULL,
    `declineReason` TEXT NULL,
    `studentChatGroupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `student_chat_group_requests_schoolId_status_createdAt_idx`(`schoolId`, `status`, `createdAt`),
    INDEX `student_chat_group_requests_subCategoryAdminId_createdAt_idx`(`subCategoryAdminId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_chat_group_requests` ADD CONSTRAINT `student_chat_group_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_chat_group_requests` ADD CONSTRAINT `student_chat_group_requests_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_chat_group_requests` ADD CONSTRAINT `student_chat_group_requests_studentChatGroupId_fkey` FOREIGN KEY (`studentChatGroupId`) REFERENCES `student_chat_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
