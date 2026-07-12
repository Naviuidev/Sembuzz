-- Messaging features for school feature pipeline (Super Admin → Create School)
INSERT INTO `features` (`id`, `code`, `name`, `createdAt`)
SELECT UUID(), 'GROUP_MESSAGING', 'Group messages', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `features` WHERE `code` = 'GROUP_MESSAGING');

INSERT INTO `features` (`id`, `code`, `name`, `createdAt`)
SELECT UUID(), 'INDIVIDUAL_MESSAGING', 'Individual messages', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `features` WHERE `code` = 'INDIVIDUAL_MESSAGING');
