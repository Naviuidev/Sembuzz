-- AlterTable
ALTER TABLE `direct_conversations` ADD COLUMN `blockedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `blockedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `direct_conversations_blockedByUserId_idx` ON `direct_conversations`(`blockedByUserId`);

-- AddForeignKey
ALTER TABLE `direct_conversations` ADD CONSTRAINT `direct_conversations_blockedByUserId_fkey` FOREIGN KEY (`blockedByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
