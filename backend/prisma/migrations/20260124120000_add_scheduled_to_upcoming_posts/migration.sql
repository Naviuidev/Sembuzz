-- Add scheduledTo (optional end date) to upcoming_posts
ALTER TABLE `upcoming_posts` ADD COLUMN `scheduledTo` DATE NULL;
