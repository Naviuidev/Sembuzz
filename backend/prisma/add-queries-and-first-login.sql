-- Add isFirstLogin field to school_admins table
-- Note: If column already exists, you'll get an error - that's okay, just skip this step
ALTER TABLE `school_admins` 
ADD COLUMN `isFirstLogin` TINYINT(1) DEFAULT 1 AFTER `isActive`;

-- Create queries table
CREATE TABLE `queries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `schoolAdminId` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `meetingType` VARCHAR(20) NULL,
  `date` DATETIME(3) NULL,
  `timeSlot` VARCHAR(50) NULL,
  `timeZone` VARCHAR(50) NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`schoolAdminId`) REFERENCES `school_admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_queries_schoolAdminId` ON `queries`(`schoolAdminId`);
CREATE INDEX `idx_queries_status` ON `queries`(`status`);
