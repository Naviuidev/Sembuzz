-- SemBuzz Database Tables Creation Script
-- Run this in phpMyAdmin SQL tab after selecting the 'sembuzz' database

-- Create super_admins table
CREATE TABLE IF NOT EXISTS `super_admins` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create schools table
CREATE TABLE IF NOT EXISTS `schools` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `refNum` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create school_admins table
CREATE TABLE IF NOT EXISTS `school_admins` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `schoolId` VARCHAR(36) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create features table
CREATE TABLE IF NOT EXISTS `features` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create school_features table
CREATE TABLE IF NOT EXISTS `school_features` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `schoolId` VARCHAR(36) NOT NULL,
  `featureId` VARCHAR(36) NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `school_features_schoolId_featureId_key` (`schoolId`, `featureId`),
  FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`featureId`) REFERENCES `features`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `school_admins_schoolId_idx` ON `school_admins`(`schoolId`);
CREATE INDEX IF NOT EXISTS `school_features_schoolId_idx` ON `school_features`(`schoolId`);
CREATE INDEX IF NOT EXISTS `school_features_featureId_idx` ON `school_features`(`featureId`);
