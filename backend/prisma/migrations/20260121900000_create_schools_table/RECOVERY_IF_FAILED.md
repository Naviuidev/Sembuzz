# If migration 20260121900000_create_schools_table fails

- **"Table 'schools' doesn't exist"** is fixed by this migration (it creates the table). If you see a different error, check the message.
- If 20260122000000_add_schools_extra_columns failed earlier with "Table schools doesn't exist", run:
  1. `npx prisma migrate resolve --rolled-back 20260122000000_add_schools_extra_columns`
  2. Pull the latest code (this migration 20260121900000 must be present)
  3. `npx prisma migrate deploy`
