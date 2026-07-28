import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class PlatformUserService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async findByEmail(email: string, tx?: Tx) {
    const client = tx ?? this.prisma;
    return client.platformUser.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findById(id: string, tx?: Tx) {
    const client = tx ?? this.prisma;
    return client.platformUser.findUnique({ where: { id } });
  }

  async findOrCreateByEmail(email: string, tx?: Tx) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) {
      throw new BadRequestException('Email is required.');
    }

    const client = tx ?? this.prisma;
    const existing = await client.platformUser.findUnique({ where: { email: normalized } });
    if (existing) {
      return existing;
    }

    return client.platformUser.create({
      data: { email: normalized },
    });
  }

  /** Update login email on the platform user and sync denormalized email on all linked roles. */
  async updateEmail(platformUserId: string, newEmail: string, tx?: Tx) {
    const normalized = this.normalizeEmail(newEmail);
    if (!normalized) {
      throw new BadRequestException('Email is required.');
    }

    const run = async (db: Tx) => {
      const current = await db.platformUser.findUnique({ where: { id: platformUserId } });
      if (!current) {
        throw new NotFoundException('User ID not found.');
      }
      if (current.email === normalized) {
        return current;
      }

      const taken = await db.platformUser.findUnique({ where: { email: normalized } });
      if (taken && taken.id !== platformUserId) {
        throw new BadRequestException('Email is already in use by another account.');
      }

      const updated = await db.platformUser.update({
        where: { id: platformUserId },
        data: { email: normalized },
      });

      await Promise.all([
        db.superAdmin.updateMany({ where: { platformUserId }, data: { email: normalized } }),
        db.schoolAdmin.updateMany({ where: { platformUserId }, data: { email: normalized } }),
        db.adsAdmin.updateMany({ where: { platformUserId }, data: { email: normalized } }),
        db.categoryAdmin.updateMany({ where: { platformUserId }, data: { email: normalized } }),
        db.subCategoryAdmin.updateMany({ where: { platformUserId }, data: { email: normalized } }),
        db.user.updateMany({ where: { platformUserId }, data: { email: normalized } }),
      ]);

      return updated;
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  async getLinkedRoles(platformUserId: string) {
    const [superAdmin, schoolAdmins, adsAdmins, categoryAdmins, subCategoryAdmins, users] =
      await Promise.all([
        this.prisma.superAdmin.findUnique({ where: { platformUserId }, select: { id: true } }),
        this.prisma.schoolAdmin.findMany({
          where: { platformUserId },
          select: { id: true, schoolId: true, isActive: true },
        }),
        this.prisma.adsAdmin.findMany({
          where: { platformUserId },
          select: { id: true, schoolId: true, isActive: true },
        }),
        this.prisma.categoryAdmin.findMany({
          where: { platformUserId },
          select: { id: true, schoolId: true, isActive: true },
        }),
        this.prisma.subCategoryAdmin.findMany({
          where: { platformUserId },
          select: { id: true, schoolId: true, isActive: true },
        }),
        this.prisma.user.findMany({
          where: { platformUserId },
          select: { id: true, schoolId: true, status: true },
        }),
      ]);

    return {
      superAdmin: superAdmin ? { id: superAdmin.id } : null,
      schoolAdmins,
      adsAdmins,
      categoryAdmins,
      subCategoryAdmins,
      users,
    };
  }
}
