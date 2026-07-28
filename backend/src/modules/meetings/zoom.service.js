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
exports.ZoomService = void 0;
const common_1 = require("@nestjs/common");
let ZoomService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ZoomService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZoomService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        accountId = null;
        clientId = null;
        clientSecret = null;
        cachedToken = null;
        constructor(config) {
            this.config = config;
            this.accountId = this.config.get('ZOOM_ACCOUNT_ID') ?? null;
            this.clientId = this.config.get('ZOOM_CLIENT_ID') ?? null;
            this.clientSecret = this.config.get('ZOOM_CLIENT_SECRET') ?? null;
        }
        isConfigured() {
            return !!(this.accountId && this.clientId && this.clientSecret);
        }
        async getAccessToken() {
            if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
                return this.cachedToken.token;
            }
            if (!this.accountId || !this.clientId || !this.clientSecret)
                return null;
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(this.accountId)}`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (!res.ok)
                return null;
            const data = (await res.json());
            this.cachedToken = {
                token: data.access_token,
                expiresAt: Date.now() + (data.expires_in - 60) * 1000,
            };
            return this.cachedToken.token;
        }
        async createMeeting(options) {
            if (!this.isConfigured()) {
                return { error: 'Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.' };
            }
            const token = await this.getAccessToken();
            if (!token)
                return { error: 'Failed to obtain Zoom access token.' };
            const startDate = new Date(options.startISO);
            const duration = Math.max(15, Math.min(480, options.durationMinutes || 60));
            const body = {
                topic: options.topic,
                type: 2,
                start_time: startDate.toISOString(),
                duration: duration,
                timezone: options.timeZone,
                settings: {
                    join_before_host: true,
                    waiting_room: false,
                    approval_type: 2,
                    reminder: true,
                },
            };
            try {
                const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    const errText = await res.text();
                    return { error: `Zoom API error: ${res.status} ${errText}` };
                }
                const data = (await res.json());
                const link = data.join_url || '';
                if (!link)
                    return { error: 'Zoom did not return a join URL.' };
                return { link };
            }
            catch (err) {
                return { error: `Zoom error: ${err?.message || String(err)}` };
            }
        }
    };
    return ZoomService = _classThis;
})();
exports.ZoomService = ZoomService;
//# sourceMappingURL=zoom.service.js.map