import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformUserService } from '../../platform-user/platform-user.service';
import { EmailService } from '../schools/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateExternalCategoryDto } from './dto/create-external-category.dto';
import { UpdateExternalCategoryDto } from './dto/update-external-category.dto';
import { CreateExternalAdminDto } from './dto/create-external-admin.dto';
import { UpdateExternalAdminDto } from './dto/update-external-admin.dto';

@Injectable()
export class ExternalService {
  constructor(
    private prisma: PrismaService,
    private platformUserService: PlatformUserService,
    private emailService: EmailService,
  ) {}

  private get client() {
    return this.prisma as any;
  }

  async generateRefNum(): Promise<string> {
    const prefix = 'EX';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    const refNum = `${prefix}-${date}-${random}`;
    const exists = await this.client.externalAdmin.findUnique({ where: { refNum } });
    if (exists) return this.generateRefNum();
    return refNum;
  }

  async generateTemporaryPassword(): Promise<string> {
    return crypto.randomBytes(8).toString('hex');
  }

  listCategories() {
    return this.client.externalCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  listActiveCategoriesPublic() {
    return this.client.externalCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, description: true, sortOrder: true },
    });
  }

  createCategory(dto: CreateExternalCategoryDto) {
    return this.client.externalCategory.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateExternalCategoryDto) {
    await this.ensureCategory(id);
    return this.client.externalCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    await this.ensureCategory(id);
    const linked = await this.client.externalAdminCategory.count({ where: { externalCategoryId: id } });
    if (linked > 0) {
      throw new BadRequestException('Cannot delete a category that is assigned to an external admin.');
    }
    return this.client.externalCategory.delete({ where: { id } });
  }

  listAdmins() {
    return this.client.externalAdmin.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { externalCategory: { select: { id: true, name: true, isActive: true } } },
        },
      },
    });
  }

  async updateAdmin(id: string, dto: UpdateExternalAdminDto) {
    const admin = await this.client.externalAdmin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('External admin not found');

    if (dto.categoryIds !== undefined) {
      const categoryIds = [...new Set(dto.categoryIds)];
      const categories = await this.client.externalCategory.findMany({
        where: { id: { in: categoryIds }, isActive: true },
      });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('One or more external categories were not found or are inactive.');
      }
      await this.client.$transaction(async (tx: typeof this.client) => {
        await tx.externalAdminCategory.deleteMany({
          where: {
            externalAdminId: id,
            externalCategoryId: { notIn: categoryIds },
          },
        });
        const existing = await tx.externalAdminCategory.findMany({
          where: { externalAdminId: id },
          select: { externalCategoryId: true },
        });
        const existingIds = new Set(existing.map((row: { externalCategoryId: string }) => row.externalCategoryId));
        for (const externalCategoryId of categoryIds) {
          if (!existingIds.has(externalCategoryId)) {
            await tx.externalAdminCategory.create({
              data: { externalAdminId: id, externalCategoryId },
            });
          }
        }
      });
    }

    if (dto.isActive !== undefined) {
      await this.client.externalAdmin.update({
        where: { id },
        data: { isActive: dto.isActive },
      });
    }

    return this.client.externalAdmin.findUnique({
      where: { id },
      include: {
        categories: {
          include: { externalCategory: { select: { id: true, name: true, isActive: true } } },
        },
      },
    });
  }

  async deleteAdmin(id: string) {
    const admin = await this.client.externalAdmin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('External admin not found');
    await this.client.externalAdmin.delete({ where: { id } });
    return { message: 'External admin deleted successfully.' };
  }

  async createAdmin(dto: CreateExternalAdminDto) {
    const categoryIds = [...new Set(dto.categoryIds)];
    const categories = await this.client.externalCategory.findMany({
      where: { id: { in: categoryIds }, isActive: true },
    });
    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('One or more external categories were not found or are inactive.');
    }

    const normalizedEmail = this.platformUserService.normalizeEmail(dto.adminEmail);
    const existingPlatformUser = await this.platformUserService.findByEmail(normalizedEmail);
    if (existingPlatformUser) {
      const existingExternal = await this.client.externalAdmin.findFirst({
        where: { platformUserId: existingPlatformUser.id },
      });
      if (existingExternal) {
        throw new BadRequestException('This user already has an External Admin role.');
      }
    }

    const tempPassword = await this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const refNum = await this.generateRefNum();

    const platformUser = await this.platformUserService.findOrCreateByEmail(normalizedEmail);

    const admin = await this.client.externalAdmin.create({
      data: {
        refNum,
        platformUserId: platformUser.id,
        name: dto.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        categories: {
          create: categoryIds.map((externalCategoryId) => ({ externalCategoryId })),
        },
      },
      include: {
        categories: { include: { externalCategory: true } },
      },
    });

    let emailSent = false;
    let emailError: string | undefined;
    try {
      await this.emailService.sendOnboardingEmail(
        normalizedEmail,
        'External Admin',
        refNum,
        tempPassword,
        {
          city: 'Platform',
          features: categories.map((c: { name: string }) => c.name),
        },
        { loginPath: '/external-admin/login', accountKind: 'external' },
      );
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
    }

    return {
      message: 'External admin created successfully.',
      admin: {
        id: admin.id,
        refNum: admin.refNum,
        name: admin.name,
        email: admin.email,
        categories: admin.categories.map((c: { externalCategory: { id: string; name: string } }) => c.externalCategory),
      },
      credentials: {
        refNum,
        tempPassword,
        adminEmail: normalizedEmail,
      },
      emailSent,
      emailError,
    };
  }

  private async ensureCategory(id: string) {
    const row = await this.client.externalCategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('External category not found');
    return row;
  }
}
