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
exports.SubCategoryAdminStudentChatGroupsService = void 0;
const common_1 = require("@nestjs/common");
const student_chat_message_util_1 = require("../../student-chat-groups/student-chat-message.util");
const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
let SubCategoryAdminStudentChatGroupsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminStudentChatGroupsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminStudentChatGroupsService = _classThis = _classDescriptor.value;
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
        formatGroupRow(group) {
            return {
                id: group.id,
                name: group.name,
                description: group.description,
                avatarUrl: group.avatarUrl,
                visibility: (0, student_chat_message_util_1.isStudentChatGroupVisibility)(group.visibility) ? group.visibility : 'public',
                memberCount: group._count.members,
                lastMessageAt: group.lastMessageAt ?? group.createdAt,
                createdAt: group.createdAt,
            };
        }
        async listForSchool(schoolId) {
            await this.assertGroupMessagingEnabled(schoolId);
            const groups = await this.prisma.studentChatGroup.findMany({
                where: { schoolId, isActive: true },
                orderBy: [{ lastMessageAt: 'desc' }, { name: 'asc' }],
                select: {
                    id: true,
                    name: true,
                    description: true,
                    avatarUrl: true,
                    visibility: true,
                    createdAt: true,
                    lastMessageAt: true,
                    _count: { select: { members: { where: { status: 'active' } } } },
                },
            });
            return groups.map((g) => this.formatGroupRow(g));
        }
        async searchStudents(schoolId, q) {
            const query = typeof q === 'string' ? q.trim() : '';
            const users = await this.prisma.user.findMany({
                where: {
                    schoolId,
                    status: 'active',
                    ...(query
                        ? {
                            OR: [
                                { name: { contains: query } },
                                { email: { contains: query } },
                            ],
                        }
                        : {}),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePicUrl: true,
                },
                orderBy: { name: 'asc' },
                take: 30,
            });
            return users;
        }
        async createGroup(subCategoryAdminId, schoolId, dto) {
            await this.assertGroupMessagingEnabled(schoolId);
            const name = dto.name.trim();
            if (name.length < 2) {
                throw new common_1.BadRequestException('Group name must be at least 2 characters.');
            }
            const visibility = dto.visibility && (0, student_chat_message_util_1.isStudentChatGroupVisibility)(dto.visibility) ? dto.visibility : 'public';
            const group = await this.prisma.studentChatGroup.create({
                data: {
                    schoolId,
                    name,
                    description: dto.description?.trim() || null,
                    visibility,
                    createdBySubCategoryAdminId: subCategoryAdminId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    avatarUrl: true,
                    visibility: true,
                    createdAt: true,
                    lastMessageAt: true,
                    _count: { select: { members: { where: { status: 'active' } } } },
                },
            });
            return this.formatGroupRow(group);
        }
        async getGroupForSchool(groupId, schoolId) {
            const group = await this.prisma.studentChatGroup.findFirst({
                where: { id: groupId, schoolId, isActive: true },
            });
            if (!group) {
                throw new common_1.NotFoundException('Group not found.');
            }
            return group;
        }
        async listMembers(groupId, schoolId) {
            await this.getGroupForSchool(groupId, schoolId);
            return this.prisma.studentChatGroupMember.findMany({
                where: { groupId, status: 'active' },
                orderBy: { joinedAt: 'asc' },
                select: {
                    role: true,
                    joinedAt: true,
                    user: {
                        select: { id: true, name: true, email: true, profilePicUrl: true },
                    },
                },
            });
        }
        async addMember(groupId, schoolId, userId) {
            await this.getGroupForSchool(groupId, schoolId);
            const user = await this.prisma.user.findFirst({
                where: { id: userId, schoolId, status: 'active' },
                select: { id: true },
            });
            if (!user) {
                throw new common_1.BadRequestException('Student not found at your school.');
            }
            const existing = await this.prisma.studentChatGroupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
            });
            if (existing?.status === 'active') {
                throw new common_1.BadRequestException('Student is already in this group.');
            }
            if (existing?.status === 'banned') {
                throw new common_1.BadRequestException('This student is banned from the group.');
            }
            if (existing) {
                await this.prisma.studentChatGroupMember.update({
                    where: { id: existing.id },
                    data: { status: 'active', joinedAt: new Date(), lastReadAt: new Date() },
                });
            }
            else {
                await this.prisma.studentChatGroupMember.create({
                    data: {
                        groupId,
                        userId,
                        schoolId,
                        role: 'member',
                        status: 'active',
                        lastReadAt: new Date(),
                    },
                });
            }
            return { ok: true };
        }
    };
    return SubCategoryAdminStudentChatGroupsService = _classThis;
})();
exports.SubCategoryAdminStudentChatGroupsService = SubCategoryAdminStudentChatGroupsService;
//# sourceMappingURL=subcategory-admin-student-chat-groups.service.js.map