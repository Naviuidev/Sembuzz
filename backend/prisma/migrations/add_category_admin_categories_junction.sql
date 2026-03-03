-- Create junction table for CategoryAdmin-Category many-to-many relationship
CREATE TABLE IF NOT EXISTS `category_admin_categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `categoryAdminId` VARCHAR(36) NOT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`categoryAdminId`) REFERENCES `category_admins`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_category_admin_category` (`categoryAdminId`, `categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create junction table for SubCategoryAdmin-SubCategory many-to-many relationship
CREATE TABLE IF NOT EXISTS `sub_category_admin_sub_categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `subCategoryAdminId` VARCHAR(36) NOT NULL,
  `subCategoryId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_sub_category_admin_sub_category` (`subCategoryAdminId`, `subCategoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data: Create junction entries for existing category admins
INSERT INTO `category_admin_categories` (`id`, `categoryAdminId`, `categoryId`, `createdAt`)
SELECT 
  UUID() as `id`,
  `id` as `categoryAdminId`,
  `categoryId`,
  `createdAt`
FROM `category_admins`
WHERE NOT EXISTS (
  SELECT 1 FROM `category_admin_categories` 
  WHERE `category_admin_categories`.`categoryAdminId` = `category_admins`.`id`
);

-- Migrate existing data: Create junction entries for existing subcategory admins
INSERT INTO `sub_category_admin_sub_categories` (`id`, `subCategoryAdminId`, `subCategoryId`, `createdAt`)
SELECT 
  UUID() as `id`,
  `id` as `subCategoryAdminId`,
  `subCategoryId`,
  `createdAt`
FROM `sub_category_admins`
WHERE NOT EXISTS (
  SELECT 1 FROM `sub_category_admin_sub_categories` 
  WHERE `sub_category_admin_sub_categories`.`subCategoryAdminId` = `sub_category_admins`.`id`
);
