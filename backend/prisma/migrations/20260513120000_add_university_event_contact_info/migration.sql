-- Optional contact line extracted by GPT (email, phone, organizer contact).
ALTER TABLE `university_events` ADD COLUMN `contactInfo` VARCHAR(500) NULL;
