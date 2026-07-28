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
exports.PlaywrightRendererService = void 0;
const common_1 = require("@nestjs/common");
async function delay(ms) {
    await new Promise((r) => setTimeout(r, ms));
}
/**
 * Optional headless Chromium render for JS-heavy calendars and SPAs.
 * Enable with UNIVERSITY_PLAYWRIGHT=1 and install browsers: npx playwright install chromium
 */
let PlaywrightRendererService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PlaywrightRendererService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PlaywrightRendererService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        logger = new common_1.Logger(PlaywrightRendererService.name);
        browser = null;
        browserLaunchFailed = false;
        enabled;
        timeoutMs;
        scrollRounds;
        constructor(config) {
            this.config = config;
            this.enabled =
                this.config.get('UNIVERSITY_PLAYWRIGHT') === '1' ||
                    this.config.get('UNIVERSITY_PLAYWRIGHT') === 'true';
            const t = Number(this.config.get('UNIVERSITY_PLAYWRIGHT_TIMEOUT_MS'));
            this.timeoutMs = Number.isFinite(t) && t >= 5000 ? Math.min(t, 90_000) : 28_000;
            const sr = Number(this.config.get('UNIVERSITY_PLAYWRIGHT_SCROLL_ROUNDS'));
            this.scrollRounds = Number.isFinite(sr) && sr >= 0 ? Math.min(sr, 12) : 3;
        }
        isEnabled() {
            return this.enabled;
        }
        /**
         * True when HTML looks like an empty shell or has very little text (common for client-rendered apps).
         */
        shouldAttemptEnhancement(html) {
            if (!this.enabled || this.browserLaunchFailed)
                return false;
            const stripped = html
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ');
            const text = stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const htmlLen = html.length;
            // Many calendar SPAs ship a large HTML shell with almost no visible text until JS runs.
            if (text.length < 1400)
                return true;
            if (htmlLen > 25_000 && text.length < 3500 && text.length * 45 < htmlLen)
                return true;
            if (/id=["']root["']|id=["']app["']|id=["']__next["']/i.test(html) &&
                text.length < 2500) {
                return true;
            }
            return false;
        }
        async renderHtml(url) {
            if (!this.enabled || this.browserLaunchFailed)
                return null;
            let browser = this.browser;
            if (!browser) {
                try {
                    const { chromium } = await import('playwright');
                    browser = await chromium.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    });
                    this.browser = browser;
                    this.logger.log('Playwright Chromium launched for university crawls');
                }
                catch (e) {
                    this.browserLaunchFailed = true;
                    this.logger.warn(`Playwright unavailable (${e.message}). Install with: npx playwright install chromium`);
                    return null;
                }
            }
            const page = await browser.newPage({
                userAgent: 'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com/bot) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            });
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs });
                try {
                    await page.waitForLoadState('networkidle', { timeout: Math.min(12_000, this.timeoutMs) });
                }
                catch {
                    // non-fatal — many sites never reach true idle
                }
                for (let i = 0; i < this.scrollRounds; i++) {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await delay(380);
                }
                await this.clickLoadMoreButtons(page);
                return await page.content();
            }
            catch (e) {
                this.logger.warn(`Playwright render failed for ${url}: ${e.message}`);
                return null;
            }
            finally {
                await page.close().catch(() => null);
            }
        }
        /** Click "Load more" / pagination controls on calendar listing pages. */
        async clickLoadMoreButtons(page) {
            const maxClicks = 8;
            for (let i = 0; i < maxClicks; i++) {
                const btn = page
                    .locator('button, a[role="button"], .load-more, .load-more-events, [class*="load-more"]')
                    .filter({ hasText: /load more|show more|view more|see more/i })
                    .first();
                try {
                    if (!(await btn.isVisible({ timeout: 600 })))
                        break;
                    await btn.click({ timeout: 3000 });
                    await delay(900);
                }
                catch {
                    break;
                }
            }
        }
        /**
         * True when static HTML suggests JS pagination (Load more, empty event list shell, etc.).
         */
        shouldUseCalendarEnhancement(html) {
            if (this.shouldAttemptEnhancement(html))
                return true;
            if (/load more|loading events|show all events/i.test(html))
                return true;
            if (/evnt-block/i.test(html) && (html.match(/evnt-block/gi)?.length ?? 0) < 3)
                return true;
            return false;
        }
        async onModuleDestroy() {
            if (this.browser) {
                await this.browser.close().catch(() => null);
                this.browser = null;
            }
        }
    };
    return PlaywrightRendererService = _classThis;
})();
exports.PlaywrightRendererService = PlaywrightRendererService;
//# sourceMappingURL=playwright-renderer.service.js.map