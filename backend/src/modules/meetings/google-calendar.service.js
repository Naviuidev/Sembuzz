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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TOKEN_FILE = path.join(process.cwd(), '.google-refresh-token');
let GoogleCalendarService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GoogleCalendarService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GoogleCalendarService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        calendar = null;
        calendarId = null;
        constructor(config) {
            this.config = config;
            const clientId = this.config.get('GOOGLE_OAUTH_CLIENT_ID');
            const clientSecret = this.config.get('GOOGLE_OAUTH_CLIENT_SECRET');
            const redirectUri = this.config.get('GOOGLE_OAUTH_REDIRECT_URI');
            const refreshTokenFromEnv = this.config.get('GOOGLE_REFRESH_TOKEN');
            let refreshToken = refreshTokenFromEnv;
            if (!refreshToken && fs.existsSync(TOKEN_FILE)) {
                try {
                    refreshToken = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
                }
                catch {
                    refreshToken = undefined;
                }
            }
            if (clientId && clientSecret && refreshToken) {
                const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                this.calendarId = this.config.get('GOOGLE_CALENDAR_ID') || 'primary';
                this.calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                return;
            }
            const credentialsPath = this.config.get('GOOGLE_APPLICATION_CREDENTIALS');
            const credentialsJson = this.config.get('GOOGLE_SERVICE_ACCOUNT_JSON');
            this.calendarId = this.config.get('GOOGLE_CALENDAR_ID') ?? null;
            if (!this.calendarId)
                return;
            let credentials;
            if (credentialsJson) {
                try {
                    credentials = JSON.parse(credentialsJson);
                }
                catch {
                    credentials = undefined;
                }
            }
            if (!credentials && credentialsPath) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    credentials = require(credentialsPath);
                }
                catch {
                    credentials = undefined;
                }
            }
            if (!credentials)
                return;
            const auth = new googleapis_1.google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
            });
            this.calendar = googleapis_1.google.calendar({ version: 'v3', auth });
        }
        isConfigured() {
            return this.calendar !== null && this.calendarId !== null;
        }
        async createMeetEvent(options) {
            if (!this.calendar || !this.calendarId) {
                return {
                    error: 'Google Calendar is not configured. Either: (1) Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI and visit GET /google/auth to authorize, or (2) Set GOOGLE_CALENDAR_ID and GOOGLE_SERVICE_ACCOUNT_JSON.',
                };
            }
            try {
                const requestId = `sembuzz-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                const event = {
                    summary: options.title,
                    start: {
                        dateTime: options.startISO,
                        timeZone: options.ianaTimeZone,
                    },
                    end: {
                        dateTime: options.endISO,
                        timeZone: options.ianaTimeZone,
                    },
                    attendees: options.attendeeEmails.map((email) => ({ email })),
                    conferenceData: {
                        createRequest: {
                            requestId,
                        },
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 5 },
                            { method: 'popup', minutes: 5 },
                        ],
                    },
                };
                const res = await this.calendar.events.insert({
                    calendarId: this.calendarId,
                    requestBody: event,
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                });
                const link = res.data.hangoutLink ||
                    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
                    '';
                if (!link)
                    return { error: 'Google Meet link was not returned.' };
                return { link };
            }
            catch (err) {
                const message = err?.message || String(err);
                return { error: `Google Calendar error: ${message}` };
            }
        }
    };
    return GoogleCalendarService = _classThis;
})();
exports.GoogleCalendarService = GoogleCalendarService;
//# sourceMappingURL=google-calendar.service.js.map