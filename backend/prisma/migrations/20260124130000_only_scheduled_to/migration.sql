-- Migrate to single date: scheduledTo only (mandatory)
-- 1. Backfill scheduledTo from scheduledDate where scheduledTo is NULL
UPDATE `upcoming_posts` SET `scheduledTo` = `scheduledDate` WHERE `scheduledTo` IS NULL;

-- 2. Drop scheduledDate
ALTER TABLE `upcoming_posts` DROP COLUMN `scheduledDate`;

-- 3. Make scheduledTo NOT NULL (already has values from step 1)
ALTER TABLE `upcoming_posts` MODIFY COLUMN `scheduledTo` DATE NOT NULL;
