import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubCategoryAdminDto } from '../dto/create-subcategory-admin.dto';
import { UpdateSubCategoryAdminSubCategoriesDto } from '../dto/update-subcategory-admin-subcategories.dto';
import { EmailService } from '../../super-admin/schools/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SubCategoryAdminsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateTemporaryPassword(): Promise<string> {
    return crypto.randomBytes(8).toString('hex');
  }

  /** All category IDs this category admin has access to (primary + junction table). */
  private async getCategoryAdminCategoryIds(categoryAdminId: string): Promise<string[]> {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      select: { categoryId: true, categories: { select: { categoryId: true } } },
    });
    if (!admin) return [];
    return [admin.categoryId, ...(admin.categories?.map((c) => c.categoryId) ?? [])].filter(Boolean);
  }

  async findAll(categoryId: string, categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) {
      throw new UnauthorizedException('You do not have access to any category');
    }

    return this.prisma.subCategoryAdmin.findMany({
      where: { categoryId: { in: categoryIds } },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategories: {
          include: {
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, categoryId: string, categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) {
      throw new UnauthorizedException('You do not have access to any category');
    }

    const subCategoryAdmin = await this.prisma.subCategoryAdmin.findFirst({
      where: { id, categoryId: { in: categoryIds } },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategories: {
          include: {
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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

    if (!subCategoryAdmin) {
      throw new NotFoundException(`Subcategory admin with id ${id} not found`);
    }

    return subCategoryAdmin;
  }

  async create(categoryId: string, categoryAdminId: string, createSubCategoryAdminDto: CreateSubCategoryAdminDto) {
    const { name, email, subCategoryId } = createSubCategoryAdminDto;

    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) {
      throw new UnauthorizedException('You do not have access to any category');
    }

    // Subcategory must belong to one of the admin's categories
    const subCategory = await this.prisma.subCategory.findFirst({
      where: {
        id: subCategoryId,
        categoryId: { in: categoryIds },
      },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!subCategory) {
      throw new NotFoundException(`Subcategory with id ${subCategoryId} not found or does not belong to your categories`);
    }

    const categoryAdmin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      include: {
        school: {
          select: { domain: true, name: true, id: true },
        },
      },
    });

    if (!categoryAdmin) {
      throw new UnauthorizedException('Category admin not found');
    }

    if (!categoryAdmin.school.domain) {
      throw new BadRequestException('School domain is not set. Please contact super admin.');
    }

    const emailDomain = email.split('@')[1];
    if (!emailDomain || emailDomain.toLowerCase() !== categoryAdmin.school.domain.toLowerCase()) {
      throw new BadRequestException(
        `Subcategory admin email domain (${emailDomain || 'invalid'}) must match the school domain (${categoryAdmin.school.domain})`,
      );
    }

    // Check if email already exists
    const existingAdmin = await this.prisma.subCategoryAdmin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Subcategory admin email already exists');
    }

    // Generate temporary password
    const tempPassword = await this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create subcategory admin in transaction
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const subCategoryAdmin = await tx.subCategoryAdmin.create({
          data: {
            name,
            email,
            password: hashedPassword,
            subCategoryId,
            categoryId: subCategory.categoryId,
            schoolId: categoryAdmin.schoolId,
          },
          include: {
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
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
        await tx.subCategoryAdminSubCategory.create({
          data: {
            id: crypto.randomBytes(16).toString('hex'),
            subCategoryAdminId: subCategoryAdmin.id,
            subCategoryId,
          },
        });

        return subCategoryAdmin;
      });

      // Try to send email (don't fail if email fails)
      let emailSent = false;
      let emailError: string | null = null;
      try {
        await this.emailService.sendSubCategoryAdminOnboardingEmail(
          email,
          name,
          categoryAdmin.school.name,
          subCategory.category.name,
          subCategory.name,
          tempPassword,
        );
        emailSent = true;
      } catch (error: any) {
        console.error('Failed to send subcategory admin onboarding email:', error);
        emailError = error?.message || 'Failed to send email';
      }

      return {
        ...result,
        tempPassword,
        emailSent,
        emailError,
      };
    } catch (error: any) {
      if (error.message?.includes("Unknown column")) {
        throw new BadRequestException(
          'Database migration required. Please run migrations to add subcategory admin tables.',
        );
      }
      throw error;
    }
  }

  async updateSubCategories(
    id: string,
    categoryId: string,
    categoryAdminId: string,
    updateDto: UpdateSubCategoryAdminSubCategoriesDto,
  ) {
    const subCategoryAdmin = await this.findOne(id, categoryId, categoryAdminId);

    // Verify all subcategories belong to the subcategory admin's category
    const subCategories = await this.prisma.subCategory.findMany({
      where: {
        id: { in: updateDto.subCategoryIds },
        categoryId: subCategoryAdmin.categoryId,
      },
      select: { id: true, name: true },
    });

    if (subCategories.length !== updateDto.subCategoryIds.length) {
      throw new BadRequestException('One or more subcategories do not belong to this category');
    }

    // Get current subcategories
    const currentSubCategories = await this.prisma.subCategoryAdminSubCategory.findMany({
      where: { subCategoryAdminId: id },
      include: {
        subCategory: {
          select: { id: true, name: true },
        },
      },
    });

    const currentSubCategoryIds = currentSubCategories.map((cs) => cs.subCategoryId);
    const newSubCategoryIds = updateDto.subCategoryIds;

    // Find added and removed subcategories
    const addedSubCategoryIds = newSubCategoryIds.filter((id) => !currentSubCategoryIds.includes(id));
    const removedSubCategoryIds = currentSubCategoryIds.filter((id) => !newSubCategoryIds.includes(id));

    // Update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Remove old subcategories
      if (removedSubCategoryIds.length > 0) {
        await tx.subCategoryAdminSubCategory.deleteMany({
          where: {
            subCategoryAdminId: id,
            subCategoryId: { in: removedSubCategoryIds },
          },
        });
      }

      // Add new subcategories
      if (addedSubCategoryIds.length > 0) {
        await tx.subCategoryAdminSubCategory.createMany({
          data: addedSubCategoryIds.map((subCategoryId) => ({
            id: crypto.randomBytes(16).toString('hex'),
            subCategoryAdminId: id,
            subCategoryId,
          })),
        });
      }

      // Update primary subCategoryId if needed (use first subcategory as primary)
      if (newSubCategoryIds.length > 0 && !newSubCategoryIds.includes(subCategoryAdmin.subCategoryId)) {
        await tx.subCategoryAdmin.update({
          where: { id },
          data: { subCategoryId: newSubCategoryIds[0] },
        });
      }

      // Return updated subcategory admin with all relations
      const updated = await tx.subCategoryAdmin.findFirst({
        where: { id, categoryId: subCategoryAdmin.categoryId },
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          subCategories: {
            include: {
              subCategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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
      
      return updated;
    });

    if (!result) {
      throw new NotFoundException(`Subcategory admin with id ${id} not found after update`);
    }

    // Send email notification if there are changes
    if (addedSubCategoryIds.length > 0 || removedSubCategoryIds.length > 0) {
      const addedSubCategories = subCategories
        .filter((s) => addedSubCategoryIds.includes(s.id))
        .map((s) => s.name);
      const removedSubCategories = currentSubCategories
        .filter((cs) => removedSubCategoryIds.includes(cs.subCategoryId))
        .map((cs) => cs.subCategory.name);

      // Get school and category names from result or fetch separately
      let schoolName = '';
      let categoryName = '';
      
      if (result.school) {
        schoolName = result.school.name;
      } else {
        const school = await this.prisma.school.findUnique({
          where: { id: result.schoolId },
          select: { name: true },
        });
        schoolName = school?.name || '';
      }
      
      if (result.category) {
        categoryName = result.category.name;
      } else {
        const category = await this.prisma.category.findUnique({
          where: { id: result.categoryId },
          select: { name: true },
        });
        categoryName = category?.name || '';
      }

      try {
        await this.emailService.sendSubCategoryAdminSubCategoriesUpdatedEmail(
          result.email,
          result.name,
          schoolName,
          categoryName,
          addedSubCategories,
          removedSubCategories,
        );
      } catch (error: any) {
        console.error('Failed to send subcategory update email:', error);
        // Don't fail the request if email fails
      }
    }

    return result;
  }

  async remove(id: string, categoryId: string, categoryAdminId: string) {
    await this.findOne(id, categoryId, categoryAdminId);
    return this.prisma.subCategoryAdmin.delete({
      where: { id },
    });
  }
}
