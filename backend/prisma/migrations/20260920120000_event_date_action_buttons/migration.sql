-- Event occurrence date and optional CTA buttons (label + URL), e.g. calendar links
ALTER TABLE `events` ADD COLUMN `eventDate` DATE NULL;
ALTER TABLE `events` ADD COLUMN `actionButtons` TEXT NULL;
