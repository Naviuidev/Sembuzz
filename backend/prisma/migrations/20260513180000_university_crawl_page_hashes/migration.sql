-- Per-page content fingerprint: skip GPT when cleaned text unchanged since last sync.
CREATE TABLE `university_crawl_page_hashes` (
  `id` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `urlHash` VARCHAR(64) NOT NULL,
  `pageUrl` VARCHAR(2048) NOT NULL,
  `contentHash` VARCHAR(64) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `university_crawl_page_hashes_sourceId_urlHash_key`(`sourceId`, `urlHash`),
  INDEX `university_crawl_page_hashes_sourceId_idx`(`sourceId`),
  CONSTRAINT `university_crawl_page_hashes_sourceId_fkey`
    FOREIGN KEY (`sourceId`) REFERENCES `university_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
