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
exports.UserNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let UserNotificationsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserNotificationsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserNotificationsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getInbox(userId) {
            try {
                const inbox = this.prisma.userNotificationInbox;
                if (!inbox)
                    return [];
                const rows = await inbox.findMany({
                    where: { userId },
                    orderBy: { deliveredAt: 'desc' },
                    take: 500,
                });
                return this.enrichInboxRowsWithSchoolLogos(rows);
            }
            catch {
                return [];
            }
        }
        hasUsableLogo(url) {
            const s = typeof url === 'string' ? url.trim() : '';
            if (!s || s === 'null' || s === 'undefined')
                return false;
            return true;
        }
        firstEventImageUrl(imageUrlsJson) {
            if (!imageUrlsJson?.trim())
                return null;
            try {
                const arr = JSON.parse(imageUrlsJson);
                if (!Array.isArray(arr))
                    return null;
                const first = arr.find((x) => typeof x === 'string' && x.trim());
                return first ? String(first).trim() : null;
            }
            catch {
                return null;
            }
        }
        /**
         * Prefer current `School.image` for every row with `schoolId`, then fall back to the related
         * `Event` (school image or first image in `imageUrls`) so the list always shows a real asset
         * when one exists in the DB — not only when push persisted `schoolLogoUrl`.
         */
        async enrichInboxRowsWithSchoolLogos(rows) {
            if (rows.length === 0)
                return rows;
            let out = rows.map((r) => ({ ...r }));
            const allSchoolIds = [...new Set(out.map((r) => r.schoolId).filter(Boolean))];
            if (allSchoolIds.length > 0) {
                const schools = await this.prisma.school.findMany({
                    where: { id: { in: allSchoolIds } },
                    select: { id: true, image: true },
                });
                const schoolImageById = new Map(schools.map((s) => [s.id, s.image?.trim() || '']));
                out = out.map((r) => {
                    const sid = r.schoolId;
                    if (!sid)
                        return r;
                    const img = schoolImageById.get(sid);
                    if (!this.hasUsableLogo(img))
                        return r;
                    return { ...r, schoolLogoUrl: img };
                });
            }
            const eventIds = [
                ...new Set(out.filter((r) => !this.hasUsableLogo(r.schoolLogoUrl) && r.eventId).map((r) => r.eventId)),
            ];
            if (eventIds.length > 0) {
                const events = await this.prisma.event.findMany({
                    where: { id: { in: eventIds } },
                    select: {
                        id: true,
                        imageUrls: true,
                        school: { select: { image: true } },
                    },
                });
                const logoByEventId = new Map(events.map((e) => {
                    const fromSchool = e.school?.image?.trim() || '';
                    const fromPost = this.firstEventImageUrl(e.imageUrls);
                    const logo = (this.hasUsableLogo(fromSchool) ? fromSchool : fromPost) || '';
                    return [e.id, logo];
                }));
                out = out.map((r) => {
                    if (this.hasUsableLogo(r.schoolLogoUrl))
                        return r;
                    const eid = r.eventId;
                    if (!eid)
                        return r;
                    const logo = logoByEventId.get(eid);
                    if (!this.hasUsableLogo(logo))
                        return r;
                    return { ...r, schoolLogoUrl: logo };
                });
            }
            return out;
        }
        async getUnreadCount(userId) {
            try {
                const inbox = this.prisma.userNotificationInbox;
                if (!inbox)
                    return { unreadCount: 0 };
                const unreadCount = await inbox.count({
                    where: { userId, readAt: null },
                });
                return { unreadCount };
            }
            catch {
                return { unreadCount: 0 };
            }
        }
        async markAllRead(userId) {
            try {
                const inbox = this.prisma.userNotificationInbox;
                if (!inbox)
                    return { ok: true };
                await inbox.updateMany({
                    where: { userId, readAt: null },
                    data: { readAt: new Date() },
                });
            }
            catch {
                return { ok: true };
            }
            return { ok: true };
        }
        async markRead(userId, id) {
            try {
                const inbox = this.prisma.userNotificationInbox;
                if (!inbox)
                    return { ok: true };
                await inbox.updateMany({
                    where: { id, userId, readAt: null },
                    data: { readAt: new Date() },
                });
            }
            catch {
                return { ok: true };
            }
            return { ok: true };
        }
        async registerPushToken(userId, token, platform) {
            const p = platform === 'ios' || platform === 'android' || platform === 'web' ? platform : 'android';
            await this.prisma.userPushDevice.upsert({
                where: {
                    userId_token: { userId, token },
                },
                create: {
                    id: (0, crypto_1.randomUUID)(),
                    userId,
                    token,
                    platform: p,
                },
                update: {
                    platform: p,
                },
            });
            return { ok: true };
        }
        async removePushToken(userId, token) {
            await this.prisma.userPushDevice.deleteMany({
                where: { userId, token },
            });
            return { ok: true };
        }
        async getNotificationSubcategories(userId) {
            const rows = await this.prisma.userNotificationSubCategory.findMany({
                where: { userId },
                select: { subCategoryId: true },
            });
            return { subCategoryIds: rows.map((r) => r.subCategoryId) };
        }
        /**
         * Replaces prefs. Only subcategories whose parent category belongs to the user's school are kept.
         */
        async setNotificationSubcategories(userId, subCategoryIds) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { schoolId: true },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            if (subCategoryIds.length === 0) {
                await this.prisma.userNotificationSubCategory.deleteMany({ where: { userId } });
                return { subCategoryIds: [] };
            }
            const subs = await this.prisma.subCategory.findMany({
                where: {
                    id: { in: subCategoryIds },
                    category: { schoolId: user.schoolId },
                },
                select: { id: true },
            });
            const allowed = new Set(subs.map((s) => s.id));
            const valid = subCategoryIds.filter((id) => allowed.has(id));
            await this.prisma.userNotificationSubCategory.deleteMany({ where: { userId } });
            if (valid.length > 0) {
                await this.prisma.userNotificationSubCategory.createMany({
                    data: valid.map((subCategoryId) => ({ userId, subCategoryId })),
                });
            }
            return { subCategoryIds: valid };
        }
    };
    return UserNotificationsService = _classThis;
})();
exports.UserNotificationsService = UserNotificationsService;
//# sourceMappingURL=user-notifications.service.js.map