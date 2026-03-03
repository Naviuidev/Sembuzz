/**
 * List all Super Admin accounts (id, name, email).
 * Use this to see which email to use for login. Passwords are hashed and cannot be shown.
 * Run: npm run list:super-admins
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.superAdmin.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  if (admins.length === 0) {
    console.log('No Super Admin accounts found.');
    console.log('Create one with: npm run seed:super-admin');
    return;
  }

  console.log('Super Admin accounts (use email + your password to login at /super-admin):\n');
  admins.forEach((a, i) => {
    console.log(`  ${i + 1}. Email: ${a.email}`);
    console.log(`     Name: ${a.name}`);
    console.log(`     ID:   ${a.id}`);
    console.log(`     Created: ${a.createdAt.toISOString()}`);
    console.log('');
  });
  console.log('Password is not stored in plain text. If you forgot it, run: npm run seed:super-admin (use a new email).');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
