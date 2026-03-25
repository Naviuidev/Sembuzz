-- CreateTable
CREATE TABLE `user_notification_inbox` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NULL,
  `schoolId` VARCHAR(191) NULL,
  `schoolName` VARCHAR(191) NULL,
  `schoolLogoUrl` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` VARCHAR(191) NOT NULL,
  `deliveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `readAt` DATETIME(3) NULL,

  INDEX `user_notification_inbox_userId_deliveredAt_idx`(`userId`, `deliveredAt`),
  INDEX `user_notification_inbox_userId_readAt_idx`(`userId`, `readAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_notification_inbox`
ADD CONSTRAINT `user_notification_inbox_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
