INSERT INTO `features` (`id`, `code`, `name`, `createdAt`)
SELECT UUID(), 'FILTERS', 'Filters', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `features` WHERE `code` = 'FILTERS');
