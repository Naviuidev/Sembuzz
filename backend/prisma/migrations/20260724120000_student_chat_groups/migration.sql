-- Student-created chat groups (public/private, unlimited memberships per student)

CREATE TABLE `student_chat_groups` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `avatarUrl` VARCHAR(1000) NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `createdByUserId` VARCHAR(191) NOT NULL,
    `lastMessageAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_chat_groups_schoolId_visibility_isActive_idx`(`schoolId`, `visibility`, `isActive`),
    INDEX `student_chat_groups_schoolId_lastMessageAt_idx`(`schoolId`, `lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_chat_group_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `lastReadAt` DATETIME(3) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_chat_group_members_groupId_userId_key`(`groupId`, `userId`),
    INDEX `student_chat_group_members_userId_status_idx`(`userId`, `status`),
    INDEX `student_chat_group_members_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `student_chat_group_members_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_chat_group_messages` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `senderUserId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(1000) NULL,
    `attachmentType` VARCHAR(191) NULL,
    `attachmentName` VARCHAR(500) NULL,
    `replyToMessageId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_chat_group_messages_groupId_createdAt_idx`(`groupId`, `createdAt`),
    INDEX `student_chat_group_messages_replyToMessageId_idx`(`replyToMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_chat_groups` ADD CONSTRAINT `student_chat_groups_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_chat_groups` ADD CONSTRAINT `student_chat_groups_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_chat_group_members` ADD CONSTRAINT `student_chat_group_members_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `student_chat_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_chat_group_members` ADD CONSTRAINT `student_chat_group_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_chat_group_members` ADD CONSTRAINT `student_chat_group_members_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_chat_group_messages` ADD CONSTRAINT `student_chat_group_messages_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `student_chat_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_chat_group_messages` ADD CONSTRAINT `student_chat_group_messages_senderUserId_fkey` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_chat_group_messages` ADD CONSTRAINT `student_chat_group_messages_replyToMessageId_fkey` FOREIGN KEY (`replyToMessageId`) REFERENCES `student_chat_group_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
