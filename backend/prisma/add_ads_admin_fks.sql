-- Optional: add foreign keys for ads_admins (run manually in phpMyAdmin if you want DB-level referential integrity).
-- Only run after migration 20260301000000_add_ads_admin_and_optional_creator has succeeded.
-- If this fails (errno 150), you can skip it; the app will still work.

ALTER TABLE `ads_admins` ADD CONSTRAINT `ads_admins_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ads_admin_password_reset_otps` ADD CONSTRAINT `ads_admin_password_reset_otps_adsAdminId_fkey` FOREIGN KEY (`adsAdminId`) REFERENCES `ads_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
