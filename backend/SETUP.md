# SemBuzz Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="mysql://username:password@localhost:3306/sembuzz?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
```

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

3. **Run Database Migrations**
   ```bash
   npm run prisma:migrate
   ```
   This will create the database schema.

4. **Seed Features**
   ```bash
   npm run prisma:seed
   ```
   This seeds the master features table (NEWS, EVENTS, ADS, etc.)

5. **Create Super Admin Account** (Manual)
   
   You'll need to manually create the first Super Admin account. You can do this by:
   - Using Prisma Studio: `npx prisma studio`
   - Or creating a seed script for super admin
   - Or using a database client to insert directly

   Example SQL (after hashing password with bcrypt):
   ```sql
   INSERT INTO super_admins (id, name, email, password, createdAt, updatedAt)
   VALUES (UUID(), 'Super Admin', 'admin@sembuzz.com', '$2b$10$hashedpasswordhere', NOW(), NOW());
   ```

6. **Start Development Server**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Super Admin Auth
- `POST /super-admin/auth/login` - Login
- `POST /super-admin/auth/logout` - Logout (requires auth)
- `GET /super-admin/auth/me` - Get current user (requires auth)

### School Management (requires Super Admin auth)
- `POST /super-admin/schools` - Create school
- `GET /super-admin/schools` - List all schools
- `GET /super-admin/schools/:id` - Get school details
- `PUT /super-admin/schools/:id` - Update school configuration

## Testing

Run unit tests:
```bash
npm run test
```

Run E2E tests:
```bash
npm run test:e2e
```

## Notes

- The Prisma client is generated to `generated/prisma` directory
- Make sure MySQL is running before running migrations
- JWT tokens expire after 24 hours (configurable in auth.module.ts)
- Temporary passwords for School Admins are returned in the response (remove in production)
