/**
 * Find and optionally remove Category rows whose school no longer exists.
 * Fixes Prisma Studio error: "Field school is required to return data, got 'null' instead"
 *
 * Run:
 *   npx tsx src/scripts/fix-orphaned-categories.ts        # list only
 *   npx tsx src/scripts/fix-orphaned-categories.ts --fix  # list and delete
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

type OrphanRow = { id: string; schoolId: string; name: string; createdAt: Date };

async function main() {
  const doFix = process.argv.includes('--fix');

  const orphans = await prisma.$queryRaw<OrphanRow[]>`
    SELECT c.id, c.schoolId, c.name, c.createdAt
    FROM categories c
    LEFT JOIN schools s ON s.id = c.schoolId
    WHERE s.id IS NULL
  `;

  if (orphans.length === 0) {
    console.log('No orphaned Category records found. Prisma Studio should work.');
    return;
  }

  console.log(`Found ${orphans.length} Category record(s) with missing school:\n`);
  orphans.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} (id: ${r.id}, schoolId: ${r.schoolId})`);
  });

  if (!doFix) {
    console.log('\nTo remove these records, run: npx tsx src/scripts/fix-orphaned-categories.ts --fix');
    return;
  }

  const ids = orphans.map((o) => o.id);
  const result = await prisma.category.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`\nDeleted ${result.count} orphaned Category record(s). Re-open Category in Prisma Studio.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
