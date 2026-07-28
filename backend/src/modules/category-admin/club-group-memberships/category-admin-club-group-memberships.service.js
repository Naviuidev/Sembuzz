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
exports.CategoryAdminClubGroupMembershipsService = void 0;
const common_1 = require("@nestjs/common");
let CategoryAdminClubGroupMembershipsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminClubGroupMembershipsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminClubGroupMembershipsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        emailService;
        logger = new common_1.Logger(CategoryAdminClubGroupMembershipsService.name);
        constructor(prisma, emailService) {
            this.prisma = prisma;
            this.emailService = emailService;
        }
        async listForSchool(schoolId, status) {
            return this.prisma.clubGroupMembership.findMany({
                where: { schoolId, status },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    reviewedAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            profilePicUrl: true,
                            registrationMethod: true,
                            createdAt: true,
                        },
                    },
                    school: { select: { id: true, name: true } },
                    groupChat: {
                        select: {
                            id: true,
                            pageName: true,
                            icon: true,
                            clubKey: true,
                        },
                    },
                    reviewedBy: { select: { id: true, name: true, email: true } },
                },
            });
        }
        async getMembershipForSchool(membershipId, schoolId) {
            const row = await this.prisma.clubGroupMembership.findFirst({
                where: { id: membershipId, schoolId },
            });
            if (!row)
                throw new common_1.NotFoundException('Membership request not found.');
            return row;
        }
        async approve(membershipId, schoolId, categoryAdminId) {
            const row = await this.getMembershipForSchool(membershipId, schoolId);
            if (row.status === 'approved') {
                return { id: row.id, status: row.status };
            }
            const shouldNotify = row.status === 'pending' || row.status === 'banned';
            const updated = await this.prisma.clubGroupMembership.update({
                where: { id: membershipId },
                data: {
                    status: 'approved',
                    reviewedByCategoryAdminId: categoryAdminId,
                    reviewedAt: new Date(),
                },
                select: { id: true, status: true },
            });
            if (shouldNotify) {
                await this.sendJoinApprovedEmail(membershipId);
            }
            return updated;
        }
        async sendJoinApprovedEmail(membershipId) {
            const details = await this.prisma.clubGroupMembership.findUnique({
                where: { id: membershipId },
                select: {
                    user: {
                        select: { email: true, name: true, firstName: true, lastName: true },
                    },
                    school: { select: { name: true } },
                    groupChat: { select: { pageName: true, icon: true } },
                },
            });
            const email = details?.user?.email?.trim();
            if (!email || !details?.school || !details?.groupChat)
                return;
            const userName = details.user.name?.trim() ||
                [details.user.firstName, details.user.lastName].filter(Boolean).join(' ').trim() ||
                'there';
            const groupName = [details.groupChat.icon, details.groupChat.pageName]
                .filter(Boolean)
                .join(' ')
                .trim();
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const appsUrl = `${frontendUrl}/events?tab=apps`;
            try {
                await this.emailService.sendClubGroupJoinApprovedEmail(email, userName, details.school.name, groupName || 'your club group', appsUrl);
            }
            catch (err) {
                this.logger.error(`Failed to send club group approval email to ${email}`, err instanceof Error ? err.stack : String(err));
            }
        }
        async ban(membershipId, schoolId, categoryAdminId) {
            await this.getMembershipForSchool(membershipId, schoolId);
            return this.prisma.clubGroupMembership.update({
                where: { id: membershipId },
                data: {
                    status: 'banned',
                    reviewedByCategoryAdminId: categoryAdminId,
                    reviewedAt: new Date(),
                },
                select: { id: true, status: true },
            });
        }
    };
    return CategoryAdminClubGroupMembershipsService = _classThis;
})();
exports.CategoryAdminClubGroupMembershipsService = CategoryAdminClubGroupMembershipsService;
//# sourceMappingURL=category-admin-club-group-memberships.service.js.map