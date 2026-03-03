-- School social accounts (one per school, multiple rows per school)
CREATE TABLE IF NOT EXISTS `school_social_accounts` (
  `id` VARCHAR(191) NOT NULL,
  `schoolId` VARCHAR(191) NOT NULL,
  `platformId` VARCHAR(191) NOT NULL,
  `platformName` VARCHAR(191) NOT NULL,
  `pageName` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(191) NOT NULL,
  `link` VARCHAR(1000) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `school_social_accounts_schoolId_idx`(`schoolId`),
  CONSTRAINT `school_social_accounts_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
