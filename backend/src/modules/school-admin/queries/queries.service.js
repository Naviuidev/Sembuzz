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
exports.QueriesService = void 0;
const common_1 = require("@nestjs/common");
let QueriesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var QueriesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            QueriesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        emailService;
        meetingsService;
        logger = new common_1.Logger(QueriesService.name);
        constructor(prisma, emailService, meetingsService) {
            this.prisma = prisma;
            this.emailService = emailService;
            this.meetingsService = meetingsService;
        }
        async create(adminId, createQueryDto) {
            const { type, meetingType, date, timeSlot, timeZone, description, customMessage, attachmentUrl } = createQueryDto;
            const messageOrDescription = type === 'custom_message' ? customMessage ?? description : description;
            let query;
            try {
                query = await this.prisma.query.create({
                    data: {
                        schoolAdminId: adminId,
                        type,
                        meetingType,
                        date: date ? new Date(date) : null,
                        timeSlot,
                        timeZone,
                        description: messageOrDescription ?? undefined,
                        attachmentUrl: attachmentUrl ?? undefined,
                        status: 'pending',
                    },
                    include: {
                        schoolAdmin: {
                            include: {
                                school: {
                                    select: {
                                        name: true,
                                        refNum: true,
                                    },
                                },
                            },
                        },
                    },
                });
            }
            catch (err) {
                this.logger.error('Failed to create query', err);
                const message = err instanceof Error ? err.message : 'Failed to create query';
                throw new common_1.InternalServerErrorException(message);
            }
            let meetingLink = null;
            if (type === 'schedule_meeting' &&
                meetingType &&
                date &&
                timeSlot &&
                timeZone &&
                (meetingType === 'google_meet' || meetingType === 'zoom')) {
                try {
                    const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        this.logger.warn(`Invalid date format received: ${date}`);
                    }
                    else {
                        const superAdmins = await this.prisma.superAdmin.findMany({ select: { email: true } });
                        const attendeeEmails = superAdmins.length > 0 ? superAdmins.map((a) => a.email) : [process.env.SUPPORT_EMAIL || 'naveenreddyhosur921@gmail.com'];
                        const result = await this.meetingsService.scheduleMeeting({
                            meetingType: meetingType,
                            meetingDate: dateStr,
                            timeSlot,
                            timeZone,
                            title: `SemBuzz Meeting - ${query.schoolAdmin.school.name}`,
                            attendeeEmails,
                        });
                        if (!('error' in result)) {
                            meetingLink = result.meetingLink;
                            await this.prisma.query.update({ where: { id: query.id }, data: { meetingLink } });
                        }
                        else {
                            this.logger.warn('Meeting creation failed:', result.error);
                        }
                    }
                }
                catch (err) {
                    this.logger.error('Meeting schedule error', err);
                }
            }
            try {
                await this.emailService.sendSchoolAdminQueryToSuperAdmin(query.schoolAdmin.name, query.schoolAdmin.email, query.schoolAdmin.school.name, {
                    type,
                    description: messageOrDescription ?? undefined,
                    customMessage: type === 'custom_message' ? messageOrDescription ?? undefined : undefined,
                    meetingType,
                    timeZone: timeZone ?? undefined,
                    timeSlot: timeSlot ?? undefined,
                    attachmentUrl: attachmentUrl ?? undefined,
                    meetingLink: meetingLink ?? undefined,
                });
            }
            catch (err) {
                this.logger.error('Failed to send email', err);
                const message = err instanceof Error ? err.message : 'Failed to send notification email';
                throw new common_1.InternalServerErrorException(message);
            }
            return meetingLink ? { ...query, meetingLink } : query;
        }
        async findAll(adminId) {
            const where = adminId ? { schoolAdminId: adminId } : {};
            return this.prisma.query.findMany({
                where,
                include: {
                    schoolAdmin: {
                        include: {
                            school: {
                                select: {
                                    name: true,
                                    refNum: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findOne(id) {
            return this.prisma.query.findUnique({
                where: { id },
                include: {
                    schoolAdmin: {
                        include: {
                            school: {
                                select: {
                                    name: true,
                                    refNum: true,
                                },
                            },
                        },
                    },
                },
            });
        }
        async updateStatus(id, status) {
            return this.prisma.query.update({
                where: { id },
                data: { status },
            });
        }
        async sendReply(id, message) {
            const query = await this.prisma.query.findUnique({
                where: { id },
                include: {
                    schoolAdmin: {
                        include: {
                            school: {
                                select: {
                                    name: true,
                                    refNum: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!query) {
                throw new Error('Query not found');
            }
            // Update status to responded
            await this.prisma.query.update({
                where: { id },
                data: { status: 'responded' },
            });
            // Send email reply
            await this.emailService.sendQueryReply(query.schoolAdmin.email, query.schoolAdmin.name, query.schoolAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async listFromCategoryAdmins(schoolAdminId) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
                where: { id: schoolAdminId },
                select: { schoolId: true },
            });
            return this.prisma.categoryAdminQuery.findMany({
                where: { schoolId: admin.schoolId },
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
        async replyToCategoryAdmin(queryId, message) {
            const query = await this.prisma.categoryAdminQuery.findUniqueOrThrow({
                where: { id: queryId },
                include: {
                    categoryAdmin: { select: { name: true, email: true } },
                    school: { select: { name: true } },
                },
            });
            await this.prisma.categoryAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToCategoryAdmin(query.categoryAdmin.email, query.categoryAdmin.name, query.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async createToCategoryAdmin(adminId, dto) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
                where: { id: adminId },
                select: { schoolId: true },
            });
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.schoolAdminToCategoryAdminQuery.create({
                data: {
                    schoolAdminId: adminId,
                    schoolId: admin.schoolId,
                    type: dto.type,
                    meetingType: dto.meetingType,
                    date: dto.date ? new Date(dto.date) : null,
                    timeSlot: dto.timeSlot,
                    timeZone: dto.timeZone,
                    description: message ?? undefined,
                    attachmentUrl: dto.attachmentUrl,
                    status: 'pending',
                },
                include: {
                    schoolAdmin: { select: { name: true } },
                    school: { select: { name: true } },
                },
            });
        }
        async createToSubCategoryAdmin(adminId, dto) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
                where: { id: adminId },
                select: { schoolId: true },
            });
            const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
            return this.prisma.schoolAdminToSubCategoryAdminQuery.create({
                data: {
                    schoolAdminId: adminId,
                    schoolId: admin.schoolId,
                    type: dto.type,
                    meetingType: dto.meetingType,
                    date: dto.date ? new Date(dto.date) : null,
                    timeSlot: dto.timeSlot,
                    timeZone: dto.timeZone,
                    description: message ?? undefined,
                    attachmentUrl: dto.attachmentUrl,
                    status: 'pending',
                },
                include: {
                    schoolAdmin: { select: { name: true } },
                    school: { select: { name: true } },
                },
            });
        }
        async listFromSubCategoryAdmins(schoolAdminId) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
                where: { id: schoolAdminId },
                select: { schoolId: true },
            });
            return this.prisma.subCategoryAdminToSchoolAdminQuery.findMany({
                where: { schoolId: admin.schoolId },
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
        async deleteRaisedToSuperAdmin(id, schoolAdminId) {
            const q = await this.prisma.query.findFirst({ where: { id, schoolAdminId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.query.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteFromCategoryAdmin(id, schoolAdminId) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
            const q = await this.prisma.categoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.categoryAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async replyToSubcategoryAdmin(schoolAdminId, queryId, message) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
            const query = await this.prisma.subCategoryAdminToSchoolAdminQuery.findFirst({
                where: { id: queryId, schoolId: admin.schoolId },
                include: {
                    subCategoryAdmin: {
                        include: { category: { select: { name: true } } },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.subCategoryAdminToSchoolAdminQuery.update({
                where: { id: queryId },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToSubCategoryAdmin(query.subCategoryAdmin.email, query.subCategoryAdmin.name, query.subCategoryAdmin.category.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async deleteFromSubcategoryAdmin(id, schoolAdminId) {
            const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
            const q = await this.prisma.subCategoryAdminToSchoolAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.subCategoryAdminToSchoolAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
    };
    return QueriesService = _classThis;
})();
exports.QueriesService = QueriesService;
//# sourceMappingURL=queries.service.js.map