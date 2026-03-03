-- Seed Features Table
-- Run this in phpMyAdmin SQL tab after selecting the 'sembuzz' database

INSERT INTO `features` (`id`, `code`, `name`, `createdAt`) VALUES
(UUID(), 'NEWS', 'News', NOW()),
(UUID(), 'EVENTS', 'Events', NOW()),
(UUID(), 'ADS', 'Advertisements', NOW()),
(UUID(), 'INSTAGRAM', 'Instagram Feed', NOW()),
(UUID(), 'ANALYTICS', 'Analytics', NOW()),
(UUID(), 'EMERGENCY', 'Emergency Notifications', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
