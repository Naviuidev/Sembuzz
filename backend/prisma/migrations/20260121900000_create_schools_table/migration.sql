-- Create schools table if not present (required before add_schools_extra_columns).
-- Base columns only; 20260122000000 adds country, state, tenure, domain, image.
CREATE TABLE IF NOT EXISTS `schools` (
    `id` VARCHAR(191) NOT NULL,
    `refNum` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `schools_refNum_key`(`refNum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
