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
exports.ClubGroupChatRequestsService = void 0;
const common_1 = require("@nestjs/common");
const club_group_chat_requests_util_1 = require("./club-group-chat-requests.util");
const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
let ClubGroupChatRequestsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ClubGroupChatRequestsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClubGroupChatRequestsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async assertGroupMessagingEnabled(schoolId) {
            const enabled = await this.prisma.schoolFeature.findFirst({
                where: {
                    schoolId,
                    isEnabled: true,
                    feature: { code: GROUP_MESSAGING_CODE },
                },
                select: { id: true },
            });
            if (!enabled) {
                throw new common_1.ForbiddenException('Group messaging is not enabled for this school.');
            }
        }
        async listClubsForSchool(schoolId) {
            await this.assertGroupMessagingEnabled(schoolId);
            const accounts = await this.prisma.schoolSocialAccount.findMany({
                where: { schoolId },
                select: { id: true, pageName: true, icon: true },
                orderBy: { pageName: 'asc' },
            });
            const clubs = (0, club_group_chat_requests_util_1.groupSchoolSocialAccountsIntoClubs)(accounts);
            const [enabledChats, pendingRequests] = await Promise.all([
                this.prisma.clubGroupChat.findMany({
                    where: { schoolId, isEnabled: true },
                    select: { clubKey: true },
                }),
                this.prisma.clubGroupChatRequest.findMany({
                    where: { schoolId, status: 'pending' },
                    select: { clubKey: true },
                }),
            ]);
            const enabledKeys = new Set(enabledChats.map((c) => c.clubKey));
            const pendingKeys = new Set(pendingRequests.map((r) => r.clubKey));
            return clubs.map((club) => ({
                ...club,
                hasGroupChat: enabledKeys.has(club.key),
                hasPendingRequest: pendingKeys.has(club.key),
            }));
        }
        async listForSubCategoryAdmin(subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: { id: true, schoolId: true, isActive: true },
            });
            if (!admin || !admin.isActive) {
                throw new common_1.ForbiddenException('Account is not active.');
            }
            await this.assertGroupMessagingEnabled(admin.schoolId);
            return this.prisma.clubGroupChatRequest.findMany({
                where: { subCategoryAdminId },
                orderBy: { createdAt: 'desc' },
                select: club_group_chat_requests_util_1.CLUB_GROUP_CHAT_REQUEST_SELECT,
            });
        }
        async createForSubCategoryAdmin(subCategoryAdminId, dto) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: { id: true, schoolId: true, isActive: true },
            });
            if (!admin || !admin.isActive) {
                throw new common_1.ForbiddenException('Account is not active.');
            }
            await this.assertGroupMessagingEnabled(admin.schoolId);
            const expectedKey = (0, club_group_chat_requests_util_1.clubKeyFromParts)(dto.pageName, dto.icon);
            if (dto.clubKey !== expectedKey) {
                throw new common_1.BadRequestException('Club selection is invalid. Please choose a club again.');
            }
            const clubExists = await this.prisma.schoolSocialAccount.findFirst({
                where: {
                    schoolId: admin.schoolId,
                    pageName: dto.pageName,
                    icon: dto.icon,
                },
                select: { id: true },
            });
            if (!clubExists) {
                throw new common_1.BadRequestException('Club not found. Ask your school admin to create the club under Social Share.');
            }
            const existingChat = await this.prisma.clubGroupChat.findUnique({
                where: {
                    schoolId_clubKey: { schoolId: admin.schoolId, clubKey: dto.clubKey },
                },
                select: { id: true, isEnabled: true },
            });
            if (existingChat?.isEnabled) {
                throw new common_1.BadRequestException('Group chat already exists for this club.');
            }
            const pending = await this.prisma.clubGroupChatRequest.findFirst({
                where: {
                    schoolId: admin.schoolId,
                    clubKey: dto.clubKey,
                    status: 'pending',
                },
                select: { id: true },
            });
            if (pending) {
                throw new common_1.BadRequestException('A request for this club is already pending approval.');
            }
            return this.prisma.clubGroupChatRequest.create({
                data: {
                    schoolId: admin.schoolId,
                    subCategoryAdminId: admin.id,
                    clubKey: dto.clubKey,
                    pageName: dto.pageName,
                    icon: dto.icon,
                    note: dto.note?.trim() || null,
                    status: 'pending',
                },
                select: club_group_chat_requests_util_1.CLUB_GROUP_CHAT_REQUEST_SELECT,
            });
        }
        async listForSchoolReview(schoolId, status) {
            await this.assertGroupMessagingEnabled(schoolId);
            return this.prisma.clubGroupChatRequest.findMany({
                where: {
                    schoolId,
                    ...(status ? { status } : {}),
                },
                orderBy: { createdAt: 'desc' },
                select: club_group_chat_requests_util_1.CLUB_GROUP_CHAT_REQUEST_SELECT,
            });
        }
        async getPendingRequestForSchool(requestId, schoolId) {
            const row = await this.prisma.clubGroupChatRequest.findFirst({
                where: { id: requestId, schoolId },
                select: {
                    id: true,
                    schoolId: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                    status: true,
                },
            });
            if (!row)
                throw new common_1.NotFoundException('Group chat request not found.');
            if (row.status !== 'pending') {
                throw new common_1.BadRequestException('This request has already been reviewed.');
            }
            return row;
        }
        async provisionClubGroupChat(schoolId, clubKey, pageName, icon) {
            const clubExists = await this.prisma.schoolSocialAccount.findFirst({
                where: { schoolId, pageName, icon },
                select: { id: true },
            });
            if (!clubExists) {
                throw new common_1.BadRequestException('Club no longer exists for this school.');
            }
            return this.prisma.clubGroupChat.upsert({
                where: { schoolId_clubKey: { schoolId, clubKey } },
                create: {
                    schoolId,
                    clubKey,
                    pageName,
                    icon,
                    isEnabled: true,
                },
                update: {
                    pageName,
                    icon,
                    isEnabled: true,
                },
                select: { id: true, clubKey: true, pageName: true, icon: true },
            });
        }
        async approve(requestId, schoolId, reviewerRole, reviewerAdminId) {
            await this.assertGroupMessagingEnabled(schoolId);
            const row = await this.getPendingRequestForSchool(requestId, schoolId);
            const chat = await this.provisionClubGroupChat(schoolId, row.clubKey, row.pageName, row.icon);
            return this.prisma.clubGroupChatRequest.update({
                where: { id: row.id },
                data: {
                    status: 'approved',
                    reviewedByRole: reviewerRole,
                    reviewedByAdminId: reviewerAdminId,
                    reviewedAt: new Date(),
                    clubGroupChatId: chat.id,
                },
                select: club_group_chat_requests_util_1.CLUB_GROUP_CHAT_REQUEST_SELECT,
            });
        }
        async decline(requestId, schoolId, reviewerRole, reviewerAdminId, dto) {
            await this.assertGroupMessagingEnabled(schoolId);
            const row = await this.getPendingRequestForSchool(requestId, schoolId);
            return this.prisma.clubGroupChatRequest.update({
                where: { id: row.id },
                data: {
                    status: 'declined',
                    reviewedByRole: reviewerRole,
                    reviewedByAdminId: reviewerAdminId,
                    reviewedAt: new Date(),
                    declineReason: dto.reason?.trim() || null,
                },
                select: club_group_chat_requests_util_1.CLUB_GROUP_CHAT_REQUEST_SELECT,
            });
        }
    };
    return ClubGroupChatRequestsService = _classThis;
})();
exports.ClubGroupChatRequestsService = ClubGroupChatRequestsService;
//# sourceMappingURL=club-group-chat-requests.service.js.map