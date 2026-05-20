-- Group university_sources by the CSV upload they came from.
-- NULLable so manually-added URL sources (no CSV) coexist cleanly.

ALTER TABLE `university_sources`
  ADD COLUMN `csvBatchId`    VARCHAR(36)  NULL,
  ADD COLUMN `csvFileName`   VARCHAR(500) NULL,
  ADD COLUMN `csvUploadedAt` DATETIME(3)  NULL;

CREATE INDEX `university_sources_csvBatchId_idx` ON `university_sources`(`csvBatchId`);
