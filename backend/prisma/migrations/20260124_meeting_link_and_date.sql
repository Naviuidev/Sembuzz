-- Add meetingLink to queries (school admin)
ALTER TABLE `queries` ADD COLUMN `meetingLink` VARCHAR(191) NULL;

-- SuperAdminQuery: meetingDate, meetingLink
ALTER TABLE `super_admin_queries` ADD COLUMN `meetingDate` DATETIME(3) NULL;
ALTER TABLE `super_admin_queries` ADD COLUMN `meetingLink` VARCHAR(191) NULL;

-- SubCategoryAdminQuery: meetingDate, meetingLink
ALTER TABLE `sub_category_admin_queries` ADD COLUMN `meetingDate` DATETIME(3) NULL;
ALTER TABLE `sub_category_admin_queries` ADD COLUMN `meetingLink` VARCHAR(191) NULL;

-- CategoryAdminQuery: meetingDate, meetingLink
ALTER TABLE `category_admin_queries` ADD COLUMN `meetingDate` DATETIME(3) NULL;
ALTER TABLE `category_admin_queries` ADD COLUMN `meetingLink` VARCHAR(191) NULL;
