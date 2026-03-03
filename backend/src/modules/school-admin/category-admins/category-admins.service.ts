import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryAdminDto } from '../dto/create-category-admin.dto';
import { UpdateCategoryAdminCategoriesDto } from '../dto/update-category-admin-categories.dto';
import { EmailService } from '../../super-admin/schools/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CategoryAdminsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateTemporaryPassword(): Promise<string> {
    // Generate a random password
    return crypto.randomBytes(8).toString('hex');
  }

  async findAll(schoolId: string) {
    return this.prisma.categoryAdmin.findMany({
      where: { schoolId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, schoolId: string) {
    const categoryAdmin = await this.prisma.categoryAdmin.findFirst({
      where: { id, schoolId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!categoryAdmin) {
      throw new NotFoundException(`Category admin with id ${id} not found`);
    }

    return categoryAdmin;
  }

  async create(schoolId: string, createCategoryAdminDto: CreateCategoryAdminDto) {
    const { name, email, categoryId } = createCategoryAdminDto;

    // Get school to validate domain
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { domain: true, name: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (!school.domain) {
      throw new BadRequestException('School domain is not set. Please contact super admin.');
    }

    // Validate that email domain matches the school domain
    const emailDomain = email.split('@')[1];
    if (!emailDomain || emailDomain.toLowerCase() !== school.domain.toLowerCase()) {
      throw new BadRequestException(
        `Category admin email domain (${emailDomain || 'invalid'}) must match the school domain (${school.domain})`,
      );
    }

    // Verify category belongs to this school
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        schoolId,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found or does not belong to this school`);
    }

    // Check if email already exists
    const existingAdmin = await this.prisma.categoryAdmin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Category admin email already exists');
    }

    // Generate temporary password
    const tempPassword = await this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create category admin in transaction
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const categoryAdmin = await tx.categoryAdmin.create({
          data: {
            name,
            email,
            password: hashedPassword,
            categoryId,
            schoolId,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            school: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
        });

        // Create junction table entry
        await tx.categoryAdminCategory.create({
          data: {
            id: crypto.randomBytes(16).toString('hex'),
            categoryAdminId: categoryAdmin.id,
            categoryId,
          },
        });

        return categoryAdmin;
      });

      // Try to send email (don't fail if email fails)
      let emailSent = false;
      let emailError: string | null = null;
      try {
        await this.emailService.sendCategoryAdminOnboardingEmail(
          email,
          name,
          school.name,
          category.name,
          tempPassword,
        );
        emailSent = true;
      } catch (error: any) {
        console.error('Failed to send category admin onboarding email:', error);
        emailError = error?.message || 'Failed to send email';
      }

      return {
        ...result,
        tempPassword,
        emailSent,
        emailError,
      };
    } catch (error: any) {
      // Handle database errors
      if (error.message?.includes("Unknown column")) {
        throw new BadRequestException(
          'Database migration required. Please run migrations to add category admin tables.',
        );
      }
      throw error;
    }
  }

  async updateCategories(id: string, schoolId: string, updateDto: UpdateCategoryAdminCategoriesDto) {
    const categoryAdmin = await this.findOne(id, schoolId);

    // Verify all categories belong to this school
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: updateDto.categoryIds },
        schoolId,
      },
      select: { id: true, name: true },
    });

    if (categories.length !== updateDto.categoryIds.length) {
      throw new BadRequestException('One or more categories do not belong to this school');
    }

    // Get current categories
    const currentCategories = await this.prisma.categoryAdminCategory.findMany({
      where: { categoryAdminId: id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    const currentCategoryIds = currentCategories.map((cc) => cc.categoryId);
    const newCategoryIds = updateDto.categoryIds;

    // Find added and removed categories
    const addedCategoryIds = newCategoryIds.filter((id) => !currentCategoryIds.includes(id));
    const removedCategoryIds = currentCategoryIds.filter((id) => !newCategoryIds.includes(id));

    // Update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Remove old categories
      if (removedCategoryIds.length > 0) {
        await tx.categoryAdminCategory.deleteMany({
          where: {
            categoryAdminId: id,
            categoryId: { in: removedCategoryIds },
          },
        });
      }

      // Add new categories
      if (addedCategoryIds.length > 0) {
        await tx.categoryAdminCategory.createMany({
          data: addedCategoryIds.map((categoryId) => ({
            id: crypto.randomBytes(16).toString('hex'),
            categoryAdminId: id,
            categoryId,
          })),
        });
      }

      // Update primary categoryId if needed (use first category as primary)
      if (newCategoryIds.length > 0 && !newCategoryIds.includes(categoryAdmin.categoryId)) {
        await tx.categoryAdmin.update({
          where: { id },
          data: { categoryId: newCategoryIds[0] },
        });
      }

      // Return updated category admin with all relations
      const updated = await tx.categoryAdmin.findFirst({
        where: { id, schoolId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
        },
      });
      
      return updated;
    });

    if (!result) {
      throw new NotFoundException(`Category admin with id ${id} not found after update`);
    }

    // Send email notification if there are changes
    if (addedCategoryIds.length > 0 || removedCategoryIds.length > 0) {
      const addedCategories = categories
        .filter((c) => addedCategoryIds.includes(c.id))
        .map((c) => c.name);
      const removedCategories = currentCategories
        .filter((cc) => removedCategoryIds.includes(cc.categoryId))
        .map((cc) => cc.category.name);

      // Fetch school name separately if not included in result
      let schoolName = '';
      if (result.school) {
        schoolName = result.school.name;
      } else {
        const school = await this.prisma.school.findUnique({
          where: { id: result.schoolId },
          select: { name: true },
        });
        schoolName = school?.name || '';
      }

      try {
        await this.emailService.sendCategoryAdminCategoriesUpdatedEmail(
          result.email,
          result.name,
          schoolName,
          addedCategories,
          removedCategories,
        );
      } catch (error: any) {
        console.error('Failed to send category update email:', error);
        // Don't fail the request if email fails
      }
    }

    return result;
  }

  async remove(id: string, schoolId: string) {
    const categoryAdmin = await this.findOne(id, schoolId);
    return this.prisma.categoryAdmin.delete({
      where: { id },
    });
  }

  async ban(id: string, schoolId: string) {
    const admin = await this.findOne(id, schoolId);
    if (!admin.isActive) {
      throw new BadRequestException('Category admin is already banned');
    }
    return this.prisma.categoryAdmin.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async unban(id: string, schoolId: string) {
    const admin = await this.findOne(id, schoolId);
    if (admin.isActive) {
      throw new BadRequestException('Category admin is not banned');
    }
    return this.prisma.categoryAdmin.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
