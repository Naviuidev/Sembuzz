-- Extra Localist instance dates in the sync month (for "+ N dates" tooltips).
ALTER TABLE `scraped_event_records`
  ADD COLUMN `occurrenceDatesJson` JSON NULL AFTER `endDate`;
