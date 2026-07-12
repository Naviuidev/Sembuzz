CREATE TABLE `club_group_memberships` (
    `id` VARCHAR(191) NOT NULL,
    `groupChatId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedByCategoryAdminId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `club_group_memberships_groupChatId_userId_key`(`groupChatId`, `userId`),
    INDEX `club_group_memberships_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `club_group_memberships_groupChatId_idx`(`groupChatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `club_group_memberships` ADD CONSTRAINT `club_group_memberships_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `club_group_chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_group_memberships` ADD CONSTRAINT `club_group_memberships_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_group_memberships` ADD CONSTRAINT `club_group_memberships_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_group_memberships` ADD CONSTRAINT `club_group_memberships_reviewedByCategoryAdminId_fkey` FOREIGN KEY (`reviewedByCategoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
