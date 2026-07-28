/**
 * Full database seed: features, super admin, one school with all admin types.
 * Use to validate every admin portal (super-admin, school-admin, category-admin, subcategory-admin, ads-admin).
 *
 * Run: npm run seed:all
 * Default password for all demo accounts: Demo@123
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Demo@123';
const DEMO_REF = 'SB-DEMO-000001';

async function ensurePlatformUser(email: string) {
  const normalized = email.toLowerCase().trim();
  return prisma.platformUser.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized },
  });
}

async function main() {
  console.log('=== Full database seed (all admin portals) ===\n');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Features (required for super-admin features list and school features)
  console.log('1. Seeding features...');
  const featureCodes = [
    'NEWS',
    'EVENTS',
    'ADS',
    'INSTAGRAM',
    'ANALYTICS',
    'EMERGENCY',
    'GROUP_MESSAGING',
    'INDIVIDUAL_MESSAGING',
  ];
  const featureNames: Record<string, string> = {
    NEWS: 'News',
    EVENTS: 'Events',
    ADS: 'Advertisements',
    INSTAGRAM: 'Instagram Feed',
    ANALYTICS: 'Analytics',
    EMERGENCY: 'Emergency Notifications',
    GROUP_MESSAGING: 'Group messages',
    INDIVIDUAL_MESSAGING: 'Individual messages',
  };
  const features: { id: string; code: string; name: string }[] = [];
  for (const code of featureCodes) {
    const f = await prisma.feature.upsert({
      where: { code },
      update: {},
      create: { code, name: featureNames[code] },
    });
    features.push(f);
  }
  console.log(`   ✓ ${features.length} features\n`);

  // 2. Super Admin (if none exists)
  let superAdmin = await prisma.superAdmin.findFirst();
  if (!superAdmin) {
    const platformUser = await ensurePlatformUser('admin@sembuzz.com');
    superAdmin = await prisma.superAdmin.create({
      data: {
        platformUserId: platformUser.id,
        name: 'Super Admin',
        email: platformUser.email,
        password: hashedPassword,
      },
    });
    console.log('2. Created Super Admin: admin@sembuzz.com');
  } else {
    console.log('2. Super Admin already exists (skip create)');
  }
  console.log('');

  // 3. School (create demo school if refNum not exists)
  let school = await prisma.school.findUnique({ where: { refNum: DEMO_REF } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        refNum: DEMO_REF,
        name: 'Demo School',
        city: 'Demo City',
        country: 'US',
        state: 'CA',
        domain: 'demo.edu',
        isActive: true,
      },
    });
    console.log('3. Created Demo School:', school.name, `(ref: ${school.refNum})`);
  } else {
    console.log('3. Demo school already exists:', school.refNum);
  }
  console.log('');

  // 4. School features (NEWS, EVENTS, ADS)
  const newsFeature = features.find((f) => f.code === 'NEWS')!;
  const eventsFeature = features.find((f) => f.code === 'EVENTS')!;
  const adsFeature = features.find((f) => f.code === 'ADS')!;
  for (const feature of [newsFeature, eventsFeature, adsFeature]) {
    await prisma.schoolFeature.upsert({
      where: {
        schoolId_featureId: { schoolId: school.id, featureId: feature.id },
      },
      update: { isEnabled: true },
      create: { schoolId: school.id, featureId: feature.id, isEnabled: true },
    });
  }
  console.log('4. School features linked (NEWS, EVENTS, ADS)\n');

  // 5. School Admin
  const schoolAdminEmail = 'schooladmin@demo.edu';
  const schoolAdminPlatformUser = await ensurePlatformUser(schoolAdminEmail);
  let schoolAdmin = await prisma.schoolAdmin.findFirst({
    where: { schoolId: school.id, platformUserId: schoolAdminPlatformUser.id },
  });
  if (!schoolAdmin) {
    schoolAdmin = await prisma.schoolAdmin.create({
      data: {
        platformUserId: schoolAdminPlatformUser.id,
        name: 'School Admin',
        email: schoolAdminPlatformUser.email,
        password: hashedPassword,
        schoolId: school.id,
        isActive: true,
        isFirstLogin: false,
      },
    });
    console.log('5. Created School Admin:', schoolAdminEmail);
  } else {
    console.log('5. School Admin already exists:', schoolAdminEmail);
  }
  console.log('');

  // 6. Category
  let category = await prisma.category.findFirst({ where: { schoolId: school.id } });
  if (!category) {
    category = await prisma.category.create({
      data: { schoolId: school.id, name: 'Demo Category' },
    });
    console.log('6. Created Category:', category.name);
  } else {
    console.log('6. Category already exists:', category.name);
  }
  console.log('');

  // 7. SubCategory
  let subCategory = await prisma.subCategory.findFirst({
    where: { categoryId: category.id },
  });
  if (!subCategory) {
    subCategory = await prisma.subCategory.create({
      data: { categoryId: category.id, name: 'Demo SubCategory' },
    });
    console.log('7. Created SubCategory:', subCategory.name);
  } else {
    console.log('7. SubCategory already exists:', subCategory.name);
  }
  console.log('');

  // 8. Category Admin + junction
  const categoryAdminEmail = 'categoryadmin@demo.edu';
  const categoryAdminPlatformUser = await ensurePlatformUser(categoryAdminEmail);
  let categoryAdmin = await prisma.categoryAdmin.findFirst({
    where: { schoolId: school.id, platformUserId: categoryAdminPlatformUser.id },
  });
  if (!categoryAdmin) {
    const created = await prisma.categoryAdmin.create({
      data: {
        platformUserId: categoryAdminPlatformUser.id,
        name: 'Category Admin',
        email: categoryAdminPlatformUser.email,
        password: hashedPassword,
        categoryId: category.id,
        schoolId: school.id,
        isActive: true,
        isFirstLogin: false,
      },
    });
    categoryAdmin = created;
    await prisma.categoryAdminCategory.upsert({
      where: {
        categoryAdminId_categoryId: {
          categoryAdminId: created.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        categoryAdminId: created.id,
        categoryId: category.id,
      },
    });
    console.log('8. Created Category Admin:', categoryAdminEmail);
  } else {
    console.log('8. Category Admin already exists:', categoryAdminEmail);
  }
  console.log('');

  // 9. SubCategory Admin + junction
  const subCategoryAdminEmail = 'subcategoryadmin@demo.edu';
  const subCategoryAdminPlatformUser = await ensurePlatformUser(subCategoryAdminEmail);
  let subCategoryAdmin = await prisma.subCategoryAdmin.findFirst({
    where: { schoolId: school.id, platformUserId: subCategoryAdminPlatformUser.id },
  });
  if (!subCategoryAdmin) {
    const created = await prisma.subCategoryAdmin.create({
      data: {
        platformUserId: subCategoryAdminPlatformUser.id,
        name: 'SubCategory Admin',
        email: subCategoryAdminPlatformUser.email,
        password: hashedPassword,
        subCategoryId: subCategory.id,
        categoryId: category.id,
        schoolId: school.id,
        isActive: true,
        isFirstLogin: false,
      },
    });
    subCategoryAdmin = created;
    await prisma.subCategoryAdminSubCategory.upsert({
      where: {
        subCategoryAdminId_subCategoryId: {
          subCategoryAdminId: created.id,
          subCategoryId: subCategory.id,
        },
      },
      update: {},
      create: {
        subCategoryAdminId: created.id,
        subCategoryId: subCategory.id,
      },
    });
    console.log('9. Created SubCategory Admin:', subCategoryAdminEmail);
  } else {
    console.log('9. SubCategory Admin already exists:', subCategoryAdminEmail);
  }
  console.log('');

  // 10. Ads Admin (school has ADS feature)
  const adsAdminEmail = 'adsadmin@demo.edu';
  const adsAdminPlatformUser = await ensurePlatformUser(adsAdminEmail);
  let adsAdmin = await prisma.adsAdmin.findFirst({
    where: { schoolId: school.id, platformUserId: adsAdminPlatformUser.id },
  });
  if (!adsAdmin) {
    adsAdmin = await prisma.adsAdmin.create({
      data: {
        platformUserId: adsAdminPlatformUser.id,
        name: 'Ads Admin',
        email: adsAdminPlatformUser.email,
        password: hashedPassword,
        schoolId: school.id,
        isActive: true,
        isFirstLogin: false,
      },
    });
    console.log('10. Created Ads Admin:', adsAdminEmail);
  } else {
    console.log('10. Ads Admin already exists:', adsAdminEmail);
  }

  // Summary
  console.log('\n=== Seed complete. Use these to validate each portal ===\n');
  console.log('Password for all demo accounts:', DEFAULT_PASSWORD);
  console.log('');
  console.log('| Portal            | URL (relative)     | Login (email / ref)     |');
  console.log('|-------------------|--------------------|-------------------------|');
  console.log('| Super Admin       | /super-admin       | admin@sembuzz.com       |');
  console.log('| School Admin      | /school-admin      | schooladmin@demo.edu or ' + DEMO_REF + ' |');
  console.log('| Category Admin    | /category-admin    | categoryadmin@demo.edu  |');
  console.log('| SubCategory Admin | /subcategory-admin | subcategoryadmin@demo.edu|');
  console.log('| Ads Admin         | /ads-admin         | adsadmin@demo.edu       |');
  console.log('');
  console.log('Run migrations first if needed: npx prisma migrate deploy');
  console.log('Re-run this seed: npm run seed:all');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
