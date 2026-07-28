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
exports.ScrapedHtmlLoaderService = void 0;
const common_1 = require("@nestjs/common");
const DEFAULT_UA = 'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
let ScrapedHtmlLoaderService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ScrapedHtmlLoaderService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScrapedHtmlLoaderService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        playwright;
        constructor(playwright) {
            this.playwright = playwright;
        }
        needsPlaywrightRetry(html) {
            return this.playwright?.shouldUseCalendarEnhancement?.(html) ?? false;
        }
        async load(url) {
            const { html } = await this.loadWithMeta(url);
            return html;
        }
        async loadWithMeta(url) {
            let html = await this.fetchUrl(url);
            const pw = this.playwright;
            const wantsPw = pw?.isEnabled?.() &&
                (pw.shouldAttemptEnhancement(html) || pw.shouldUseCalendarEnhancement(html));
            if (wantsPw && pw) {
                const rendered = await pw.renderHtml(url);
                if (rendered && this.renderedHtmlIsBetter(html, rendered)) {
                    return { html: rendered, usedPlaywright: true };
                }
            }
            return { html, usedPlaywright: false };
        }
        /** Avoid replacing a good static HTML page with an empty Playwright shell. */
        renderedHtmlIsBetter(original, rendered) {
            const countMarkers = (h) => {
                const m = h.match(/em-card_title|evnt-block|gtm-event-title/gi);
                return m?.length ?? 0;
            };
            const origMarkers = countMarkers(original);
            const rendMarkers = countMarkers(rendered);
            if (origMarkers > 0 && rendMarkers < origMarkers)
                return false;
            const textLen = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
            return rendMarkers > origMarkers || textLen(rendered) >= textLen(original) * 0.85;
        }
        async fetchUrl(url) {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': DEFAULT_UA,
                    Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(28_000),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status} when fetching ${url}`);
            return res.text();
        }
    };
    return ScrapedHtmlLoaderService = _classThis;
})();
exports.ScrapedHtmlLoaderService = ScrapedHtmlLoaderService;
//# sourceMappingURL=scraped-html-loader.service.js.map