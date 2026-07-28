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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'naveenreddyhosur921@gmail.com';
let SupportService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SupportService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupportService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        emailService;
        prisma;
        meetingsService;
        constructor(emailService, prisma, meetingsService) {
            this.emailService = emailService;
            this.prisma = prisma;
            this.meetingsService = meetingsService;
        }
        async sendSupportRequest(supportRequestDto, superAdminId, superAdminEmail) {
            let meetingLink = null;
            let meetingError = null;
            if (supportRequestDto.type === 'schedule_meeting' &&
                supportRequestDto.meetingType &&
                supportRequestDto.meetingDate &&
                supportRequestDto.timeSlot &&
                supportRequestDto.timeZone &&
                (supportRequestDto.meetingType === 'google_meet' || supportRequestDto.meetingType === 'zoom')) {
                const dateStr = supportRequestDto.meetingDate.split('T')[0];
                const attendeeEmails = superAdminEmail ? [superAdminEmail, SUPPORT_EMAIL] : [SUPPORT_EMAIL];
                const result = await this.meetingsService.scheduleMeeting({
                    meetingType: supportRequestDto.meetingType,
                    meetingDate: dateStr,
                    timeSlot: supportRequestDto.timeSlot,
                    timeZone: supportRequestDto.timeZone,
                    title: 'SemBuzz Support Meeting',
                    attendeeEmails,
                });
                if (!('error' in result)) {
                    meetingLink = result.meetingLink;
                }
                else {
                    meetingError = result.error;
                    console.warn('[SupportService] Meeting could not be created:', result.error);
                }
            }
            if (superAdminId) {
                await this.prisma.superAdminQuery.create({
                    data: {
                        superAdminId,
                        type: supportRequestDto.type,
                        meetingType: supportRequestDto.meetingType,
                        meetingDate: supportRequestDto.meetingDate ? new Date(supportRequestDto.meetingDate) : null,
                        timeZone: supportRequestDto.timeZone,
                        timeSlot: supportRequestDto.timeSlot,
                        meetingLink: meetingLink ?? undefined,
                        description: supportRequestDto.description,
                        customMessage: supportRequestDto.customMessage,
                        status: 'pending',
                    },
                });
            }
            await this.emailService.sendDeveloperSupportRequest({
                type: supportRequestDto.type,
                description: supportRequestDto.description,
                meetingType: supportRequestDto.meetingType,
                timeZone: supportRequestDto.timeZone,
                timeSlot: supportRequestDto.timeSlot,
                customMessage: supportRequestDto.customMessage,
                meetingLink: meetingLink ?? undefined,
                meetingError: meetingError ?? undefined,
            }, superAdminEmail);
            return { message: 'Support request sent successfully', meetingLink: meetingLink ?? undefined };
        }
        async findAll(superAdminId) {
            const where = superAdminId ? { superAdminId } : {};
            return this.prisma.superAdminQuery.findMany({
                where,
                include: {
                    superAdmin: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async updateStatus(id, status) {
            return this.prisma.superAdminQuery.update({
                where: { id },
                data: { status },
            });
        }
        async sendReply(id, message) {
            const query = await this.prisma.superAdminQuery.findUnique({
                where: { id },
                include: {
                    superAdmin: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            if (!query) {
                throw new Error('Query not found');
            }
            // Update status to responded
            await this.prisma.superAdminQuery.update({
                where: { id },
                data: { status: 'responded' },
            });
            // Send email reply to developer
            await this.emailService.sendDeveloperQueryReply('naveenreddyhosur921@gmail.com', query.superAdmin.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async findFromSchoolAdmins() {
            return this.prisma.query.findMany({
                include: {
                    schoolAdmin: {
                        include: {
                            school: { select: { id: true, name: true, refNum: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findFromCategoryAdmins() {
            return this.prisma.categoryAdminToSuperAdminQuery.findMany({
                include: {
                    categoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                            school: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findFromSubcategoryAdmins() {
            return this.prisma.subCategoryAdminToSuperAdminQuery.findMany({
                include: {
                    subCategoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                            subCategory: { select: { name: true } },
                            school: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async deleteFromSchoolAdmins(id) {
            const q = await this.prisma.query.findUnique({ where: { id } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.query.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteFromCategoryAdmins(id) {
            const q = await this.prisma.categoryAdminToSuperAdminQuery.findUnique({ where: { id } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.categoryAdminToSuperAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteFromSubcategoryAdmins(id) {
            const q = await this.prisma.subCategoryAdminToSuperAdminQuery.findUnique({ where: { id } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.subCategoryAdminToSuperAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async deleteSuperAdminQuery(id) {
            const q = await this.prisma.superAdminQuery.findUnique({ where: { id } });
            if (!q)
                throw new common_1.NotFoundException('Query not found');
            if (q.status !== 'responded')
                throw new common_1.BadRequestException('Respond to the query in order to delete it.');
            await this.prisma.superAdminQuery.delete({ where: { id } });
            return { deleted: true };
        }
        async replyToSchoolAdminQuery(id, message) {
            const query = await this.prisma.query.findUnique({
                where: { id },
                include: {
                    schoolAdmin: {
                        include: {
                            school: { select: { name: true } },
                        },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.query.update({
                where: { id },
                data: { status: 'responded' },
            });
            await this.emailService.sendQueryReply(query.schoolAdmin.email, query.schoolAdmin.name, query.schoolAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async replyToCategoryAdminQuery(id, message) {
            const query = await this.prisma.categoryAdminToSuperAdminQuery.findUnique({
                where: { id },
                include: {
                    categoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                            school: { select: { name: true } },
                        },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.categoryAdminToSuperAdminQuery.update({
                where: { id },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToCategoryAdmin(query.categoryAdmin.email, query.categoryAdmin.name, query.categoryAdmin.school.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
        async replyToSubcategoryAdminQuery(id, message) {
            const query = await this.prisma.subCategoryAdminToSuperAdminQuery.findUnique({
                where: { id },
                include: {
                    subCategoryAdmin: {
                        include: {
                            category: { select: { name: true } },
                        },
                    },
                },
            });
            if (!query)
                throw new common_1.NotFoundException('Query not found');
            await this.prisma.subCategoryAdminToSuperAdminQuery.update({
                where: { id },
                data: { status: 'responded' },
            });
            await this.emailService.sendReplyToSubCategoryAdmin(query.subCategoryAdmin.email, query.subCategoryAdmin.name, query.subCategoryAdmin.category.name, query.type, message);
            return { message: 'Reply sent successfully' };
        }
    };
    return SupportService = _classThis;
})();
exports.SupportService = SupportService;
//# sourceMappingURL=support.service.js.map