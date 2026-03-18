ALTER TABLE `blog_posts` ADD COLUMN `publishedAt` DATETIME(3) NULL;
CREATE INDEX `blog_posts_publishedAt_idx` ON `blog_posts`(`publishedAt`);
UPDATE `blog_posts` SET `publishedAt` = `updatedAt` WHERE `published` = 1 AND `publishedAt` IS NULL;
