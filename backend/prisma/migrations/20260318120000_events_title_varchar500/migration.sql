-- Allow longer event titles (was VARCHAR(191) in early migrations; DTO allows 500)
ALTER TABLE `events` MODIFY `title` VARCHAR(500) NOT NULL;
