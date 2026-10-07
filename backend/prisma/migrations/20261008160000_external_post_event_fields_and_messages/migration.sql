ALTER TABLE `external_school_post_requests`
  ADD COLUMN `eventDate` DATE NULL,
  ADD COLUMN `eventStartTime` VARCHAR(5) NULL,
  ADD COLUMN `eventEndTime` VARCHAR(5) NULL,
  ADD COLUMN `eventLocation` VARCHAR(500) NULL,
  ADD COLUMN `actionButtons` TEXT NULL,
  ADD COLUMN `commentsEnabled` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `external_school_post_request_messages` (
  `id` VARCHAR(191) NOT NULL,
  `postRequestId` VARCHAR(191) NOT NULL,
  `senderRole` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ext_post_msg_req_idx`(`postRequestId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_school_post_request_messages` ADD CONSTRAINT `ext_post_msg_req_fkey` FOREIGN KEY (`postRequestId`) REFERENCES `external_school_post_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `external_school_post_request_messages` (`id`, `postRequestId`, `senderRole`, `body`, `createdAt`)
SELECT UUID(), `id`, 'school_admin', `schoolAdminMessage`, COALESCE(`reviewedAt`, `updatedAt`)
FROM `external_school_post_requests`
WHERE `schoolAdminMessage` IS NOT NULL AND TRIM(`schoolAdminMessage`) <> '';
