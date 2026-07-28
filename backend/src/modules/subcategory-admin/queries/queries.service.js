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
exports.SubCategoryAdminQueriesService = void 0;
const common_1 = require("@nestjs/common");
let SubCategoryAdminQueriesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminQueriesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminQueriesService = _classThis = _classDescriptor.value;
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
        async create(subCategoryAdminId, dto) {
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            const query = await this.prisma.subCategoryAdminQuery.create({
                data: {
                    subCategoryAdminId,
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
                    subCategoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                            subCategory: { select: { name: true } },
                        },
                    },
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
                const categoryId = query.subCategoryAdmin.categoryId;
                const categoryAdmins = await this.prisma.categoryAdmin.findMany({
                    where: {
                        OR: [
                            { categoryId },
                            { categories: { some: { categoryId } } },
                        ],
                        isActive: true,
                    },
                    select: { email: true },
                });
                const attendeeEmails = categoryAdmins.map((a) => a.email);
                if (attendeeEmails.length === 0)
                    attendeeEmails.push(query.subCategoryAdmin.email);
                const result = await this.meetingsService.scheduleMeeting({
                    meetingType: dto.meetingType,
                    meetingDate: dateStr,
                    timeSlot: dto.timeSlot,
                    timeZone: dto.timeZone,
                    title: `SemBuzz Meeting - ${query.subCategoryAdmin.category.name}`,
                    attendeeEmails,
                });
                if (!('error' in result)) {
                    meetingLink = result.meetingLink;
                    await this.prisma.subCategoryAdminQuery.update({
                        where: { id: query.id },
                        data: { meetingLink },
                    });
                }
            }
            const categoryId = query.subCategoryAdmin.categoryId;
            const categoryAdmins = await this.prisma.categoryAdmin.findMany({
                where: {
                    OR: [
                        { categoryId },
                        { categories: { some: { categoryId } } },
                    ],
                    isActive: true,
                },
                select: { email: true, name: true },
            });
            for (const admin of categoryAdmins) {
                await this.emailService.sendSubCategoryAdminQueryToCategoryAdmin(admin.email, query.subCategoryAdmin.name, query.subCategoryAdmin.email, query.subCategoryAdmin.category.name, query.subCategoryAdmin.subCategory.name, {
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
        async listFromSchoolAdmins(subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
                where: { id: subCategoryAdminId },
                select: { schoolId: true },
            });
            return this.prisma.schoolAdminToSubCategoryAdminQuery.findMany({
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
        async listFromCategoryAdmins(subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
                where: { id: subCategoryAdminId },
                select: { categoryId: true },
            });
            return this.prisma.categoryAdminToSubCategoryAdminQuery.findMany({
                where: { categoryId: admin.categoryId },
                include: {
                    categoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async createToSchoolAdmin(subCategoryAdminId, dto) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
                where: { id: subCategoryAdminId },
                select: { schoolId: true },
            });
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.subCategoryAdminToSchoolAdminQuery.create({
                data: {
                    subCategoryAdminId,
                    schoolId: admin.schoolId,
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
                    subCategoryAdmin: { select: { name: true } },
                },
            });
        }
        async createToSuperAdmin(subCategoryAdminId, dto) {
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.subCategoryAdminToSuperAdminQuery.create({
                data: {
                    subCategoryAdminId,
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
                    subCategoryAdmin: { select: { name: true, email: true } },
                },
            });
        }
        async replyToSchoolAdmin(subCategoryAdminId, queryId, message) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { schoolId: true } });
            const query = await this.prisma.schoolAdminToSubCategoryAdminQuery.findFirst({
                where: { id: queryId, schoolId: admin.schoolId },
                include: {
                    schoolAdmin: {
                        include: { school: { select: { name: true } } },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.schoolAdminToSubCategoryAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendQueryReply(query.schoolAdmin.email, query.schoolAdmin.name, query.schoolAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async replyToCategoryAdmin(subCategoryAdminId, queryId, message) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { categoryId: true } });
            const query = await this.prisma.categoryAdminToSubCategoryAdminQuery.findFirst({
                where: { id: queryId, categoryId: admin.categoryId },
                include: {
                    categoryAdmin: {
                        include: { school: { select: { name: true } } },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.categoryAdminToSubCategoryAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToCategoryAdmin(query.categoryAdmin.email, query.categoryAdmin.name, query.categoryAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async deleteFromSchoolAdmin(id, subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { schoolId: true } });
            const q = await this.prisma.schoolAdminToSubCategoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.schoolAdminToSubCategoryAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteFromCategoryAdmin(id, subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { categoryId: true } });
            const q = await this.prisma.categoryAdminToSubCategoryAdminQuery.findFirst({ where: { id, categoryId: admin.categoryId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.categoryAdminToSubCategoryAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
    };
    return SubCategoryAdminQueriesService = _classThis;
})();
exports.SubCategoryAdminQueriesService = SubCategoryAdminQueriesService;
//# sourceMappingURL=queries.service.js.map