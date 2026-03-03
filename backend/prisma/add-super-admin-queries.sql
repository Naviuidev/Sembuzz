-- Create super_admin_queries table
CREATE TABLE IF NOT EXISTS `super_admin_queries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `superAdminId` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `meetingType` VARCHAR(20) NULL,
  `timeZone` VARCHAR(50) NULL,
  `timeSlot` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `customMessage` TEXT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_super_admin_queries_superAdminId` ON `super_admin_queries`(`superAdminId`);
CREATE INDEX `idx_super_admin_queries_status` ON `super_admin_queries`(`status`);
