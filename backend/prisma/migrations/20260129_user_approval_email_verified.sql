-- Add approvalEmailVerifiedAt for post-approval email verification (gmail flow)
ALTER TABLE `users` ADD COLUMN `approvalEmailVerifiedAt` DATETIME(3) NULL;
