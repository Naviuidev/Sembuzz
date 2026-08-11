-- CreateTable
CREATE TABLE `club_group_chat_delete_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `clubGroupChatId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedByRole` VARCHAR(191) NULL,
    `reviewedByAdminId` VARCHAR(191) NULL,
    `declineReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `cgcc_del_req_school_status_created_idx`(`schoolId`, `status`, `createdAt`),
    INDEX `cgcc_del_req_subcat_created_idx`(`subCategoryAdminId`, `createdAt`),
    INDEX `cgcc_del_req_chat_status_idx`(`clubGroupChatId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_chat_group_delete_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `studentChatGroupId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedByRole` VARCHAR(191) NULL,
    `reviewedByAdminId` VARCHAR(191) NULL,
    `declineReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `scg_del_req_school_status_created_idx`(`schoolId`, `status`, `createdAt`),
    INDEX `scg_del_req_subcat_created_idx`(`subCategoryAdminId`, `createdAt`),
    INDEX `scg_del_req_group_status_idx`(`studentChatGroupId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `club_group_chat_delete_requests` ADD CONSTRAINT `club_group_chat_delete_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_group_chat_delete_requests` ADD CONSTRAINT `club_group_chat_delete_requests_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_group_chat_delete_requests` ADD CONSTRAINT `club_group_chat_delete_requests_clubGroupChatId_fkey` FOREIGN KEY (`clubGroupChatId`) REFERENCES `club_group_chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_chat_group_delete_requests` ADD CONSTRAINT `student_chat_group_delete_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_chat_group_delete_requests` ADD CONSTRAINT `student_chat_group_delete_requests_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_chat_group_delete_requests` ADD CONSTRAINT `student_chat_group_delete_requests_studentChatGroupId_fkey` FOREIGN KEY (`studentChatGroupId`) REFERENCES `student_chat_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
