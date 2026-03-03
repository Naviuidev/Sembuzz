-- Add country, state, and tenure fields to schools table
-- Run this in phpMyAdmin or MySQL client

ALTER TABLE `schools` 
ADD COLUMN `country` VARCHAR(10) NULL AFTER `name`,
ADD COLUMN `state` VARCHAR(50) NULL AFTER `country`,
ADD COLUMN `tenure` INT NULL AFTER `city`;
