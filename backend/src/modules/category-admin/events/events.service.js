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
exports.CategoryAdminEventsService = void 0;
const common_1 = require("@nestjs/common");
let CategoryAdminEventsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminEventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminEventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        pushNotifications;
        constructor(prisma, pushNotifications) {
            this.prisma = prisma;
            this.pushNotifications = pushNotifications;
        }
        async getCategoryAdminCategoryIds(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                select: {
                    categoryId: true,
                    categories: { select: { categoryId: true } },
                },
            });
            if (!admin)
                return [];
            return [
                admin.categoryId,
                ...admin.categories.map((c) => c.categoryId),
            ].filter((id, i, arr) => arr.indexOf(id) === i);
        }
        async ensureEventAccess(eventId, categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            const event = await this.prisma.event.findFirst({
                where: {
                    id: eventId,
                    categoryId: { in: categoryIds },
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
            if (!event)
                throw new common_1.NotFoundException('Event not found');
            return event;
        }
        async findPendingForCategoryAdmin(categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0)
                return [];
            return this.prisma.event.findMany({
                where: {
                    categoryId: { in: categoryIds },
                    status: 'pending',
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findApprovedForCategoryAdmin(categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0)
                return [];
            return this.prisma.event.findMany({
                where: {
                    categoryId: { in: categoryIds },
                    status: 'approved',
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async delete(eventId, categoryAdminId) {
            await this.ensureEventAccess(eventId, categoryAdminId);
            const event = await this.prisma.event.findUnique({ where: { id: eventId } });
            if (!event || event.status !== 'approved') {
                throw new common_1.ForbiddenException('Only approved events can be deleted');
            }
            await this.prisma.event.delete({ where: { id: eventId } });
            return { deleted: true };
        }
        async update(eventId, categoryAdminId, dto) {
            await this.ensureEventAccess(eventId, categoryAdminId);
            const event = await this.prisma.event.findUnique({ where: { id: eventId } });
            if (!event || event.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending events can be edited');
            }
            return this.prisma.event.update({
                where: { id: eventId },
                data: {
                    ...(dto.title !== undefined && { title: dto.title }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.externalLink !== undefined && { externalLink: dto.externalLink }),
                    ...(dto.commentsEnabled !== undefined && { commentsEnabled: dto.commentsEnabled }),
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        async revert(eventId, categoryAdminId, revertNotes) {
            await this.ensureEventAccess(eventId, categoryAdminId);
            const event = await this.prisma.event.findUnique({ where: { id: eventId } });
            if (!event || event.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending events can be reverted');
            }
            return this.prisma.event.update({
                where: { id: eventId },
                data: { status: 'reverted', revertNotes },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        async approve(eventId, categoryAdminId) {
            await this.ensureEventAccess(eventId, categoryAdminId);
            const event = await this.prisma.event.findUnique({ where: { id: eventId } });
            if (!event || event.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending events can be approved');
            }
            const updated = await this.prisma.event.update({
                where: { id: eventId },
                data: { status: 'approved' },
                include: {
                    school: { select: { name: true, image: true } },
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
            void this.pushNotifications
                .notifyUsersForApprovedEvent({
                id: updated.id,
                schoolId: updated.schoolId,
                subCategoryId: updated.subCategoryId,
                title: updated.title,
                schoolName: updated.school?.name ?? undefined,
                schoolLogoUrl: updated.school?.image ?? null,
            })
                .catch((err) => {
                console.error('[CategoryAdminEvents] push notify failed', err);
            });
            return updated;
        }
    };
    return CategoryAdminEventsService = _classThis;
})();
exports.CategoryAdminEventsService = CategoryAdminEventsService;
//# sourceMappingURL=events.service.js.map