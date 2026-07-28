"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
/**
 * Provider hook for Playwright + Cheerio pipeline (Phase 3).
 * Concrete implementations: generic, university, eventbrite, etc.
 */
class BaseScraper {
    normalizeWhitespace(s) {
        return s.replace(/\s+/g, ' ').trim();
    }
}
exports.BaseScraper = BaseScraper;
//# sourceMappingURL=base-scraper.abstract.js.map