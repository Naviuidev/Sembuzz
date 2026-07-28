"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryAdminQueriesService = void 0;
const common_1 = require("@nestjs/common");
let CategoryAdminQueriesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminQueriesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminQueriesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        emailService;
        meetingsService;
        constructor(prisma, emailService, meetingsService) {
            this.prisma = prisma;
            this.emailService = emailService;
            this.meetingsService = meetingsService;
        }
        async create(categoryAdminId, dto) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                include: {
                    school: { select: { id: true, name: true } },
                    category: { select: { name: true } },
                },
            });
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            const query = await this.prisma.categoryAdminQuery.create({
                data: {
                    categoryAdminId,
                    schoolId: admin.schoolId,
                    type: dto.type,
                    description: message ?? undefined,
                    attachmentUrl: dto.attachmentUrl,
                    meetingType: dto.meetingType,
                    meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
                    timeZone: dto.timeZone,
                    timeSlot: dto.timeSlot,
                    status: 'pending',
                },
                include: {
                    categoryAdmin: {
                        select: { name: true, email: true },
                    },
                    school: { select: { name: true } },
                },
            });
            let meetingLink = null;
            if (dto.type === 'schedule_meeting' &&
                dto.meetingType &&
                dto.meetingDate &&
                dto.timeSlot &&
                dto.timeZone &&
                (dto.meetingType === 'google_meet' || dto.meetingType === 'zoom')) {
                const dateStr = dto.meetingDate.split('T')[0];
                const schoolAdmins = await this.prisma.schoolAdmin.findMany({
                    where: { schoolId: admin.schoolId, isActive: true },
                    select: { email: true },
                });
                const attendeeEmails = schoolAdmins.map((a) => a.email);
                if (attendeeEmails.length === 0)
                    attendeeEmails.push(query.categoryAdmin.email);
                const result = await this.meetingsService.scheduleMeeting({
                    meetingType: dto.meetingType,
                    meetingDate: dateStr,
                    timeSlot: dto.timeSlot,
                    timeZone: dto.timeZone,
                    title: `SemBuzz Meeting - ${admin.category.name}`,
                    attendeeEmails,
                });
                if (!('error' in result)) {
                    meetingLink = result.meetingLink;
                    await this.prisma.categoryAdminQuery.update({
                        where: { id: query.id },
                        data: { meetingLink },
                    });
                }
            }
            const schoolAdmins = await this.prisma.schoolAdmin.findMany({
                where: { schoolId: admin.schoolId, isActive: true },
                select: { email: true },
            });
            for (const sa of schoolAdmins) {
                await this.emailService.sendCategoryAdminQueryToSchoolAdmin(sa.email, query.categoryAdmin.name, query.categoryAdmin.email, query.school.name, admin.category.name, {
                    type: dto.type,
                    description: message ?? undefined,
                    meetingType: dto.meetingType,
                    timeZone: dto.timeZone,
                    timeSlot: dto.timeSlot,
                    attachmentUrl: dto.attachmentUrl,
                    meetingLink: meetingLink ?? undefined,
                });
            }
            return meetingLink ? { ...query, meetingLink } : query;
        }
        async listFromSubcategoryAdmins(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                select: { categoryId: true, categories: { select: { categoryId: true } } },
            });
            const categoryIds = [admin.categoryId, ...admin.categories.map((c) => c.categoryId)];
            return this.prisma.subCategoryAdminQuery.findMany({
                where: {
                    subCategoryAdmin: {
                        categoryId: { in: categoryIds },
                    },
                },
                include: {
                    subCategoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                            subCategory: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async replyToSubcategoryAdmin(queryId, message) {
            const query = await this.prisma.subCategoryAdminQuery.findUniqueOrThrow({
                where: { id: queryId },
                include: {
                    subCategoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                        },
                    },
                },
            });
            await this.prisma.subCategoryAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToSubCategoryAdmin(query.subCategoryAdmin.email, query.subCategoryAdmin.name, query.subCategoryAdmin.category.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async listFromSchoolAdmins(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                select: { schoolId: true },
            });
            return this.prisma.schoolAdminToCategoryAdminQuery.findMany({
                where: { schoolId: admin.schoolId },
                include: {
                    schoolAdmin: {
                        include: {
                            school: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async replyToSchoolAdmin(categoryAdminId, queryId, message) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                select: { schoolId: true },
            });
            const query = await this.prisma.schoolAdminToCategoryAdminQuery.findFirst({
                where: { id: queryId, schoolId: admin.schoolId },
                include: {
                    schoolAdmin: {
                        include: { school: { select: { name: true } } },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.schoolAdminToCategoryAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendQueryReply(query.schoolAdmin.email, query.schoolAdmin.name, query.schoolAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async createToSubCategoryAdmin(categoryAdminId, dto) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                select: { categoryId: true },
            });
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.categoryAdminToSubCategoryAdminQuery.create({
                data: {
                    categoryAdminId,
                    categoryId: admin.categoryId,
                    type: dto.type,
                    meetingType: dto.meetingType,
                    meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
                    timeZone: dto.timeZone,
                    timeSlot: dto.timeSlot,
                    description: message ?? undefined,
                    attachmentUrl: dto.attachmentUrl,
                    status: 'pending',
                },
                include: {
                    categoryAdmin: { select: { name: true } },
                    category: { select: { name: true } },
                },
            });
        }
        async createToSuperAdmin(categoryAdminId, dto) {
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.categoryAdminToSuperAdminQuery.create({
                data: {
                    categoryAdminId,
                    type: dto.type,
                    meetingType: dto.meetingType,
                    meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
                    timeZone: dto.timeZone,
                    timeSlot: dto.timeSlot,
                    description: message ?? undefined,
                    customMessage: message ?? undefined,
                    attachmentUrl: dto.attachmentUrl,
                    status: 'pending',
                },
                include: {
                    categoryAdmin: { select: { name: true, email: true } },
                },
            });
        }
        async listRaisedToSuperAdmin(categoryAdminId) {
            return this.prisma.categoryAdminToSuperAdminQuery.findMany({
                where: { categoryAdminId },
                orderBy: { createdAt: 'desc' },
            });
        }
        async sendFollowUpToSuperAdmin(categoryAdminId, queryId, message) {
            const query = await this.prisma.categoryAdminToSuperAdminQuery.findFirst({
                where: { id: queryId, categoryAdminId },
                include: {
                    categoryAdmin: { select: { name: true, email: true } },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            const superAdmins = await this.prisma.superAdmin.findMany({
                select: { email: true },
            });
            const emails = superAdmins.map((a) => a.email);
            if (emails.length === 0 && process.env.SUPPORT_EMAIL)
                emails.push(process.env.SUPPORT_EMAIL);
            await this.emailService.sendCategoryAdminFollowUpToSuperAdmin(emails, query.categoryAdmin.name, query.categoryAdmin.email, query.type, message);
            return { message: 'Follow-up sent successfully' };
        }
        async deleteFromSchoolAdmin(id, categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({ where: { id: categoryAdminId }, select: { schoolId: true } });
            const q = await this.prisma.schoolAdminToCategoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.schoolAdminToCategoryAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteFromSubcategoryAdmin(id, categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
                where: { id: categoryAdminId },
                select: { categoryId: true, categories: { select: { categoryId: true } } },
            });
            const categoryIds = [admin.categoryId, ...admin.categories.map((c) => c.categoryId)];
            const q = await this.prisma.subCategoryAdminQuery.findFirst({
                where: { id, subCategoryAdmin: { categoryId: { in: categoryIds } } },
            });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.subCategoryAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteRaisedToSuperAdmin(id, categoryAdminId) {
            const q = await this.prisma.categoryAdminToSuperAdminQuery.findFirst({ where: { id, categoryAdminId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.categoryAdminToSuperAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
    };
    return CategoryAdminQueriesService = _classThis;
})();
exports.CategoryAdminQueriesService = CategoryAdminQueriesService;
//# sourceMappingURL=queries.service.js.map