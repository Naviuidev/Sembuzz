import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// For Prisma 7, we can pass the connection string via environment variable
// The client will read DATABASE_URL automatically
const prisma = new PrismaClient({
  // @ts-ignore - Prisma 7 internal API
  __internal: {
    engine: {
      connect: async () => {
        // Use direct connection
        return process.env.DATABASE_URL;
      }
    }
  }
} as any);

async function main() {
  console.log('Seeding features...');

  const features = [
    { code: 'NEWS', name: 'News' },
    { code: 'EVENTS', name: 'Events' },
    { code: 'ADS', name: 'Advertisements' },
    { code: 'INSTAGRAM', name: 'Instagram Feed' },
    { code: 'ANALYTICS', name: 'Analytics' },
    { code: 'EMERGENCY', name: 'Emergency Notifications' },
  ];

  for (const feature of features) {
    const result = await prisma.feature.upsert({
      where: { code: feature.code },
      update: {},
      create: feature,
    });
    console.log(`✓ Feature ${result.code} (${result.name}) seeded`);
  }

  console.log('Features seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
