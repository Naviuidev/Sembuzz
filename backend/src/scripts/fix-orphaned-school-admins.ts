/**
 * Find and optionally remove SchoolAdmin rows whose school no longer exists.
 * Fixes: "Inconsistent query result: Field `school` is required to return data, got `null`"
 *
 * Run:
 *   npx tsx src/scripts/fix-orphaned-school-admins.ts        # list only
 *   npx tsx src/scripts/fix-orphaned-school-admins.ts --fix  # list and delete
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

type OrphanRow = { id: string; name: string; email: string; schoolId: string; createdAt: Date };

async function main() {
  const doFix = process.argv.includes('--fix');

  const orphans = await prisma.$queryRaw<OrphanRow[]>`
    SELECT sa.id, sa.name, sa.email, sa.schoolId, sa.createdAt
    FROM school_admins sa
    LEFT JOIN schools s ON s.id = sa.schoolId
    WHERE s.id IS NULL
  `;

  if (orphans.length === 0) {
    console.log('No orphaned SchoolAdmin records found. Prisma Studio should work.');
    return;
  }

  console.log(`Found ${orphans.length} SchoolAdmin record(s) with missing school:\n`);
  orphans.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.email} (id: ${r.id}, schoolId: ${r.schoolId})`);
  });

  if (!doFix) {
    console.log('\nTo remove these records, run: npx tsx src/scripts/fix-orphaned-school-admins.ts --fix');
    return;
  }

  const deleted = await prisma.$executeRaw`
    DELETE sa FROM school_admins sa
    LEFT JOIN schools s ON s.id = sa.schoolId
    WHERE s.id IS NULL
  `;
  console.log(`\nDeleted ${deleted} orphaned record(s). Re-open SchoolAdmin in Prisma Studio.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
