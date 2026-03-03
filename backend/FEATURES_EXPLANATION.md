# What Are Features and Why Seed Them?

## 🎯 What Are Features?

**Features** are the **configurable modules** that schools can opt into. Think of them as "add-on capabilities" that each school can enable or disable.

### The 6 Core Features:

1. **NEWS** - Allows schools to publish news articles
2. **EVENTS** - Allows schools to create and manage events
3. **ADS** - Allows schools to post advertisements
4. **INSTAGRAM** - Allows schools to integrate Instagram feed
5. **ANALYTICS** - Provides analytics and reporting for schools
6. **EMERGENCY** - Allows schools to send emergency notifications

## 🔄 How Features Work

### 1. Master Features Table (`features`)
- Contains the **list of all available features** in the platform
- This is a **static/master list** - seeded once
- Each feature has:
  - `id` - Unique identifier
  - `code` - Short code (NEWS, EVENTS, etc.)
  - `name` - Display name

### 2. School-Feature Mapping (`school_features`)
- Links **which features each school has enabled**
- One school can have multiple features
- Example:
  - School A → NEWS + EVENTS
  - School B → NEWS + ADS + INSTAGRAM
  - School C → EVENTS only

## 🎯 Why Seed Features?

### The Problem:
When you create a new school, you need to specify which features that school should have:

```json
POST /super-admin/schools
{
  "schoolName": "ABC High School",
  "city": "New York",
  "selectedFeatures": ["NEWS", "EVENTS", "ADS"],  // ← These must exist in database!
  "adminName": "John Doe",
  "adminEmail": "john@abcschool.com"
}
```

### The Solution:
**Seed the features first** so they exist in the database. Then when creating a school:
1. The API validates that the feature codes exist
2. Creates the school
3. Maps the selected features to that school

## 📋 What the Seed Script Does

The `seed-features.sql` script:

```sql
INSERT INTO `features` (`id`, `code`, `name`, `createdAt`) VALUES
(UUID(), 'NEWS', 'News', NOW()),
(UUID(), 'EVENTS', 'Events', NOW()),
(UUID(), 'ADS', 'Advertisements', NOW()),
(UUID(), 'INSTAGRAM', 'Instagram Feed', NOW()),
(UUID(), 'ANALYTICS', 'Analytics', NOW()),
(UUID(), 'EMERGENCY', 'Emergency Notifications', NOW())
```

This creates 6 records in the `features` table, making them available for schools to use.

## 🔍 Real-World Example

### Scenario: Creating a School

**Step 1:** Features must exist (seed them first)
```
features table:
- NEWS (id: abc-123)
- EVENTS (id: def-456)
- ADS (id: ghi-789)
```

**Step 2:** Create school with selected features
```json
{
  "schoolName": "Greenwood High",
  "selectedFeatures": ["NEWS", "EVENTS"]  // ← References the codes above
}
```

**Step 3:** System creates mappings
```
school_features table:
- schoolId: xyz-999, featureId: abc-123 (NEWS) ✅
- schoolId: xyz-999, featureId: def-456 (EVENTS) ✅
```

**Result:** Greenwood High now has NEWS and EVENTS enabled, but not ADS, INSTAGRAM, etc.

## 🚫 What Happens Without Seeding?

If you try to create a school **without seeding features first**:

```json
POST /super-admin/schools
{
  "selectedFeatures": ["NEWS", "EVENTS"]
}
```

**Error:** `Feature with code NEWS not found`

Because the `features` table is empty!

## ✅ When to Seed

**Seed features:**
- ✅ **Once** when setting up the database
- ✅ **Before** creating any schools
- ✅ After creating the database tables

**You only need to seed once** - the features are permanent and don't change.

## 🎯 Summary

**Features = Available capabilities** (NEWS, EVENTS, etc.)
**Seeding = Populating the master list** so schools can select them
**School-Feature Mapping = Which features each school has enabled**

Without seeding, you can't create schools because there are no features to select from!
