# Step-by-Step: Seed Features in phpMyAdmin

## 🎯 Goal
Add the 6 core features (NEWS, EVENTS, ADS, INSTAGRAM, ANALYTICS, EMERGENCY) to your database.

## 📋 Steps

### Step 1: Open phpMyAdmin
1. Open your browser
2. Go to: `http://localhost/phpmyadmin`
3. You should see the phpMyAdmin interface

### Step 2: Select the Database
1. In the **left sidebar**, find and click on **`sembuzz`** database
2. The database should be highlighted/selected

### Step 3: Open SQL Tab
1. Click on the **"SQL"** tab at the top of phpMyAdmin
2. You'll see a large text area for SQL queries

### Step 4: Copy the SQL Script
Open the file: `backend/prisma/seed-features.sql`

**Copy this entire SQL:**

```sql
INSERT INTO `features` (`id`, `code`, `name`, `createdAt`) VALUES
(UUID(), 'NEWS', 'News', NOW()),
(UUID(), 'EVENTS', 'Events', NOW()),
(UUID(), 'ADS', 'Advertisements', NOW()),
(UUID(), 'INSTAGRAM', 'Instagram Feed', NOW()),
(UUID(), 'ANALYTICS', 'Analytics', NOW()),
(UUID(), 'EMERGENCY', 'Emergency Notifications', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
```

### Step 5: Paste and Execute
1. **Paste** the SQL into the text area in phpMyAdmin
2. Click the **"Go"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 6: Verify Success
You should see:
- ✅ **Success message** (e.g., "6 rows affected")
- ✅ **No errors**

### Step 7: Check the Results
1. Click on the **`features`** table in the left sidebar
2. Click the **"Browse"** tab
3. You should see **6 rows**:
   - NEWS
   - EVENTS
   - ADS
   - INSTAGRAM
   - ANALYTICS
   - EMERGENCY

## ✅ Success!

If you see all 6 features in the table, you're done! The features are now available for schools to use.

## 🔍 Troubleshooting

**Error: "Table 'features' doesn't exist"**
- Make sure you created the tables first using `create-tables.sql`
- Check that you selected the `sembuzz` database

**Error: "Duplicate entry"**
- This is okay! The `ON DUPLICATE KEY UPDATE` clause handles this
- Features are already seeded, you're good to go

**No rows inserted**
- Check that the `features` table exists
- Verify you're in the correct database (`sembuzz`)

## 🎯 Next Step

After seeding features, you can:
1. Create a super admin account
2. Start creating schools with selected features
