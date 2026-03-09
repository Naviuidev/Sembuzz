-- Fix "Inconsistent query result: Field `school` is required to return data, got `null`"
-- This happens when school_admins.schoolId points to a school that no longer exists.
-- Run these in order (e.g. in MySQL Workbench, phpMyAdmin, or: mysql -u user -p database < fix-orphaned-school-admins.sql)

-- 1) Find orphaned SchoolAdmin records (schoolId not in schools)
SELECT sa.id, sa.name, sa.email, sa.schoolId, sa.createdAt
FROM school_admins sa
LEFT JOIN schools s ON s.id = sa.schoolId
WHERE s.id IS NULL;

-- 2) Optional: delete orphaned SchoolAdmin records (uncomment and run only after reviewing step 1)
-- DELETE sa FROM school_admins sa
-- LEFT JOIN schools s ON s.id = sa.schoolId
-- WHERE s.id IS NULL;
