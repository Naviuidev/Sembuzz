import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({} as any);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('=== Super Admin Account Creation ===\n');

  const name = await question('Enter Super Admin name: ');
  const email = await question('Enter Super Admin email: ');
  const password = await question('Enter Super Admin password: ');

  // Check if email already exists
  const existing = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (existing) {
    console.error(`\n❌ Super Admin with email ${email} already exists!`);
    rl.close();
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create super admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  console.log(`\n✅ Super Admin created successfully!`);
  console.log(`   ID: ${superAdmin.id}`);
  console.log(`   Name: ${superAdmin.name}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Created: ${superAdmin.createdAt}`);

  rl.close();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
