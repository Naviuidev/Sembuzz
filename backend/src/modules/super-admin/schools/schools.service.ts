import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FeaturesService } from '../features/features.service';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { UpdateSchoolDto } from '../dto/update-school.dto';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private featuresService: FeaturesService,
    private emailService: EmailService,
  ) {}

  /** Cast so generated delegate (adsAdmin) is accepted; run `npx prisma generate` so runtime client matches. */
  private get client() {
    return this.prisma as any;
  }

  async generateRefNum(): Promise<string> {
    // Generate unique reference number: SB-YYYYMMDD-XXXXXX
    const prefix = 'SB';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    const refNum = `${prefix}-${date}-${random}`;

    // Check if it exists (very unlikely but check anyway)
    const exists = await this.prisma.school.findUnique({
      where: { refNum },
    });

    if (exists) {
      // Recursively try again if collision
      return this.generateRefNum();
    }

    return refNum;
  }

  async generateTemporaryPassword(): Promise<string> {
    // Generate a random password
    return crypto.randomBytes(8).toString('hex');
  }

  async create(createSchoolDto: CreateSchoolDto) {
    try {
      return await this.createInternal(createSchoolDto);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SchoolsService] create error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Failed to create school. Check server logs for details.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createInternal(createSchoolDto: CreateSchoolDto) {
    const { schoolName, country, state, city, domain, image, selectedFeatures, adminEmail, adsAdminEmail, tenure } = createSchoolDto;

    const hasAdsFeature = selectedFeatures.includes('ADS');

    // When Ads feature is selected, Ads Admin email is required
    if (hasAdsFeature && (!adsAdminEmail || !adsAdminEmail.trim())) {
      throw new BadRequestException('Ads Admin email is required when the Ads feature is selected.');
    }

    // Validate state is provided for US
    if (country === 'US' && !state) {
      throw new BadRequestException('State is required for US schools');
    }

    // Validate that admin email domain matches the domain field (normalize: strip leading @ from domain)
    const emailDomain = adminEmail.split('@')[1]?.toLowerCase().trim();
    const normalizedDomain = (domain || '').replace(/^@?\.?/, '').toLowerCase().trim();
    if (!emailDomain || emailDomain !== normalizedDomain) {
      throw new BadRequestException(
        `Admin email domain (${emailDomain || 'invalid'}) must match the school domain (${domain})`,
      );
    }

    // Check if admin email already exists
    const existingAdmin = await this.prisma.schoolAdmin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin email already exists');
    }

    // If Ads feature: check Ads Admin email is not already used
    if (hasAdsFeature && adsAdminEmail) {
      const existingAdsAdmin = await this.client.adsAdmin.findUnique({
        where: { email: adsAdminEmail.trim() },
      });
      if (existingAdsAdmin) {
        throw new BadRequestException('Ads Admin email is already in use.');
      }
      const existingSchoolAdminWithAdsEmail = await this.prisma.schoolAdmin.findUnique({
        where: { email: adsAdminEmail.trim() },
      });
      if (existingSchoolAdminWithAdsEmail) {
        throw new BadRequestException('Ads Admin email cannot be the same as an existing School Admin.');
      }
    }

    // Validate features
    const features = await Promise.all(
      selectedFeatures.map(async (featureCode) => {
        const feature = await this.featuresService.findByCode(featureCode);
        if (!feature) {
          throw new BadRequestException(`Feature with code ${featureCode} not found`);
        }
        return feature;
      }),
    );

    // Generate ref number
    const refNum = await this.generateRefNum();

    // Generate temporary password for school admin
    const tempPassword = await this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // If Ads feature: generate temp password for Ads Admin
    let adsTempPassword: string | null = null;
    let hashedAdsPassword: string | null = null;
    if (hasAdsFeature && adsAdminEmail) {
      adsTempPassword = await this.generateTemporaryPassword();
      hashedAdsPassword = await bcrypt.hash(adsTempPassword, 10);
    }

    // Extract admin name from email (or use email as name)
    const adminName = adminEmail.split('@')[0] || 'School Admin';
    const adsAdminName = (hasAdsFeature && adsAdminEmail) ? adsAdminEmail.split('@')[0] || 'Ads Admin' : null;

    // Create school and admin in transaction
    let result: {
      school: any;
      admin: any;
      tempPassword: string;
      features: any[];
      adsAdmin?: any;
      adsTempPassword?: string;
    };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // Build school data object - conditionally include domain/image
        const schoolData: any = {
          refNum,
          name: schoolName,
          country,
          state: country === 'US' ? state : null,
          city,
          tenure,
          isActive: true,
        };

        if (domain) {
          schoolData.domain = domain;
        }
        if (image) {
          schoolData.image = image;
        }

        // Create school
        const school = await tx.school.create({
          data: schoolData,
        });

        // Create school admin
        const admin = await tx.schoolAdmin.create({
          data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            schoolId: school.id,
            isActive: true,
          },
        });

        // Create school-feature mappings
        await Promise.all(
          features.map((feature) =>
            tx.schoolFeature.create({
              data: {
                schoolId: school.id,
                featureId: feature.id,
                isEnabled: true,
              },
            }),
          ),
        );

        // If Ads feature: create Ads Admin for this school
        let adsAdmin: any = undefined;
        if (hasAdsFeature && adsAdminEmail && hashedAdsPassword) {
          adsAdmin = await (tx as any).adsAdmin.create({
            data: {
              name: adsAdminName!,
              email: adsAdminEmail.trim(),
              password: hashedAdsPassword,
              schoolId: school.id,
              isActive: true,
            },
          });
        }

        return {
          school,
          admin,
          tempPassword,
          features,
          ...(adsAdmin ? { adsAdmin, adsTempPassword: adsTempPassword! } : {}),
        };
      });
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';

      // Missing columns on schools table (run add_school_domain_and_image.sql and add-school-fields.sql)
      if (
        errorMessage.includes("Unknown column") ||
        errorMessage.includes('column "domain"') ||
        errorMessage.includes('column "image"') ||
        errorCode === '42703'
      ) {
        console.error('[SchoolsService] Database schema mismatch:', errorMessage);
        throw new BadRequestException(
          'Database schema is missing columns. On the server run: ' +
          'ALTER TABLE schools ADD COLUMN country VARCHAR(255) NULL, ADD COLUMN state VARCHAR(50) NULL, ADD COLUMN tenure INT NULL; ' +
          'ALTER TABLE schools ADD COLUMN domain VARCHAR(255) NULL, ADD COLUMN image TEXT NULL; ' +
          'Or run prisma/migrations/add_school_domain_and_image.sql and add-school-fields.sql in phpMyAdmin.',
        );
      }

      // Table ads_admins missing (run migrations)
      if (errorMessage.includes('ads_admins') || errorMessage.includes('adsAdmin')) {
        console.error('[SchoolsService] ads_admins table missing or error:', errorMessage);
        throw new BadRequestException(
          'Ads admin table is missing. Run: npx prisma migrate deploy',
        );
      }

      console.error('[SchoolsService] Transaction error:', errorMessage, error?.stack);
      throw error;
    }

    // Send onboarding email with credentials (non-blocking - don't fail school creation if email fails)
    let emailSent = false;
    let emailError: string | null = null;
    try {
      await this.emailService.sendOnboardingEmail(
        adminEmail,
        schoolName,
        refNum,
        result.tempPassword,
        {
          country,
          state: country === 'US' ? state : undefined,
          city,
          tenure,
          features: features.map((f) => f.name),
        },
      );
      emailSent = true;
    } catch (error: any) {
      console.error('[SchoolsService] Email sending failed, but school was created successfully:', error);
      emailError = error.message || 'Unknown error';
    }

    // If Ads Admin was created: send Ads Admin onboarding email
    let adsEmailSent = false;
    let adsEmailError: string | null = null;
    if (result.adsAdmin && result.adsTempPassword && adsAdminEmail) {
      try {
        await this.emailService.sendAdsAdminOnboardingEmail(
          adsAdminEmail.trim(),
          adsAdminName!,
          schoolName,
          result.adsTempPassword,
        );
        adsEmailSent = true;
      } catch (error: any) {
        console.error('[SchoolsService] Ads Admin email sending failed:', error);
        adsEmailError = error.message || 'Unknown error';
      }
    }

    const credentials: Record<string, unknown> = {
      refNum,
      tempPassword: result.tempPassword,
      adminEmail,
    };
    if (result.adsAdmin && result.adsTempPassword && adsAdminEmail) {
      credentials.adsAdminEmail = adsAdminEmail.trim();
      credentials.adsTempPassword = result.adsTempPassword;
      credentials.adsEmailSent = adsEmailSent;
      if (adsEmailError) credentials.adsEmailError = adsEmailError;
    }

    return {
      school: {
        id: result.school.id,
        refNum: result.school.refNum,
        name: result.school.name,
        country: result.school.country,
        state: result.school.state,
        city: result.school.city,
        domain: (result.school as any).domain || null,
        image: (result.school as any).image || null,
        tenure: result.school.tenure,
        isActive: result.school.isActive,
        createdAt: result.school.createdAt,
      },
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        password: result.tempPassword,
      },
      enabledFeatures: result.features.map((f) => ({
        code: f.code,
        name: f.name,
      })),
      emailSent,
      emailError,
      credentials,
      message: emailSent
        ? 'School created successfully. Onboarding email sent.'
        : 'School created successfully, but email could not be sent. Please check credentials below.',
    };
  }

  async findAll() {
    try {
      const schools = await this.prisma.school.findMany({
        include: {
          admins: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          features: {
            where: { isEnabled: true },
            include: {
              feature: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return schools.map((school) => ({
        id: school.id,
        refNum: school.refNum,
        name: school.name,
        country: school.country,
        state: school.state,
        city: school.city,
        tenure: school.tenure,
        isActive: school.isActive,
        enabledFeatures: school.features.map((sf) => ({
          code: sf.feature.code,
          name: sf.feature.name,
        })),
        admin: school.admins[0] || null,
        createdAt: school.createdAt,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SuperAdmin Schools] findAll error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Failed to load schools list' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id },
        include: {
          admins: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          features: {
            where: { isEnabled: true },
            include: {
              feature: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      return {
        id: school.id,
        refNum: school.refNum,
        name: school.name,
        country: school.country,
        state: school.state,
        city: school.city,
        tenure: school.tenure,
        isActive: school.isActive,
        enabledFeatures: school.features.map((sf) => ({
          code: sf.feature.code,
          name: sf.feature.name,
        })),
        admin: school.admins[0] || null,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SuperAdmin Schools] findOne error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Failed to load school' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto) {
    const school = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    const { 
      schoolName, 
      country, 
      state, 
      city, 
      tenure, 
      selectedFeatures, 
      adminEmail, 
      isActive, 
      resetAdminPassword 
    } = updateSchoolDto;

    await this.prisma.$transaction(async (tx) => {
      // Update school basic information
      const schoolUpdateData: any = {};
      if (schoolName !== undefined) schoolUpdateData.name = schoolName;
      if (country !== undefined) schoolUpdateData.country = country;
      if (state !== undefined) schoolUpdateData.state = state;
      if (city !== undefined) schoolUpdateData.city = city;
      if (tenure !== undefined) schoolUpdateData.tenure = tenure;
      if (isActive !== undefined) schoolUpdateData.isActive = isActive;

      if (Object.keys(schoolUpdateData).length > 0) {
        await tx.school.update({
          where: { id },
          data: schoolUpdateData,
        });
      }

      // Update features if provided
      if (selectedFeatures) {
        // Get all features
        const allFeatures = await tx.feature.findMany();
        const featureMap = new Map<string, { id: string; code: string; name: string }>(
          allFeatures.map((f) => [f.code, f])
        );

        // Get current school features to track changes
        const currentSchoolFeatures = await tx.schoolFeature.findMany({
          where: { schoolId: id },
          include: { feature: true },
        });

        // Get currently enabled feature codes for comparison
        const currentEnabledCodes = currentSchoolFeatures
          .filter((sf) => sf.isEnabled)
          .map((sf) => sf.feature.code);

        // Track changes for email
        const addedFeatureNames: string[] = [];
        const removedFeatureNames: string[] = [];

        // Process each requested feature - enable it
        for (const featureCode of selectedFeatures) {
          const feature = featureMap.get(featureCode);
          if (!feature) continue;

          const existingFeature = currentSchoolFeatures.find(
            (sf) => sf.feature.code === featureCode
          );

          // Enable the feature (create if doesn't exist, update if disabled)
          await tx.schoolFeature.upsert({
            where: {
              schoolId_featureId: {
                schoolId: id,
                featureId: feature.id,
              },
            },
            update: { isEnabled: true },
            create: {
              schoolId: id,
              featureId: feature.id,
              isEnabled: true,
            },
          });

          // Track if this was newly enabled (wasn't enabled before)
          if (!currentEnabledCodes.includes(featureCode)) {
            addedFeatureNames.push(feature.name);
          }
        }

        // Disable features that are not in the requested list
        for (const schoolFeature of currentSchoolFeatures) {
          const featureCode = schoolFeature.feature.code;
          
          // If feature is currently enabled but not in requested list, disable it
          if (schoolFeature.isEnabled && !selectedFeatures.includes(featureCode)) {
            await tx.schoolFeature.updateMany({
              where: {
                schoolId: id,
                featureId: schoolFeature.featureId,
              },
              data: { isEnabled: false },
            });
            removedFeatureNames.push(schoolFeature.feature.name);
          }
        }

        // Send email notification if features were changed
        if (addedFeatureNames.length > 0 || removedFeatureNames.length > 0) {
          const admin = await tx.schoolAdmin.findFirst({
            where: { schoolId: id },
          });

          if (admin) {
            // Send email asynchronously (don't wait for it)
            this.emailService
              .sendFeatureUpdateEmail(
                admin.email,
                school.name,
                school.refNum,
                addedFeatureNames,
                removedFeatureNames,
              )
              .catch((error) => {
                console.error('[SchoolsService] Failed to send feature update email:', error);
              });
          }
        }
      }

      // Update admin email if provided
      if (adminEmail) {
        const admin = await tx.schoolAdmin.findFirst({
          where: { schoolId: id },
        });

        if (admin) {
          // Check if email is already taken by another admin
          const emailExists = await tx.schoolAdmin.findFirst({
            where: {
              email: adminEmail,
              id: { not: admin.id },
            },
          });

          if (emailExists) {
            throw new BadRequestException('Admin email already exists');
          }

          await tx.schoolAdmin.update({
            where: { id: admin.id },
            data: { email: adminEmail },
          });
        }
      }

      // Reset admin password if requested
      if (resetAdminPassword) {
        const admin = await tx.schoolAdmin.findFirst({
          where: { schoolId: id },
        });

        if (admin) {
          const tempPassword = await this.generateTemporaryPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          await tx.schoolAdmin.update({
            where: { id: admin.id },
            data: { password: hashedPassword },
          });

          // TODO: Send password reset email
          // await this.sendPasswordResetEmail(admin, tempPassword);
        }
      }
    });

    // Return updated school data after transaction completes
    return this.findOne(id);
  }

  async remove(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    // Delete school (cascade will delete related records)
    await this.prisma.school.delete({
      where: { id },
    });

    return { message: 'School deleted successfully' };
  }

  async sendEmailToSchool(schoolId: string, emailType: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        admins: {
          where: { isActive: true },
          take: 1,
        },
        features: {
          where: { isEnabled: true },
          include: {
            feature: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const admin = school.admins[0];
    if (!admin) {
      throw new NotFoundException('No active admin found for this school');
    }

    const enabledFeatures = school.features.map((sf) => sf.feature.name);

    switch (emailType) {
      case 'complete_info':
        await this.emailService.sendCompleteSchoolInfo(
          admin.email,
          school.name,
          school.refNum,
          {
            country: school.country || undefined,
            state: school.state || undefined,
            city: school.city,
            tenure: school.tenure || undefined,
            features: enabledFeatures,
            adminName: admin.name,
            adminEmail: admin.email,
          },
        );
        break;

      case 'features_selected':
        await this.emailService.sendFeaturesSelected(
          admin.email,
          school.name,
          school.refNum,
          enabledFeatures,
        );
        break;

      case 'tenure_ends_soon':
        if (!school.tenure) {
          throw new BadRequestException('School does not have a tenure set');
        }
        // Calculate remaining months (simplified - you might want to track start date)
        const remainingMonths = Math.max(0, school.tenure - 1);
        await this.emailService.sendTenureEndsSoon(
          admin.email,
          school.name,
          school.refNum,
          school.tenure,
          remainingMonths,
        );
        break;

      case 'refnum':
        await this.emailService.sendRefNum(
          admin.email,
          school.name,
          school.refNum,
        );
        break;

      default:
        throw new BadRequestException(`Invalid email type: ${emailType}`);
    }

    return { message: 'Email sent successfully' };
  }
}
