# If migration 20260122000000_add_schools_extra_columns fails

- **"Duplicate column name"**: The column already exists (e.g. you ran add_school_domain_and_image.sql or add-school-fields.sql). Mark as applied: `npx prisma migrate resolve --applied 20260122000000_add_schools_extra_columns`
- **"Table 'schools' doesn't exist"**: Create the schools table first (e.g. run create-tables.sql or an earlier migration), then run `npx prisma migrate deploy` again.
