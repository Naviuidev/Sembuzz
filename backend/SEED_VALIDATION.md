# Database seed and admin portal validation

This document describes how to seed the database so **each admin portal** can be validated (login and basic usage).

## Seed order (required for referential integrity)

1. **Features** – `features` table (NEWS, EVENTS, ADS, etc.). Required for super-admin features list and school features.
2. **Super Admin** – `super_admins` table. One account to access `/super-admin`.
3. **School** – `schools` table. At least one school (with `refNum`, `name`, `city`, etc.).
4. **School features** – `school_features` table. Links a school to features (e.g. NEWS, EVENTS, ADS).
5. **School Admin** – `school_admins` table. One per school; login at `/school-admin` (email or refNum).
6. **Category** – `categories` table. Belongs to a school.
7. **SubCategory** – `sub_categories` table. Belongs to a category.
8. **Category Admin** – `category_admins` table + `category_admin_categories` junction. One per category/school; login at `/category-admin`.
9. **SubCategory Admin** – `sub_category_admins` table + `sub_category_admin_sub_categories` junction. One per subcategory/school; login at `/subcategory-admin`.
10. **Ads Admin** – `ads_admins` table. One per school when the school has the ADS feature; login at `/ads-admin`.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Features only | `npm run prisma:seed` | Upsert features (NEWS, EVENTS, ADS, …). |
| Super Admin only | `npm run seed:super-admin` | Interactive: create one super admin (name, email, password). |
| **Full seed (all portals)** | `npm run seed:all` | Features + super admin (if missing) + one demo school with all admin types. Default password for all: `Demo@123`. |

## Full seed: `npm run seed:all`

After running **migrations** (`npx prisma migrate deploy`), run:

```bash
cd backend
npm run seed:all
```

This will:

- Upsert all features.
- Create one Super Admin (`admin@sembuzz.com`) if none exists.
- Create one **Demo School** (ref: `SB-DEMO-000001`) if it doesn’t exist.
- Link the school to NEWS, EVENTS, ADS.
- Create one **School Admin** (`schooladmin@demo.edu`).
- Create one **Category** and one **SubCategory** for that school.
- Create one **Category Admin** (`categoryadmin@demo.edu`) and link to the category.
- Create one **SubCategory Admin** (`subcategoryadmin@demo.edu`) and link to the subcategory.
- Create one **Ads Admin** (`adsadmin@demo.edu`) for that school.

**Password for all demo accounts:** `Demo@123`

## Validating each admin portal

| Portal | Frontend path | Login identifier | Notes |
|--------|----------------|------------------|--------|
| **Super Admin** | `/super-admin` | Email: `admin@sembuzz.com` | Manages schools, features, support. |
| **School Admin** | `/school-admin` | Email: `schooladmin@demo.edu` or Ref: `SB-DEMO-000001` | Manages categories, posts, admins, pending users. |
| **Category Admin** | `/category-admin` | Email: `categoryadmin@demo.edu` | Approves events, manages subcategory admins, queries. |
| **SubCategory Admin** | `/subcategory-admin` | Email: `subcategoryadmin@demo.edu` | Creates events (news), queries. |
| **Ads Admin** | `/ads-admin` | Email: `adsadmin@demo.edu` | Manages banner and sponsored ads for the school. |

## Required database tables (by portal)

- **Super Admin:** `super_admins`, `features` (for features list).
- **School Admin:** `schools`, `school_admins`, `school_features`, `categories`, `sub_categories`, and related tables used by the dashboard.
- **Category Admin:** `category_admins`, `category_admin_categories`, `categories`, `sub_categories`, `schools`, `events`, etc.
- **SubCategory Admin:** `sub_category_admins`, `sub_category_admin_sub_categories`, `sub_categories`, `categories`, `schools`, `events`.
- **Ads Admin:** `ads_admins`, `schools`, `banner_ads`, `sponsored_ads` (tables exist; data optional).
- **Public / User:** `users`, `schools`, `events` (for public events page).

Ensure all migrations are applied so these tables exist. The migrations in `prisma/migrations/` create (or alter) the schema; `seed:all` only inserts data.

## Troubleshooting

- **“Table does not exist”** – Run `npx prisma migrate deploy` and, if needed, fix any failed migration (see recovery docs in the migration folder).
- **“Invalid credentials” / 401** – Confirm the user exists and the password matches (e.g. `Demo@123` for seed:all accounts). For super admin, use `npm run seed:super-admin` to create or recreate.
- **School Admin: “refNum not found”** – Ensure the school exists and the admin’s `schoolId` points to it; seed:all uses refNum `SB-DEMO-000001`.
- **Features list empty (super-admin)** – Run `npm run prisma:seed` or `npm run seed:all` so the `features` table is populated.
