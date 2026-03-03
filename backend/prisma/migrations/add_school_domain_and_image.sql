-- Add domain and image fields to schools table
ALTER TABLE `schools` 
ADD COLUMN `domain` VARCHAR(255) NULL,
ADD COLUMN `image` TEXT NULL;
