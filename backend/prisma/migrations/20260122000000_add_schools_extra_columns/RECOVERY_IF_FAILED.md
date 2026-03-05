# If migration 20260122000000_add_schools_extra_columns fails

- **"Table 'schools' doesn't exist"**: (1) Mark this migration as rolled back: `npx prisma migrate resolve --rolled-back 20260122000000_add_schools_extra_columns`. (2) Pull latest code so migration `20260121900000_create_schools_table` exists (it creates the schools table). (3) Run `npx prisma migrate deploy` again — the create_schools_table migration runs first, then this one.
- **"Duplicate column name"**: The column already exists (e.g. you ran add_school_domain_and_image.sql or add-school-fields.sql). Mark as applied: `npx prisma migrate resolve --applied 20260122000000_add_schools_extra_columns`
