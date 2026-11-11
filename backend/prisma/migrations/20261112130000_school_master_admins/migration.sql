CREATE TABLE `school_master_admins` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(120) NOT NULL,
    `lastName` VARCHAR(120) NOT NULL,
    `accessMethod` VARCHAR(16) NOT NULL DEFAULT 'email',
    `verificationDocumentUrl` VARCHAR(2048) NULL,
    `allowedPortalSections` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFirstLogin` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_master_admins_email_key`(`email`),
    INDEX `school_master_admins_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `school_master_admins` ADD CONSTRAINT `school_master_admins_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
