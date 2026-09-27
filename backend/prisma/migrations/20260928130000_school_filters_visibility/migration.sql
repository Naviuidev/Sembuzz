-- AlterTable
ALTER TABLE `schools` ADD COLUMN `filtersVisibility` ENUM('BEFORE_LOGIN', 'AFTER_LOGIN', 'BOTH') NULL;
