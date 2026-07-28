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
exports.UserEventsService = void 0;
const common_1 = require("@nestjs/common");
let UserEventsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserEventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserEventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async ensureUserInSchool(userId, schoolId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { schoolId: true },
            });
            if (!user || user.schoolId !== schoolId) {
                throw new common_1.ForbiddenException('Event not in your school');
            }
        }
        async getEventSchoolId(eventId) {
            const event = await this.prisma.event.findUnique({
                where: { id: eventId },
                select: { schoolId: true, status: true },
            });
            if (!event)
                throw new common_1.NotFoundException('Event not found');
            if (event.status !== 'approved')
                throw new common_1.NotFoundException('Event not found');
            return event.schoolId;
        }
        async getEngagement(eventIds, userId) {
            if (!eventIds.length) {
                return { likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] };
            }
            const [likeCounts, commentCounts, likesByUser, savedByUser] = await Promise.all([
                this.prisma.eventLike.groupBy({
                    by: ['eventId'],
                    where: { eventId: { in: eventIds } },
                    _count: { eventId: true },
                }),
                this.prisma.eventComment.groupBy({
                    by: ['eventId'],
                    where: { eventId: { in: eventIds } },
                    _count: { eventId: true },
                }),
                this.prisma.eventLike.findMany({
                    where: { eventId: { in: eventIds }, userId },
                    select: { eventId: true },
                }),
                this.prisma.userSavedEvent.findMany({
                    where: { eventId: { in: eventIds }, userId },
                    select: { eventId: true },
                }),
            ]);
            const likes = {};
            eventIds.forEach((id) => (likes[id] = 0));
            likeCounts.forEach((g) => (likes[g.eventId] = g._count.eventId));
            const commentCountsMap = {};
            eventIds.forEach((id) => (commentCountsMap[id] = 0));
            commentCounts.forEach((g) => (commentCountsMap[g.eventId] = g._count.eventId));
            return {
                likes,
                commentCounts: commentCountsMap,
                likedByMe: likesByUser.map((l) => l.eventId),
                savedByMe: savedByUser.map((s) => s.eventId),
            };
        }
        async toggleLike(eventId, userId) {
            const schoolId = await this.getEventSchoolId(eventId);
            await this.ensureUserInSchool(userId, schoolId);
            const existing = await this.prisma.eventLike.findUnique({
                where: { eventId_userId: { eventId, userId } },
            });
            if (existing) {
                await this.prisma.eventLike.delete({
                    where: { eventId_userId: { eventId, userId } },
                });
                const count = await this.prisma.eventLike.count({ where: { eventId } });
                return { liked: false, count };
            }
            await this.prisma.eventLike.create({
                data: { eventId, userId },
            });
            const count = await this.prisma.eventLike.count({ where: { eventId } });
            return { liked: true, count };
        }
        async getComments(eventId, userId) {
            const schoolId = await this.getEventSchoolId(eventId);
            await this.ensureUserInSchool(userId, schoolId);
            const event = await this.prisma.event.findUnique({
                where: { id: eventId },
                select: { commentsEnabled: true },
            });
            if (!event?.commentsEnabled)
                return [];
            return this.prisma.eventComment.findMany({
                where: { eventId },
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { id: true, name: true, profilePicUrl: true } },
                },
            });
        }
        async addComment(eventId, userId, text) {
            const schoolId = await this.getEventSchoolId(eventId);
            await this.ensureUserInSchool(userId, schoolId);
            const event = await this.prisma.event.findUnique({
                where: { id: eventId },
                select: { commentsEnabled: true },
            });
            if (!event?.commentsEnabled) {
                throw new common_1.ForbiddenException('Comments are disabled for this post');
            }
            const trimmed = (text || '').trim();
            if (!trimmed)
                throw new common_1.ForbiddenException('Comment text is required');
            const comment = await this.prisma.eventComment.create({
                data: { eventId, userId, text: trimmed },
                include: {
                    user: { select: { id: true, name: true, profilePicUrl: true } },
                },
            });
            const count = await this.prisma.eventComment.count({ where: { eventId } });
            return { comment, commentCount: count };
        }
        async deleteComment(commentId, userId) {
            const comment = await this.prisma.eventComment.findUnique({
                where: { id: commentId },
                select: { id: true, eventId: true, userId: true },
            });
            if (!comment)
                throw new common_1.NotFoundException('Comment not found');
            if (comment.userId !== userId) {
                throw new common_1.ForbiddenException('You can only delete your own comment');
            }
            await this.prisma.eventComment.delete({
                where: { id: commentId },
            });
            const commentCount = await this.prisma.eventComment.count({
                where: { eventId: comment.eventId },
            });
            return { commentCount };
        }
        async toggleSave(eventId, userId) {
            const schoolId = await this.getEventSchoolId(eventId);
            await this.ensureUserInSchool(userId, schoolId);
            const existing = await this.prisma.userSavedEvent.findUnique({
                where: { userId_eventId: { userId, eventId } },
            });
            if (existing) {
                await this.prisma.userSavedEvent.delete({
                    where: { userId_eventId: { userId, eventId } },
                });
                return { saved: false };
            }
            await this.prisma.userSavedEvent.create({
                data: { userId, eventId },
            });
            return { saved: true };
        }
        async getSavedEvents(userId) {
            const saved = await this.prisma.userSavedEvent.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    event: {
                        include: {
                            school: { select: { name: true, image: true, city: true } },
                            subCategory: { select: { id: true, name: true } },
                        },
                    },
                },
            });
            return saved.map((s) => ({ ...s.event, savedAt: s.createdAt }));
        }
        async getLikedEvents(userId) {
            const likes = await this.prisma.eventLike.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    event: {
                        include: {
                            school: { select: { name: true, image: true, city: true } },
                            subCategory: { select: { id: true, name: true } },
                        },
                    },
                },
            });
            return likes
                .filter((l) => l.event != null && l.event.status === 'approved')
                .map((l) => {
                const e = l.event;
                return {
                    id: e.id,
                    title: e.title,
                    description: e.description,
                    externalLink: e.externalLink,
                    imageUrls: e.imageUrls,
                    school: e.school,
                    subCategory: e.subCategory,
                    likedAt: l.createdAt.toISOString(),
                };
            });
        }
    };
    return UserEventsService = _classThis;
})();
exports.UserEventsService = UserEventsService;
//# sourceMappingURL=user-events.service.js.map