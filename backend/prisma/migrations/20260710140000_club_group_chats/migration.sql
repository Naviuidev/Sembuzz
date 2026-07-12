-- Club group chats (school admin config) and student messages
CREATE TABLE `club_group_chats` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `clubKey` VARCHAR(191) NOT NULL,
    `pageName` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `club_group_chats_schoolId_clubKey_key`(`schoolId`, `clubKey`),
    INDEX `club_group_chats_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `club_group_messages` (
    `id` VARCHAR(191) NOT NULL,
    `groupChatId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `club_group_messages_groupChatId_createdAt_idx`(`groupChatId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `club_group_chats` ADD CONSTRAINT `club_group_chats_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_group_messages` ADD CONSTRAINT `club_group_messages_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `club_group_chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_group_messages` ADD CONSTRAINT `club_group_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
