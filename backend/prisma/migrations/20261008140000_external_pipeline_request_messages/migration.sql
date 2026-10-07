CREATE TABLE `external_pipeline_request_messages` (
  `id` VARCHAR(191) NOT NULL,
  `pipelineRequestId` VARCHAR(191) NOT NULL,
  `senderRole` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ext_pipeline_msg_req_idx`(`pipelineRequestId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `external_pipeline_request_messages` ADD CONSTRAINT `ext_pipeline_msg_req_fkey` FOREIGN KEY (`pipelineRequestId`) REFERENCES `external_category_school_pipeline_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `external_pipeline_request_messages` (`id`, `pipelineRequestId`, `senderRole`, `body`, `createdAt`)
SELECT UUID(), `id`, 'external_admin', `requestMessage`, `createdAt`
FROM `external_category_school_pipeline_requests`
WHERE `requestMessage` IS NOT NULL AND TRIM(`requestMessage`) <> '';

INSERT INTO `external_pipeline_request_messages` (`id`, `pipelineRequestId`, `senderRole`, `body`, `createdAt`)
SELECT UUID(), `id`, 'school_admin', `schoolAdminMessage`, COALESCE(`reviewedAt`, `updatedAt`)
FROM `external_category_school_pipeline_requests`
WHERE `schoolAdminMessage` IS NOT NULL AND TRIM(`schoolAdminMessage`) <> '';
