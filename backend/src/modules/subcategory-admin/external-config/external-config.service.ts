import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubcategoryExternalActionDto } from './dto/external-action.dto';
import { SubcategoryExternalReplyDto } from './dto/external-reply.dto';

const linkInclude = {
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  subCategory: { select: { id: true, name: true } },
  school: { select: { id: true, name: true } },
  threadMessages: { orderBy: { createdAt: 'asc' as const } },
};

const postInclude = {
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  subCategory: { select: { id: true, name: true } },
  school: { select: { id: true, name: true } },
  subcategoryThreadMessages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class SubCategoryAdminExternalConfigService {
  constructor(private prisma: PrismaService) {}

  private async subCategoryIdsForAdmin(subCategoryAdminId: string): Promise<string[]> {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      include: { subCategories: true },
    });
    if (!admin) throw new ForbiddenException('Admin not found.');
    const ids = new Set<string>([admin.subCategoryId]);
    admin.subCategories.forEach((r) => ids.add(r.subCategoryId));
    return [...ids];
  }

  async linkPendingCount(subCategoryAdminId: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    const pending = await this.prisma.externalCategorySubcategoryLinkRequest.count({
      where: { subCategoryId: { in: subCategoryIds }, status: 'pending' },
    });
    return { pending };
  }

  async postPendingCount(subCategoryAdminId: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    const pending = await this.prisma.externalSchoolPostRequest.count({
      where: {
        subCategoryId: { in: subCategoryIds },
        contentType: { notIn: ['job', 'offer', 'campaign'] },
        status: 'approved',
        subcategoryStatus: 'pending',
      },
    });
    return { pending };
  }

  async listCategoryLinks(subCategoryAdminId: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    return this.prisma.externalCategorySubcategoryLinkRequest.findMany({
      where: { subCategoryId: { in: subCategoryIds } },
      include: linkInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCategoryLink(subCategoryAdminId: string, id: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    const row = await this.prisma.externalCategorySubcategoryLinkRequest.findFirst({
      where: { id, subCategoryId: { in: subCategoryIds } },
      include: linkInclude,
    });
    if (!row) throw new NotFoundException('Category link request not found.');
    return row;
  }

  async listApprovedCategoryPosts(subCategoryAdminId: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    return this.prisma.externalSchoolPostRequest.findMany({
      where: {
        subCategoryId: { in: subCategoryIds },
        contentType: { notIn: ['job', 'offer', 'campaign'] },
        status: 'approved',
        subcategoryStatus: { not: null },
      },
      include: postInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPost(subCategoryAdminId: string, id: string) {
    const subCategoryIds = await this.subCategoryIdsForAdmin(subCategoryAdminId);
    const row = await this.prisma.externalSchoolPostRequest.findFirst({
      where: {
        id,
        subCategoryId: { in: subCategoryIds },
        contentType: { notIn: ['job', 'offer', 'campaign'] },
        status: 'approved',
      },
      include: postInclude,
    });
    if (!row) throw new NotFoundException('Post request not found.');
    return row;
  }

  private async appendLinkMessage(linkRequestId: string, senderRole: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;
    await this.prisma.externalCategorySubcategoryLinkMessage.create({
      data: { linkRequestId, senderRole, body: trimmed },
    });
  }

  private async appendPostSubMessage(postRequestId: string, senderRole: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;
    await this.prisma.externalSchoolPostSubcategoryMessage.create({
      data: { postRequestId, senderRole, body: trimmed },
    });
  }

  async linkSendQuery(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    const msg = dto.message?.trim();
    if (!msg) throw new BadRequestException('Query message is required.');
    const row = await this.getCategoryLink(adminId, id);
    if (['banned', 'approved'].includes(row.status)) {
      throw new BadRequestException('This request can no longer be queried.');
    }
    await this.appendLinkMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalCategorySubcategoryLinkRequest.update({
      where: { id },
      data: {
        status: 'query',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        reviewedAt: new Date(),
      },
      include: linkInclude,
    });
  }

  async linkReply(adminId: string, id: string, dto: SubcategoryExternalReplyDto) {
    const row = await this.getCategoryLink(adminId, id);
    if (['banned', 'approved', 'rejected'].includes(row.status)) {
      throw new BadRequestException('Conversation closed.');
    }
    await this.appendLinkMessage(id, 'subcategory_admin', dto.message);
    const nextStatus = row.status === 'pending' ? 'query' : row.status;
    return this.prisma.externalCategorySubcategoryLinkRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        subcategoryAdminMessage: dto.message.trim(),
        reviewedBySubCategoryAdminId: adminId,
        reviewedAt: new Date(),
      },
      include: linkInclude,
    });
  }

  async linkApprove(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getCategoryLink(adminId, id);
    const msg = dto.message?.trim() || 'External category approved for this subcategory.';
    await this.appendLinkMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalCategorySubcategoryLinkRequest.update({
      where: { id },
      data: {
        status: 'approved',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        reviewedAt: new Date(),
      },
      include: linkInclude,
    });
  }

  async linkReject(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getCategoryLink(adminId, id);
    const msg = dto.message?.trim() || 'Category link was not approved.';
    await this.appendLinkMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalCategorySubcategoryLinkRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        reviewedAt: new Date(),
      },
      include: linkInclude,
    });
  }

  async linkBan(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getCategoryLink(adminId, id);
    const msg = dto.message?.trim() || 'External category blocked for this subcategory.';
    await this.appendLinkMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalCategorySubcategoryLinkRequest.update({
      where: { id },
      data: {
        status: 'banned',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        reviewedAt: new Date(),
      },
      include: linkInclude,
    });
  }

  async postSendQuery(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    const msg = dto.message?.trim();
    if (!msg) throw new BadRequestException('Query message is required.');
    const row = await this.getPost(adminId, id);
    if (['banned', 'approved'].includes(row.subcategoryStatus ?? '')) {
      throw new BadRequestException('This post can no longer be queried.');
    }
    await this.appendPostSubMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        subcategoryStatus: 'query',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        subcategoryReviewedAt: new Date(),
      },
      include: postInclude,
    });
  }

  async postReply(adminId: string, id: string, dto: SubcategoryExternalReplyDto) {
    const row = await this.getPost(adminId, id);
    if (['banned', 'approved', 'rejected'].includes(row.subcategoryStatus ?? '')) {
      throw new BadRequestException('Conversation closed.');
    }
    await this.appendPostSubMessage(id, 'subcategory_admin', dto.message);
    const next = row.subcategoryStatus === 'pending' ? 'query' : row.subcategoryStatus;
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        subcategoryStatus: next,
        subcategoryAdminMessage: dto.message.trim(),
        reviewedBySubCategoryAdminId: adminId,
        subcategoryReviewedAt: new Date(),
      },
      include: postInclude,
    });
  }

  async postApprove(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getPost(adminId, id);
    const msg = dto.message?.trim() || 'Post approved for your subcategory feed.';
    await this.appendPostSubMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        subcategoryStatus: 'approved',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        subcategoryReviewedAt: new Date(),
      },
      include: postInclude,
    });
  }

  async postReject(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getPost(adminId, id);
    const msg = dto.message?.trim() || 'Post was not approved for this subcategory.';
    await this.appendPostSubMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        subcategoryStatus: 'rejected',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        subcategoryReviewedAt: new Date(),
      },
      include: postInclude,
    });
  }

  async postBan(adminId: string, id: string, dto: SubcategoryExternalActionDto) {
    await this.getPost(adminId, id);
    const msg = dto.message?.trim() || 'External posts blocked for this subcategory.';
    await this.appendPostSubMessage(id, 'subcategory_admin', msg);
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        subcategoryStatus: 'banned',
        subcategoryAdminMessage: msg,
        reviewedBySubCategoryAdminId: adminId,
        subcategoryReviewedAt: new Date(),
      },
      include: postInclude,
    });
  }
}
