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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.GoogleAuthController = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];
const TOKEN_FILE = path.join(process.cwd(), '.google-refresh-token');
function getCalendarAddRedirectUri(mainRedirectUri) {
    try {
        const u = new URL(mainRedirectUri);
        u.pathname = '/google/calendar/add-callback';
        return u.toString();
    }
    catch {
        return mainRedirectUri.replace(/\/[^/]*$/, '/google/calendar/add-callback');
    }
}
function getRedirectUriFromRequest(req) {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    if (!host)
        return '';
    return `${protocol}://${host}/google/calendar/add-callback`;
}
function encodeState(state) {
    return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}
function decodeState(stateStr) {
    try {
        const json = Buffer.from(stateStr, 'base64url').toString('utf8');
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
let GoogleAuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('google')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _auth_decorators;
    let _callback_decorators;
    let _calendarAddAuth_decorators;
    let _calendarAddCallback_decorators;
    var GoogleAuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _auth_decorators = [(0, common_1.Get)('auth')];
            _callback_decorators = [(0, common_1.Get)('callback')];
            _calendarAddAuth_decorators = [(0, common_1.Get)('calendar/add-auth')];
            _calendarAddCallback_decorators = [(0, common_1.Get)('calendar/add-callback')];
            __esDecorate(this, null, _auth_decorators, { kind: "method", name: "auth", static: false, private: false, access: { has: obj => "auth" in obj, get: obj => obj.auth }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _callback_decorators, { kind: "method", name: "callback", static: false, private: false, access: { has: obj => "callback" in obj, get: obj => obj.callback }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _calendarAddAuth_decorators, { kind: "method", name: "calendarAddAuth", static: false, private: false, access: { has: obj => "calendarAddAuth" in obj, get: obj => obj.calendarAddAuth }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _calendarAddCallback_decorators, { kind: "method", name: "calendarAddCallback", static: false, private: false, access: { has: obj => "calendarAddCallback" in obj, get: obj => obj.calendarAddCallback }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GoogleAuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config = __runInitializers(this, _instanceExtraInitializers);
        constructor(config) {
            this.config = config;
        }
        auth(res) {
            const clientId = this.config.get('GOOGLE_OAUTH_CLIENT_ID');
            const redirectUri = this.config.get('GOOGLE_OAUTH_REDIRECT_URI');
            if (!clientId || !redirectUri) {
                return res.status(500).send('<html><body><p>Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI in .env</p></body></html>');
            }
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, undefined, redirectUri);
            const url = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
                prompt: 'consent',
            });
            return res.redirect(url);
        }
        async callback(code, error, res) {
            if (error) {
                return res.status(400).send(`<html><body><p>Authorization failed: ${error}</p><p><a href="/google/auth">Try again</a></p></body></html>`);
            }
            const clientId = this.config.get('GOOGLE_OAUTH_CLIENT_ID');
            const clientSecret = this.config.get('GOOGLE_OAUTH_CLIENT_SECRET');
            const redirectUri = this.config.get('GOOGLE_OAUTH_REDIRECT_URI');
            if (!clientId || !clientSecret || !redirectUri) {
                return res.status(500).send('<html><body><p>Google OAuth is not fully configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI in .env</p></body></html>');
            }
            if (!code) {
                return res.status(400).send('<html><body><p>No authorization code received.</p><p><a href="/google/auth">Authorize again</a></p></body></html>');
            }
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
            try {
                const { tokens } = await oauth2Client.getToken(code);
                const refreshToken = tokens.refresh_token;
                if (refreshToken) {
                    fs.writeFileSync(TOKEN_FILE, refreshToken, 'utf8');
                }
                return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Calendar connected</title></head><body style="font-family:sans-serif;padding:2rem;max-width:500px;margin:0 auto;"><h1>Google Calendar connected</h1><p>Meeting scheduling (Google Meet) will use this account. You can close this page.</p>${refreshToken ? '<p>Refresh token saved.</p>' : '<p>No new refresh token (already authorized).</p>'}</body></html>`);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return res.status(500).send(`<html><body><p>Failed to exchange code: ${message}</p><p><a href="/google/auth">Try again</a></p></body></html>`);
            }
        }
        /**
         * User "Add to Google Calendar" flow: redirect to Google sign-in so the event is added to the account they choose.
         * Query: returnUrl, title, description (optional), start (ISO), end (ISO).
         */
        calendarAddAuth(returnUrl, title, start, end, description, req, res) {
            const host = req?.get('host') ?? '';
            const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
            const clientId = isLocalhost && this.config.get('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
                ? this.config.get('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
                : this.config.get('GOOGLE_OAUTH_CLIENT_ID');
            const mainRedirect = this.config.get('GOOGLE_OAUTH_REDIRECT_URI');
            let redirectUri = isLocalhost && req
                ? getRedirectUriFromRequest(req)
                : this.config.get('GOOGLE_CALENDAR_ADD_REDIRECT_URI') ||
                    (mainRedirect ? getCalendarAddRedirectUri(mainRedirect) : undefined);
            if (!redirectUri && req)
                redirectUri = getRedirectUriFromRequest(req);
            if (!clientId || !redirectUri) {
                return res.status(500).send('<html><body><p>Google Calendar add is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI (or GOOGLE_CALENDAR_ADD_REDIRECT_URI) in .env. For local dev, set GOOGLE_OAUTH_CLIENT_ID_LOCAL and GOOGLE_OAUTH_CLIENT_SECRET_LOCAL and add http://localhost:3000/google/calendar/add-callback to Google Cloud Console.</p></body></html>');
            }
            if (!returnUrl?.trim() || !title?.trim() || !start?.trim() || !end?.trim()) {
                return res.status(400).send('<html><body><p>Missing required parameters: returnUrl, title, start, end.</p></body></html>');
            }
            const state = encodeState({
                returnUrl: returnUrl.trim(),
                title: title.trim(),
                description: description?.trim() || undefined,
                start: start.trim(),
                end: end.trim(),
            });
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, undefined, redirectUri);
            const url = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
                prompt: 'consent',
                state,
            });
            return res.redirect(url);
        }
        /**
         * OAuth callback for "Add to Google Calendar": exchange code, insert event into user's calendar, redirect back to app.
         */
        async calendarAddCallback(code, stateStr, error, req, res) {
            if (error) {
                const returnUrl = stateStr ? (decodeState(stateStr)?.returnUrl || '/events') : '/events';
                return res.redirect(`${returnUrl}?googleCalError=${encodeURIComponent(error)}`);
            }
            const host = req?.get('host') ?? '';
            const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
            const clientId = isLocalhost && this.config.get('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
                ? this.config.get('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
                : this.config.get('GOOGLE_OAUTH_CLIENT_ID');
            const clientSecret = isLocalhost && this.config.get('GOOGLE_OAUTH_CLIENT_SECRET_LOCAL')
                ? this.config.get('GOOGLE_OAUTH_CLIENT_SECRET_LOCAL')
                : this.config.get('GOOGLE_OAUTH_CLIENT_SECRET');
            const mainRedirect = this.config.get('GOOGLE_OAUTH_REDIRECT_URI');
            let redirectUri = isLocalhost && req
                ? getRedirectUriFromRequest(req)
                : this.config.get('GOOGLE_CALENDAR_ADD_REDIRECT_URI') ||
                    (mainRedirect ? getCalendarAddRedirectUri(mainRedirect) : undefined);
            if (!redirectUri && req)
                redirectUri = getRedirectUriFromRequest(req);
            if (!clientId || !clientSecret || !redirectUri) {
                return res.status(500).send('<html><body><p>Google Calendar add is not fully configured.</p></body></html>');
            }
            if (!code?.trim() || !stateStr?.trim()) {
                return res.status(400).send('<html><body><p>Missing code or state.</p></body></html>');
            }
            const state = decodeState(stateStr);
            const returnUrl = state?.returnUrl || '/events';
            const appendParams = (url, params) => {
                const sep = url.includes('?') ? '&' : '?';
                const q = new URLSearchParams(params).toString();
                return `${url}${sep}${q}`;
            };
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
            try {
                const { tokens } = await oauth2Client.getToken(code);
                if (!tokens.access_token) {
                    return res.redirect(appendParams(returnUrl, { googleCalError: 'No access token' }));
                }
                oauth2Client.setCredentials({ access_token: tokens.access_token });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                const event = {
                    summary: state?.title || 'Event',
                    description: state?.description || undefined,
                    start: { dateTime: state?.start || '', timeZone: 'UTC' },
                    end: { dateTime: state?.end || '', timeZone: 'UTC' },
                    reminders: { useDefault: true },
                };
                await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: event,
                });
                return res.redirect(appendParams(returnUrl, { googleCalSuccess: '1' }));
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return res.redirect(appendParams(returnUrl, { googleCalError: message }));
            }
        }
    };
    return GoogleAuthController = _classThis;
})();
exports.GoogleAuthController = GoogleAuthController;
//# sourceMappingURL=google-auth.controller.js.map