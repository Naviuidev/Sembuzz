-- Add hero overlay and content blocks to blog_posts (optional; existing rows unchanged)
ALTER TABLE `blog_posts` ADD COLUMN `heroTitle` VARCHAR(300) NULL;
ALTER TABLE `blog_posts` ADD COLUMN `heroParagraph` TEXT NULL;
ALTER TABLE `blog_posts` ADD COLUMN `heroButtonText` VARCHAR(120) NULL;
ALTER TABLE `blog_posts` ADD COLUMN `heroButtonLink` VARCHAR(2048) NULL;
ALTER TABLE `blog_posts` ADD COLUMN `contentBlocks` JSON NULL;
