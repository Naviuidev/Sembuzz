-- CreateTable
CREATE TABLE `blog_posts` (
    `id` VARCHAR(191) NOT NULL,
    `subCategoryAdminId` VARCHAR(191) NOT NULL,
    `subCategoryId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `content` TEXT NOT NULL,
    `coverImageUrl` VARCHAR(2048) NULL,
    `imageUrls` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `published` BOOLEAN NOT NULL DEFAULT false,
    `revertNotes` TEXT NULL,
    `rejectNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_subCategoryAdminId_fkey` FOREIGN KEY (`subCategoryAdminId`) REFERENCES `sub_category_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_subCategoryId_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `blog_posts_subCategoryAdminId_idx` ON `blog_posts`(`subCategoryAdminId`);

-- CreateIndex
CREATE INDEX `blog_posts_subCategoryId_idx` ON `blog_posts`(`subCategoryId`);

-- CreateIndex
CREATE INDEX `blog_posts_categoryId_idx` ON `blog_posts`(`categoryId`);

-- CreateIndex
CREATE INDEX `blog_posts_status_idx` ON `blog_posts`(`status`);

-- CreateIndex
CREATE INDEX `blog_posts_schoolId_idx` ON `blog_posts`(`schoolId`);
