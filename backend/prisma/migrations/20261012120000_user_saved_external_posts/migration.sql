-- CreateTable
CREATE TABLE `user_saved_external_posts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `postRequestId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_saved_external_posts_userId_postRequestId_key`(`userId`, `postRequestId`),
    INDEX `user_saved_external_posts_userId_idx`(`userId`),
    INDEX `user_saved_external_posts_postRequestId_idx`(`postRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_saved_external_posts` ADD CONSTRAINT `user_saved_external_posts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_saved_external_posts` ADD CONSTRAINT `user_saved_external_posts_postRequestId_fkey` FOREIGN KEY (`postRequestId`) REFERENCES `external_school_post_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
