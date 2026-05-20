-- QA/debug metadata for sync runs (months covered, samples, fetch path)
ALTER TABLE `scraped_sync_logs` ADD COLUMN `detailsJson` JSON NULL;
