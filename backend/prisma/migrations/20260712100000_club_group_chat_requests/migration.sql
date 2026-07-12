-- CreateTable
CREATE TABLE `club_group_chat_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `clubKey` VARCHAR(191) NOT NULL,
    `pageName` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedByRole` VARCHAR(191) NULL,
    `reviewedByAdminId` VARCHAR(191) NULL,
    `declineReason` TEXT NULL,
    `clubGroupChatId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `club_group_chat_requests_schoolId_status_createdAt_idx`(`schoolId`, `status`, `createdAt`),
    INDEX `club_group_chat_requests_subCategoryAdminId_createdAt_idx`(`subCategoryAdminId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `club_group_chat_requests` ADD CONSTRAINT `club_group_chat_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_group_chat_requests` ADD CONSTRAINT `club_group_chat_requests_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `club_group_chat_requests` ADD CONSTRAINT `club_group_chat_requests_clubGroupChatId_fkey` FOREIGN KEY (`clubGroupChatId`) REFERENCES `club_group_chats`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
