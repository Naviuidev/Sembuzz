-- CreateTable
CREATE TABLE `school_direct_messaging_settings` (
    `schoolId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`schoolId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userOneId` VARCHAR(191) NOT NULL,
    `userTwoId` VARCHAR(191) NOT NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `direct_conversations_schoolId_userOneId_userTwoId_key`(`schoolId`, `userOneId`, `userTwoId`),
    INDEX `direct_conversations_schoolId_lastMessageAt_idx`(`schoolId`, `lastMessageAt`),
    INDEX `direct_conversations_userOneId_idx`(`userOneId`),
    INDEX `direct_conversations_userTwoId_idx`(`userTwoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderUserId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `direct_messages_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `school_direct_messaging_settings` ADD CONSTRAINT `school_direct_messaging_settings_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_conversations` ADD CONSTRAINT `direct_conversations_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_conversations` ADD CONSTRAINT `direct_conversations_userOneId_fkey` FOREIGN KEY (`userOneId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_conversations` ADD CONSTRAINT `direct_conversations_userTwoId_fkey` FOREIGN KEY (`userTwoId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_messages` ADD CONSTRAINT `direct_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `direct_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direct_messages` ADD CONSTRAINT `direct_messages_senderUserId_fkey` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
