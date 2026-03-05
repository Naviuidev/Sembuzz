-- Add columns required for create-school (country, state, tenure, domain, image).
-- Safe to run if schools was created from create-tables.sql (no these columns).
-- If columns already exist, this migration will fail; then run: npx prisma migrate resolve --applied 20260122000000_add_schools_extra_columns

ALTER TABLE `schools` ADD COLUMN `country` VARCHAR(255) NULL AFTER `name`;
ALTER TABLE `schools` ADD COLUMN `state` VARCHAR(50) NULL AFTER `country`;
ALTER TABLE `schools` ADD COLUMN `tenure` INT NULL AFTER `city`;
ALTER TABLE `schools` ADD COLUMN `domain` VARCHAR(255) NULL;
ALTER TABLE `schools` ADD COLUMN `image` TEXT NULL;
