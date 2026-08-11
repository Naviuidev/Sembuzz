-- CreateTable
CREATE TABLE `admin_email_change_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `targetRole` VARCHAR(191) NOT NULL,
    `targetAdminId` VARCHAR(191) NOT NULL,
    `targetName` VARCHAR(191) NOT NULL,
    `targetEmail` VARCHAR(191) NOT NULL,
    `initiatedByRole` VARCHAR(191) NOT NULL,
    `initiatedByAdminId` VARCHAR(191) NOT NULL,
    `initiatedByName` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending_otp',
    `reviewerRole` VARCHAR(191) NOT NULL DEFAULT 'school_admin',
    `otp` VARCHAR(6) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `otpUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedByAdminId` VARCHAR(191) NULL,
    `declineReason` TEXT NULL,

    INDEX `admin_email_change_requests_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `admin_email_change_requests_targetRole_targetAdminId_idx`(`targetRole`, `targetAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_email_change_requests` ADD CONSTRAINT `admin_email_change_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
