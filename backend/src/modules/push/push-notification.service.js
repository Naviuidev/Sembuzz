"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const crypto_1 = require("crypto");
/**
 * Sends push when:
 * - **Expo** (`ExponentPushToken[...]`) — Expo Push API (iOS TestFlight + Android from EAS builds).
 * - **FCM** — Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` / `GOOGLE_APPLICATION_CREDENTIALS`), Android native tokens.
 */
let PushNotificationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PushNotificationService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PushNotificationService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        log = new common_1.Logger(PushNotificationService.name);
        messaging = null;
        /** Expo Push; optional `EXPO_ACCESS_TOKEN` for higher rate limits / CI. */
        expoSdk = new expo_server_sdk_1.default({
            accessToken: process.env.EXPO_ACCESS_TOKEN?.trim() || undefined,
        });
        constructor(prisma) {
            this.prisma = prisma;
            try {
                const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
                if (json?.trim()) {
                    const cred = JSON.parse(json);
                    if (!admin.apps.length) {
                        admin.initializeApp({ credential: admin.credential.cert(cred) });
                    }
                    this.messaging = admin.messaging();
                    this.log.log('Firebase Admin initialized (FIREBASE_SERVICE_ACCOUNT_JSON)');
                }
                else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                    if (!admin.apps.length) {
                        admin.initializeApp();
                    }
                    this.messaging = admin.messaging();
                    this.log.log('Firebase Admin initialized (GOOGLE_APPLICATION_CREDENTIALS)');
                }
                else {
                    this.log.warn('Push disabled: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
                }
            }
            catch (e) {
                this.log.warn(`Firebase Admin init failed: ${e instanceof Error ? e.message : e}`);
            }
        }
        isEnabled() {
            return this.messaging != null;
        }
        toValidPublicImageUrl(raw) {
            const value = raw?.trim();
            if (!value)
                return undefined;
            try {
                const parsed = new URL(value);
                const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
                const host = parsed.hostname.toLowerCase();
                const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
                return isHttp && !isLocal ? parsed.toString() : undefined;
            }
            catch {
                return undefined;
            }
        }
        /**
         * FCM payloads need a public HTTPS URL; the in-app inbox can store a path clients resolve with their API base (e.g. /uploads/... for localhost).
         */
        inboxLogoForStorage(logoRaw, candidateAbsoluteUrl) {
            const publicUrl = this.toValidPublicImageUrl(candidateAbsoluteUrl);
            if (publicUrl)
                return publicUrl;
            const v = logoRaw.trim();
            if (!v)
                return null;
            if (v.startsWith('http://') || v.startsWith('https://')) {
                try {
                    const p = new URL(v);
                    const path = p.pathname + (p.search || '');
                    return path.startsWith('/uploads') ? path : null;
                }
                catch {
                    return null;
                }
            }
            let path = v.startsWith('/') ? v : `/${v}`;
            if (!path.startsWith('/uploads')) {
                path = `/uploads/${path.replace(/^\/+/, '')}`;
            }
            return path;
        }
        /** Notify users who opted into this subcategory; persist inbox for all matches, then send FCM if configured. */
        async notifyUsersForApprovedEvent(event) {
            const users = await this.prisma.user.findMany({
                where: {
                    schoolId: event.schoolId,
                    status: 'active',
                    notificationSubCategories: { some: { subCategoryId: event.subCategoryId } },
                },
                include: { pushDevices: true },
            });
            const matchedUserIds = [...new Set(users.map((u) => u.id))];
            const tokens = [...new Set(users.flatMap((u) => u.pushDevices.map((d) => d.token)))];
            const expoTokens = tokens.filter((t) => expo_server_sdk_1.default.isExpoPushToken(t));
            const fcmTokens = tokens.filter((t) => !expo_server_sdk_1.default.isExpoPushToken(t));
            this.log.log(`[Push] event=${event.id} school=${event.schoolId} subCategory=${event.subCategoryId} matchedUsers=${users.length} tokens=${tokens.length} (expo=${expoTokens.length} fcm=${fcmTokens.length}) firebase=${this.messaging ? 'on' : 'off'}`);
            const schoolName = event.schoolName?.trim() || 'School';
            const apiBase = (process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');
            const logoRaw = event.schoolLogoUrl?.trim() || '';
            const candidateSchoolLogoUrl = logoRaw
                ? logoRaw.startsWith('http')
                    ? logoRaw
                    : `${apiBase}${logoRaw.startsWith('/') ? '' : '/'}${logoRaw}`
                : undefined;
            const schoolLogoUrl = this.toValidPublicImageUrl(candidateSchoolLogoUrl);
            const inboxLogoUrl = logoRaw
                ? this.inboxLogoForStorage(logoRaw, candidateSchoolLogoUrl)
                : null;
            const title = `From ${schoolName}`;
            const body = event.title.length > 140 ? `${event.title.slice(0, 137)}…` : event.title;
            const data = {
                eventId: event.id,
                type: 'news_approved',
                schoolName,
            };
            // In-app inbox: always record for matched users at trigger time (independent of FCM).
            if (matchedUserIds.length > 0) {
                try {
                    const inbox = this.prisma.userNotificationInbox;
                    await inbox.createMany({
                        data: matchedUserIds.map((userId) => ({
                            id: (0, crypto_1.randomUUID)(),
                            userId,
                            eventId: event.id,
                            schoolId: event.schoolId,
                            schoolName,
                            schoolLogoUrl: inboxLogoUrl,
                            title,
                            body,
                        })),
                    });
                }
                catch (e) {
                    this.log.warn(`[Push] inbox save skipped: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            const dataStrings = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
            if (expoTokens.length > 0) {
                const messages = expoTokens.map((to) => ({
                    to,
                    sound: 'default',
                    title,
                    body,
                    data: dataStrings,
                    priority: 'high',
                }));
                const chunks = this.expoSdk.chunkPushNotifications(messages);
                for (let c = 0; c < chunks.length; c++) {
                    const chunk = chunks[c];
                    try {
                        const tickets = await this.expoSdk.sendPushNotificationsAsync(chunk);
                        const toRemove = [];
                        tickets.forEach((ticket, idx) => {
                            if (ticket.status === 'error') {
                                this.log.warn(`[Push] Expo ticket: ${ticket.message} code=${ticket.details?.error ?? '?'}`);
                                if (ticket.details?.error === 'DeviceNotRegistered' && chunk[idx]?.to) {
                                    const t = chunk[idx].to;
                                    if (typeof t === 'string')
                                        toRemove.push(t);
                                }
                            }
                        });
                        if (toRemove.length > 0) {
                            await this.prisma.userPushDevice.deleteMany({ where: { token: { in: toRemove } } });
                            this.log.warn(`[Push] removed ${toRemove.length} unregistered Expo token(s)`);
                        }
                    }
                    catch (e) {
                        this.log.error(`sendPushNotificationsAsync: ${e instanceof Error ? e.message : e}`);
                    }
                }
            }
            if (fcmTokens.length === 0) {
                return;
            }
            if (!this.messaging) {
                this.log.warn(`[Push] FCM tokens=${fcmTokens.length} skipped event=${event.id} — Firebase messaging not initialized`);
                return;
            }
            const chunkSize = 500;
            for (let i = 0; i < fcmTokens.length; i += chunkSize) {
                const batch = fcmTokens.slice(i, i + chunkSize);
                try {
                    const res = await this.messaging.sendEachForMulticast({
                        tokens: batch,
                        notification: { title, body },
                        data: dataStrings,
                        android: {
                            priority: 'high',
                            notification: {
                                color: '#FFFFFF',
                            },
                        },
                        apns: {
                            payload: { aps: { sound: 'default' } },
                        },
                    });
                    this.log.log(`[Push] FCM batch ${i / chunkSize + 1}: success=${res.successCount} failure=${res.failureCount}`);
                    const invalidTokens = [];
                    if (res.failureCount > 0) {
                        res.responses.forEach((r, idx) => {
                            if (!r.success && r.error) {
                                this.log.debug(`FCM fail token[${i + idx}]: ${r.error.message}`);
                                const code = r.error.code ?? '';
                                const msg = (r.error.message ?? '').toLowerCase();
                                const isInvalidToken = code === 'messaging/registration-token-not-registered' ||
                                    code === 'messaging/invalid-registration-token' ||
                                    code === 'messaging/invalid-argument' ||
                                    msg.includes('requested entity was not found') ||
                                    msg.includes('not a valid fcm registration token');
                                if (isInvalidToken) {
                                    invalidTokens.push(batch[idx]);
                                }
                            }
                        });
                    }
                    if (invalidTokens.length > 0) {
                        const uniqueInvalid = [...new Set(invalidTokens)];
                        await this.prisma.userPushDevice.deleteMany({
                            where: { token: { in: uniqueInvalid } },
                        });
                        this.log.warn(`[Push] removed ${uniqueInvalid.length} invalid FCM token(s) from database`);
                    }
                }
                catch (e) {
                    this.log.error(`sendEachForMulticast: ${e instanceof Error ? e.message : e}`);
                }
            }
        }
    };
    return PushNotificationService = _classThis;
})();
exports.PushNotificationService = PushNotificationService;
//# sourceMappingURL=push-notification.service.js.map