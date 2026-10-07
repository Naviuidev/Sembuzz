-- External categories (super admin) and external admin accounts
CREATE TABLE `external_categories` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `external_admins` (
  `id` VARCHAR(191) NOT NULL,
  `refNum` VARCHAR(191) NOT NULL,
  `platformUserId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `external_admins_refNum_key`(`refNum`),
  UNIQUE INDEX `external_admins_platformUserId_key`(`platformUserId`),
  INDEX `external_admins_email_idx`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `external_admin_categories` (
  `id` VARCHAR(191) NOT NULL,
  `externalAdminId` VARCHAR(191) NOT NULL,
  `externalCategoryId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `external_admin_categories_externalAdminId_externalCategoryId_key`(`externalAdminId`, `externalCategoryId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_admins` ADD CONSTRAINT `external_admins_platformUserId_fkey` FOREIGN KEY (`platformUserId`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_admin_categories` ADD CONSTRAINT `external_admin_categories_externalAdminId_fkey` FOREIGN KEY (`externalAdminId`) REFERENCES `external_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `external_admin_categories` ADD CONSTRAINT `external_admin_categories_externalCategoryId_fkey` FOREIGN KEY (`externalCategoryId`) REFERENCES `external_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
