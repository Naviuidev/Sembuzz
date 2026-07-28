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
exports.GenericSelectorScraper = void 0;
exports.buildDedupeKey = buildDedupeKey;
exports.buildSlug = buildSlug;
const cheerio = __importStar(require("cheerio"));
const crypto_1 = require("crypto");
const luxon_1 = require("luxon");
const base_scraper_abstract_1 = require("../base-scraper.abstract");
const parse_scraped_dates_util_1 = require("../parse-scraped-dates.util");
class GenericSelectorScraper extends base_scraper_abstract_1.BaseScraper {
    dateZone = 'America/New_York';
    setDateZone(zone) {
        this.dateZone = zone || 'America/New_York';
    }
    async loadRenderedHtml(url) {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(28_000),
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} when fetching ${url}`);
        return res.text();
    }
    extractEvents(html, selectors) {
        const $ = cheerio.load(html);
        const useGeneric = Boolean(selectors.listItemSelector?.trim()) && Boolean(selectors.titleSelector?.trim());
        if (selectors.preset === 'localist') {
            return { drafts: this.extractLocalist($), extractionMode: 'localist' };
        }
        if (selectors.preset === 'uwm') {
            return { drafts: this.extractUwm($), extractionMode: 'uwm' };
        }
        if (useGeneric) {
            const genericDrafts = this.extractWithListItems($, selectors);
            if (genericDrafts.length > 0) {
                return { drafts: genericDrafts, extractionMode: 'generic' };
            }
            return this.autoDetect($);
        }
        return this.autoDetect($);
    }
    /** Localist → UWM (WordPress) when selectors are empty. */
    autoDetect($) {
        if ($('.em-card_title').length > 0) {
            return { drafts: this.extractLocalist($), extractionMode: 'localist' };
        }
        if ($('.evnt-block').length > 0) {
            return { drafts: this.extractUwm($), extractionMode: 'uwm' };
        }
        const ld = this.extractJsonLd($);
        if (ld.length > 0) {
            return { drafts: ld, extractionMode: 'generic' };
        }
        return { drafts: [], extractionMode: 'none' };
    }
    extractWithListItems($, selectors) {
        const listSel = selectors.listItemSelector.trim();
        const titleSel = selectors.titleSelector.trim();
        const out = [];
        $(listSel).each((_, el) => {
            const root = $(el);
            const titleNode = root.find(titleSel).first();
            let title = this.normalizeWhitespace(titleNode.text());
            if (!title && titleSel) {
                title = this.normalizeWhitespace(root.find(titleSel).attr('title') || '');
            }
            if (!title)
                return;
            const description = selectors.descriptionSelector
                ? this.normalizeWhitespace(root.find(selectors.descriptionSelector).first().text()) || undefined
                : undefined;
            const dateText = selectors.dateSelector
                ? this.normalizeWhitespace(root.find(selectors.dateSelector).first().text())
                : '';
            const venue = selectors.locationSelector
                ? this.normalizeWhitespace(root.find(selectors.locationSelector).first().text()) || null
                : null;
            let sourceUrl = null;
            if (selectors.linkSelector) {
                const link = root.find(selectors.linkSelector).first().attr('href')?.trim();
                sourceUrl = link || null;
            }
            if (!sourceUrl) {
                const a = titleNode.is('a')
                    ? titleNode
                    : titleNode.find('a').first().length
                        ? titleNode.find('a').first()
                        : root.find('a').first();
                sourceUrl = a.attr('href')?.trim() || null;
            }
            const image = selectors.imageSelector
                ? root.find(selectors.imageSelector).first().attr('src')?.trim() || null
                : null;
            const { start, end } = (0, parse_scraped_dates_util_1.parseScrapedDateLine)(dateText, this.dateZone);
            out.push({
                title,
                description: description || null,
                image,
                startDate: start ? new Date(start) : null,
                endDate: end ? new Date(end) : null,
                venue,
                sourceUrl,
            });
        });
        return out;
    }
    /** Localist Community Event Platform – e.g. https://events.miamioh.edu/ */
    extractLocalist($) {
        const byKey = new Map();
        $('.em-card_text').each((_, el) => {
            const root = $(el);
            const titleA = root.find('.em-card_title a').first();
            const title = this.normalizeWhitespace(titleA.text());
            if (!title)
                return;
            const href = titleA.attr('href')?.trim() || null;
            const { dateStr, venue } = this.extractLocalistDateAndVenue($, root);
            const cardRoot = root.closest('.em-list_item, .em-card, li, article').first();
            const img = cardRoot.find('.em-card_image img, .img_featured').first().attr('src')?.trim() ||
                root.prevAll().find('img').first().attr('src')?.trim() ||
                null;
            const { start, end } = (0, parse_scraped_dates_util_1.parseScrapedDateLine)(dateStr, this.dateZone);
            const listingOccurrenceYmd = start
                ? luxon_1.DateTime.fromJSDate(new Date(start), { zone: this.dateZone }).toISODate()
                : null;
            const hasRecurringInstances = root.find('.recurringmessage').length > 0 || cardRoot.find('.recurringmessage').length > 0;
            const ld = this.findAdjacentLocalistJsonLd($, cardRoot.length ? cardRoot : root, href);
            const descRange = ld.description
                ? (0, parse_scraped_dates_util_1.parseDateRangeFromFreeText)(ld.description, this.dateZone)
                : { start: null, end: null };
            const programStart = descRange.start ?? (start ? new Date(start) : null);
            const programEnd = descRange.end ?? (end ? new Date(end) : null) ?? programStart;
            const draft = {
                title,
                description: ld.description ? ld.description.slice(0, 8000) : undefined,
                image: img,
                startDate: programStart,
                endDate: programEnd,
                venue: ld.venue ?? venue,
                sourceUrl: href,
                hasRecurringInstances,
                listingOccurrenceYmd,
            };
            const key = `${title}|${href ?? ''}`;
            const prev = byKey.get(key);
            if (!prev) {
                byKey.set(key, draft);
                return;
            }
            byKey.set(key, this.mergeLocalistDrafts(prev, draft));
        });
        return [...byKey.values()];
    }
    /**
     * Localist uses `p.em-text_icon` on featured cards and `p.em-card_event-text` on list rows
     * (e.g. https://events.miamioh.edu/).
     */
    extractLocalistDateAndVenue($, root) {
        let dateStr = '';
        let venue = null;
        const consumeParagraph = (pe) => {
            const hasMap = pe.find('.fa-map-marker-alt, .fa-map-marker, .fa-location-dot').length > 0;
            const hasCalendar = pe.find('.fa-calendar, .fa-calendar-alt, .fa-calendar-days').length > 0;
            const t = this.normalizeWhitespace(pe.text());
            if (!t)
                return;
            if (hasMap && !venue)
                venue = t;
            else if ((hasCalendar || !hasMap) && !dateStr)
                dateStr = t;
        };
        root.find('p.em-text_icon, p.em-card_event-text').each((__, p) => {
            consumeParagraph($(p));
        });
        return { dateStr, venue };
    }
    /** JSON-LD `<script>` often sits immediately before the `.em-card` on Localist listing pages. */
    findAdjacentLocalistJsonLd($, cardRoot, href) {
        if (!href)
            return { description: null, venue: null };
        const normHref = href.split('?')[0];
        const scripts = cardRoot.prevAll('script[type="application/ld+json"]').toArray();
        for (const el of scripts.slice(0, 3)) {
            const raw = $(el).html()?.trim();
            if (!raw)
                continue;
            try {
                const parsed = JSON.parse(raw);
                const nodes = Array.isArray(parsed) ? parsed : [parsed];
                for (const node of nodes) {
                    if (!node || typeof node !== 'object')
                        continue;
                    const ev = node;
                    if (ev['@type'] !== 'Event')
                        continue;
                    const url = typeof ev.url === 'string' ? ev.url.split('?')[0] : '';
                    if (url && url !== normHref)
                        continue;
                    const loc = ev.location;
                    return {
                        description: typeof ev.description === 'string' ? ev.description : null,
                        venue: loc?.name ?? null,
                    };
                }
            }
            catch {
                /* ignore */
            }
        }
        return { description: null, venue: null };
    }
    /** Prefer dated rows; fill image/venue from duplicates (carousel vs list markup). */
    mergeLocalistDrafts(a, b) {
        const pick = a.startDate && !b.startDate ? a : !a.startDate && b.startDate ? b : b.startDate ? b : a;
        const other = pick === a ? b : a;
        return {
            ...pick,
            image: pick.image || other.image,
            venue: pick.venue || other.venue,
            description: pick.description || other.description,
            endDate: pick.endDate || other.endDate,
            hasRecurringInstances: pick.hasRecurringInstances || other.hasRecurringInstances,
            occurrenceDatesInMonth: pick.occurrenceDatesInMonth?.length || other.occurrenceDatesInMonth?.length
                ? [...new Set([...(pick.occurrenceDatesInMonth ?? []), ...(other.occurrenceDatesInMonth ?? [])])].sort()
                : undefined,
        };
    }
    /** UWM / WordPress calendar – e.g. https://uwm.edu/events/ */
    extractUwm($) {
        const out = [];
        const seen = new Set();
        $('.evnt-block').each((_, el) => {
            const root = $(el);
            const titleA = root.find('a.gtm-event-title').first();
            const title = this.normalizeWhitespace(titleA.text());
            if (!title)
                return;
            let href = titleA.attr('href')?.trim() || null;
            if (href && href.startsWith('/')) {
                try {
                    href = new URL(href, 'https://uwm.edu').href;
                }
                catch {
                    /* keep relative */
                }
            }
            const dateText = this.normalizeWhitespace(root.find('li.evnt-date span').first().text());
            const timeText = this.normalizeWhitespace(root.find('li.evnt-time span').first().text());
            const combinedDate = [dateText, timeText].filter(Boolean).join(' ');
            const venue = this.normalizeWhitespace(root.find('li.evnt-loc span').first().text()) || null;
            const description = this.normalizeWhitespace(root.find('p.evnt-desc').first().text()) || undefined;
            const img = root.find('img').first().attr('src')?.trim() || null;
            const { start, end } = (0, parse_scraped_dates_util_1.parseScrapedDateLine)(combinedDate || dateText, this.dateZone);
            const key = `${title}|${href ?? ''}|${dateText}`;
            if (seen.has(key))
                return;
            seen.add(key);
            out.push({
                title,
                description: description || null,
                image: img,
                startDate: start ? new Date(start) : null,
                endDate: end ? new Date(end) : null,
                venue,
                sourceUrl: href,
            });
        });
        return out;
    }
    extractJsonLd($) {
        const out = [];
        const seen = new Set();
        $('script[type="application/ld+json"]').each((_, el) => {
            const raw = $(el).html()?.trim();
            if (!raw)
                return;
            let parsed;
            try {
                parsed = JSON.parse(raw);
            }
            catch {
                return;
            }
            const nodes = Array.isArray(parsed) ? parsed : [parsed];
            for (const node of nodes) {
                this.collectJsonLdEvents(node, out, seen);
            }
        });
        return out;
    }
    collectJsonLdEvents(node, out, seen) {
        if (!node || typeof node !== 'object')
            return;
        const o = node;
        const type = o['@type'];
        const types = Array.isArray(type) ? type : type ? [type] : [];
        if (types.some((t) => typeof t === 'string' && /Event$/i.test(t))) {
            const title = typeof o.name === 'string' ? o.name.trim() : '';
            if (title) {
                const start = typeof o.startDate === 'string' ? new Date(o.startDate) : null;
                const end = typeof o.endDate === 'string' ? new Date(o.endDate) : null;
                const url = typeof o.url === 'string' ? o.url : null;
                const key = `${title}|${url ?? ''}|${start?.toISOString() ?? ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push({
                        title,
                        startDate: start && !Number.isNaN(start.getTime()) ? start : null,
                        endDate: end && !Number.isNaN(end.getTime()) ? end : null,
                        sourceUrl: url,
                        venue: typeof o.location === 'object' && o.location && typeof o.location.name === 'string'
                            ? o.location.name
                            : null,
                    });
                }
            }
        }
        if (Array.isArray(o['@graph'])) {
            for (const child of o['@graph']) {
                this.collectJsonLdEvents(child, out, seen);
            }
        }
    }
}
exports.GenericSelectorScraper = GenericSelectorScraper;
function buildDedupeKey(sourceId, draft) {
    const payload = [
        sourceId,
        draft.sourceUrl ?? '',
        draft.title,
        draft.startDate?.toISOString() ?? '',
    ].join('|');
    return (0, crypto_1.createHash)('sha256').update(payload).digest('hex');
}
function buildSlug(draft, dedupeKey) {
    const base = draft.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 72);
    const safe = base || 'event';
    return `${safe}-${dedupeKey.slice(0, 12)}`.slice(0, 320);
}
//# sourceMappingURL=generic.scraper.js.map