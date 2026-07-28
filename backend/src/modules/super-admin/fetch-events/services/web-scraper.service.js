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
exports.WebScraperService = void 0;
const common_1 = require("@nestjs/common");
const USER_AGENT = 'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com/bot)';
const SCRAPE_TIMEOUT_MS = 25_000;
/** Cap download size to limit RAM (several regex passes allocate multiple large strings). */
const MAX_HTML_BYTES = 1_500_000; // 1.5 MB
/** Hard cap on string length inside `clean()` before heavy regex work. */
const MAX_HTML_CHARS_CLEAN = 1_200_000;
/** Pagination/category links usually live in header + footer; avoid scanning multi‑MB single lines. */
const MAX_HTML_CHARS_LINK_SCAN = 500_000;
const MAX_ANCHOR_SCAN_ITERATIONS = 4_000;
const DEFAULT_CRAWL_MAX_PAGES = 60;
const DEFAULT_CRAWL_DELAY_MS = 100;
const DEFAULT_MAX_DETAIL_PREFETCH = 40;
const DEFAULT_CRAWL_FETCH_PARALLEL = 4;
/**
 * Minimal-dependency HTML scraper. Uses Node `fetch`, strips noise via regex,
 * and produces a compact text representation suitable for GPT input.
 *
 * `crawlFromSeed` walks same-origin links (pagination, categories, archives)
 * up to UNIVERSITY_CRAWL_MAX_PAGES so listing URLs can be processed end-to-end.
 * Optional Playwright (UNIVERSITY_PLAYWRIGHT=1) re-fetches thin JS shells after the static pass.
 */
let WebScraperService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebScraperService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            WebScraperService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        playwright;
        eventCandidates;
        logger = new common_1.Logger(WebScraperService.name);
        crawlMaxPages;
        crawlDelayMs;
        maxDetailPrefetch;
        crawlFetchParallel;
        constructor(config, playwright, eventCandidates) {
            this.config = config;
            this.playwright = playwright;
            this.eventCandidates = eventCandidates;
            const max = Number(this.config.get('UNIVERSITY_CRAWL_MAX_PAGES'));
            this.crawlMaxPages = Number.isFinite(max) && max > 0 ? Math.min(max, 200) : DEFAULT_CRAWL_MAX_PAGES;
            const d = Number(this.config.get('UNIVERSITY_CRAWL_DELAY_MS'));
            this.crawlDelayMs = Number.isFinite(d) && d >= 0 ? Math.min(d, 5000) : DEFAULT_CRAWL_DELAY_MS;
            const md = Number(this.config.get('UNIVERSITY_CRAWL_MAX_DETAIL_PAGES'));
            this.maxDetailPrefetch =
                Number.isFinite(md) && md > 0 ? Math.min(md, 120) : DEFAULT_MAX_DETAIL_PREFETCH;
            const fp = Number(this.config.get('UNIVERSITY_CRAWL_FETCH_PARALLEL'));
            this.crawlFetchParallel =
                Number.isFinite(fp) && fp >= 1 ? Math.min(fp, 12) : DEFAULT_CRAWL_FETCH_PARALLEL;
        }
        async fetchAndClean(url) {
            const html = await this.fetchHtml(url);
            return this.clean(url, html);
        }
        /**
         * Breadth-first crawl starting at `seedUrl`, same hostname only.
         * Enqueues listing-like URLs (pagination query params, /events/, /calendar/, categories, rel=next).
         */
        async crawlFromSeed(seedUrl) {
            const seedNorm = this.normalizeUrl(seedUrl);
            if (!seedNorm)
                return [await this.fetchAndClean(seedUrl)];
            let seedParsed;
            try {
                seedParsed = new URL(seedNorm);
            }
            catch {
                return [await this.fetchAndClean(seedUrl)];
            }
            const visited = new Set();
            const queued = new Set();
            const queue = [];
            const pages = [];
            let detailPrefetchRemaining = this.maxDetailPrefetch;
            const enqueue = (raw) => {
                const n = this.normalizeUrl(raw);
                if (!n)
                    return;
                let u;
                try {
                    u = new URL(n);
                }
                catch {
                    return;
                }
                if (u.hostname !== seedParsed.hostname)
                    return;
                if (visited.has(n) || queued.has(n))
                    return;
                queued.add(n);
                queue.push(n);
            };
            enqueue(seedNorm);
            while (queue.length > 0 && pages.length < this.crawlMaxPages) {
                const batchNorms = [];
                while (queue.length > 0 &&
                    batchNorms.length < this.crawlFetchParallel &&
                    pages.length + batchNorms.length < this.crawlMaxPages) {
                    const url = queue.shift();
                    const norm = this.normalizeUrl(url);
                    if (!norm || visited.has(norm))
                        continue;
                    visited.add(norm);
                    queued.delete(norm);
                    batchNorms.push(norm);
                }
                if (batchNorms.length === 0)
                    break;
                const htmlResults = await Promise.all(batchNorms.map(async (norm) => {
                    try {
                        return { norm, html: await this.fetchHtml(norm) };
                    }
                    catch (e) {
                        this.logger.warn(`Crawl skip ${norm}: ${e.message}`);
                        return { norm, html: null };
                    }
                }));
                for (const { norm, html } of htmlResults) {
                    if (!html)
                        continue;
                    let page = this.clean(norm, html);
                    if (norm === seedNorm && this.isLiveWhaleCalendarHtml(html)) {
                        const fromJson = await this.tryBuildPageFromLiveWhaleJson(seedParsed.origin, norm);
                        if (fromJson) {
                            this.logger.log(`LiveWhale JSON feed for ${seedParsed.hostname}: ${fromJson.cleanedText.length} chars, ${fromJson.detailLinks.length} detail link(s)`);
                            page = fromJson;
                            queue.splice(0, queue.length);
                        }
                    }
                    pages.push(page);
                    for (const d of page.detailLinks) {
                        if (detailPrefetchRemaining <= 0)
                            break;
                        if (!this.isLikelyEventDetailUrl(d, seedParsed))
                            continue;
                        const dn = this.normalizeUrl(d);
                        if (!dn || dn === norm)
                            continue;
                        if (!visited.has(dn) && !queued.has(dn)) {
                            enqueue(dn);
                            detailPrefetchRemaining--;
                        }
                    }
                    for (const next of this.discoverCrawlTargets(norm, html, seedParsed)) {
                        enqueue(next);
                    }
                }
                if (this.crawlDelayMs > 0 && queue.length > 0 && pages.length < this.crawlMaxPages) {
                    await new Promise((r) => setTimeout(r, this.crawlDelayMs));
                }
            }
            this.logger.log(`Crawl finished for ${seedParsed.hostname}: ${pages.length} page(s), queue_left=${queue.length}`);
            return pages.length > 0 ? pages : [await this.fetchAndClean(seedUrl)];
        }
        /** LiveWhale /live/json/events payloads are loosely typed; we only read known fields. */
        isLiveWhaleEventRow(v) {
            return v !== null && typeof v === 'object' && typeof v.title === 'string';
        }
        stripHtmlToText(html) {
            return html
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        isLiveWhaleCalendarHtml(html) {
            if (!/LiveWhale/i.test(html))
                return false;
            if (/<meta[^>]+name\s*=\s*["']generator["'][^>]*content\s*=\s*["'][^"']*LiveWhale/i.test(html)) {
                return true;
            }
            if (/LiveWhale\s+Calendar/i.test(html))
                return true;
            if (/\/live\/resource\/js\/[^"']*livewhale/i.test(html.toLowerCase()))
                return true;
            return false;
        }
        /**
         * Fetch the standard LiveWhale upcoming-events JSON and turn it into listing text for GPT.
         * Same-origin path `/live/json/events` is used by many LiveWhale campus calendars.
         */
        async tryBuildPageFromLiveWhaleJson(origin, seedNorm) {
            const jsonUrl = new URL('/live/json/events', origin).toString();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
            let res;
            try {
                res = await fetch(jsonUrl, {
                    signal: controller.signal,
                    redirect: 'follow',
                    headers: {
                        'User-Agent': USER_AGENT,
                        Accept: 'application/json,text/plain,*/*',
                        Referer: seedNorm,
                    },
                });
            }
            catch {
                return null;
            }
            finally {
                clearTimeout(timer);
            }
            if (!res.ok) {
                this.logger.warn(`LiveWhale JSON ${jsonUrl}: HTTP ${res.status}`);
                return null;
            }
            const raw = await res.text();
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch {
                return null;
            }
            if (!Array.isArray(data) || data.length === 0)
                return null;
            if (!this.isLiveWhaleEventRow(data[0]))
                return null;
            const detailLinks = [];
            const candidateImages = [];
            const lines = [
                '=== EVENTS FROM LIVEWHALE JSON FEED (same calendar site) ===',
                'Each block is one public listing. Use ISO dates when present.',
            ];
            for (let i = 0; i < data.length; i++) {
                const ev = data[i];
                const title = typeof ev.title === 'string' ? ev.title.trim() : '';
                if (!title)
                    continue;
                const url = typeof ev.url === 'string' ? ev.url.trim() : '';
                if (url)
                    detailLinks.push(url);
                const thumb = typeof ev.thumbnail === 'string' ? ev.thumbnail.trim() : '';
                if (thumb)
                    candidateImages.push(thumb);
                const dateIso = typeof ev.date_iso === 'string' ? ev.date_iso.trim() : '';
                const dateUtc = typeof ev.date_utc === 'string' ? ev.date_utc.trim() : '';
                const date2Iso = typeof ev.date2_iso === 'string' ? ev.date2_iso.trim() : '';
                const dateLabel = typeof ev.date === 'string' ? ev.date.trim() : '';
                const timeLabel = typeof ev.date_time === 'string' ? ev.date_time.trim() : '';
                const loc = typeof ev.location === 'string' ? ev.location.trim() : '';
                const desc = typeof ev.description === 'string' ? this.stripHtmlToText(ev.description) : '';
                const contact = typeof ev.contact_info === 'string' ? this.stripHtmlToText(ev.contact_info) : '';
                const types = Array.isArray(ev.event_types)
                    ? ev.event_types.filter((t) => typeof t === 'string').join(', ')
                    : '';
                const tags = Array.isArray(ev.tags)
                    ? ev.tags.filter((t) => typeof t === 'string').join(', ')
                    : '';
                lines.push('');
                lines.push(`--- Event ${i + 1} ---`);
                lines.push(`Title: ${title}`);
                if (dateIso)
                    lines.push(`Start (ISO): ${dateIso}`);
                if (date2Iso)
                    lines.push(`End (ISO): ${date2Iso}`);
                if (dateUtc && !dateIso)
                    lines.push(`Start (UTC field): ${dateUtc}`);
                if (dateLabel)
                    lines.push(`Date (label): ${dateLabel}`);
                if (timeLabel)
                    lines.push(`Time (label): ${timeLabel}`);
                if (loc)
                    lines.push(`Location: ${loc}`);
                if (url)
                    lines.push(`Detail URL: ${url}`);
                if (desc)
                    lines.push(`Description: ${desc}`);
                if (contact)
                    lines.push(`Contact: ${contact}`);
                if (types)
                    lines.push(`Categories: ${types}`);
                if (tags)
                    lines.push(`Tags: ${tags}`);
            }
            const cleanedText = lines.join('\n');
            if (cleanedText.length < 400)
                return null;
            return {
                url: seedNorm,
                cleanedText,
                candidateImages: [...new Set(candidateImages)].slice(0, 40),
                detailLinks: [...new Set(detailLinks)].slice(0, 40),
                htmlLength: cleanedText.length,
            };
        }
        async fetchHtmlStatic(url) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
            try {
                const res = await fetch(url, {
                    signal: controller.signal,
                    redirect: 'follow',
                    headers: {
                        'User-Agent': USER_AGENT,
                        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} when fetching ${url}`);
                }
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('html') && !contentType.includes('text')) {
                    throw new Error(`Unsupported content-type "${contentType}" at ${url}`);
                }
                const ab = await res.arrayBuffer();
                if (ab.byteLength > MAX_HTML_BYTES) {
                    this.logger.warn(`Truncating large page ${url} (${ab.byteLength} bytes)`);
                }
                const buf = Buffer.from(ab).subarray(0, MAX_HTML_BYTES);
                return buf.toString('utf-8');
            }
            finally {
                clearTimeout(timer);
            }
        }
        /** Static fetch first; optional Playwright pass when the response looks like a JS shell. */
        async fetchHtml(url) {
            let html = await this.fetchHtmlStatic(url);
            if (this.playwright.shouldAttemptEnhancement(html)) {
                const rendered = await this.playwright.renderHtml(url);
                if (rendered) {
                    const plain = rendered.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
                    const plainWas = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
                    if (rendered.length > html.length * 1.08 || plain.length > plainWas.length * 1.35) {
                        this.logger.log(`Playwright enhanced ${url} (${plainWas.length} → ${plain.length} text chars)`);
                        html = rendered;
                    }
                }
            }
            return html;
        }
        /** Follow individual event pages discovered on listings (slug URLs, ?event=, etc.). */
        isLikelyEventDetailUrl(abs, seed) {
            let u;
            try {
                u = new URL(abs);
            }
            catch {
                return false;
            }
            if (u.hostname !== seed.hostname)
                return false;
            const path = u.pathname.toLowerCase();
            const q = u.search.toLowerCase();
            if (/\.(pdf|zip|docx?|xlsx?|pptx?|png|jpe?g|gif|webp|svg|css|js|mjs)(\?|$)/i.test(path)) {
                return false;
            }
            if (/[?&](event_id|eventid|eid|evt)=/i.test(q))
                return true;
            if (/[?&]event=\d+/i.test(q))
                return true;
            if (/(^|\/)(event|events)\/[^/]{4,}\/?$/i.test(path))
                return true;
            if (/(^|\/)(event|events)\/[^/]+\/[^/]{3,}\/?$/i.test(path))
                return true;
            if (/\/(workshop|seminar|symposium|lecture|colloquium)\/[^/]{4,}\/?$/i.test(path))
                return true;
            return false;
        }
        /**
         * Strip noise, preserve helpful structural hints (headings, links, images, dates).
         */
        clean(baseUrl, html) {
            let working = html.length > MAX_HTML_CHARS_CLEAN ? html.slice(0, MAX_HTML_CHARS_CLEAN) : html;
            const htmlLength = working.length;
            // 1. Drop wholesale: <script>, <style>, <noscript>, <svg>, comments
            let cleaned = working
                .replace(/<!--[\s\S]*?-->/g, ' ')
                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
                .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
                .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ');
            // 2. Try to find the main content section.
            cleaned = this.extractMainSection(cleaned);
            const eventCandidates = this.eventCandidates.extractFromHtml(baseUrl, cleaned);
            // 3. Collect images + detail links BEFORE we strip tags.
            const candidateImages = this.extractImageUrls(cleaned, baseUrl);
            const detailLinks = this.extractDetailLinks(cleaned, baseUrl);
            // 4. Convert structural tags to newlines / markers so GPT sees structure.
            let textish = cleaned
                .replace(/<\/(p|div|section|article|li|tr|h[1-6]|br|figure|figcaption)>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<(h[1-6])[^>]*>/gi, '\n## ')
                .replace(/<li[^>]*>/gi, '\n- ')
                .replace(/<a [^>]*href="([^"]+)"[^>]*>/gi, ' [$1] ')
                .replace(/<img [^>]*alt="([^"]+)"[^>]*>/gi, ' (image: $1) ')
                .replace(/<img [^>]*src="([^"]+)"[^>]*>/gi, ' (image-src: $1) ');
            // 5. Remove every remaining tag.
            textish = textish.replace(/<\/?[a-z][^>]*>/gi, ' ');
            // 6. Decode common HTML entities.
            textish = this.decodeEntities(textish);
            // 7. Collapse whitespace.
            textish = textish
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/^\s+|\s+$/g, '');
            return {
                url: baseUrl,
                cleanedText: textish,
                candidateImages,
                detailLinks,
                htmlLength,
                eventCandidates,
            };
        }
        extractMainSection(html) {
            const cap = (s, max) => (s.length > max ? s.slice(0, max) : s);
            // Prefer <main>, <article>, or any region with "event" in id/class.
            const candidates = [
                /<main\b[\s\S]*?<\/main>/i,
                /<article\b[\s\S]*?<\/article>/i,
                /<section[^>]*(?:id|class)\s*=\s*["'][^"']*event[^"']*["'][\s\S]*?<\/section>/i,
                /<div[^>]*(?:id|class)\s*=\s*["'][^"']*event[^"']*["'][\s\S]*?<\/div>/i,
                /<div[^>]*(?:id|class)\s*=\s*["'][^"']*calendar[^"']*["'][\s\S]*?<\/div>/i,
            ];
            for (const re of candidates) {
                const m = html.match(re);
                if (m && m[0].length > 600)
                    return cap(m[0], 600_000);
            }
            // Fall back to stripping obvious noise sections.
            return html
                .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
                .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
                .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
                .replace(/<aside\b[\s\S]*?<\/aside>/gi, ' ');
        }
        extractImageUrls(html, baseUrl) {
            const out = new Set();
            const re = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
            let m;
            let iterations = 0;
            while ((m = re.exec(html))) {
                if (++iterations > 8000)
                    break;
                const abs = this.toAbsolute(m[1], baseUrl);
                if (abs && this.looksLikeContentImage(abs))
                    out.add(abs);
                if (out.size >= 40)
                    break;
            }
            return Array.from(out);
        }
        extractDetailLinks(html, baseUrl) {
            const out = new Set();
            const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            let m;
            let iterations = 0;
            while ((m = re.exec(html))) {
                if (++iterations > MAX_ANCHOR_SCAN_ITERATIONS)
                    break;
                const href = m[1];
                if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:'))
                    continue;
                const txt = m[2].replace(/<[^>]+>/g, '').toLowerCase();
                const linkLower = href.toLowerCase();
                const looksRelevant = linkLower.includes('event') ||
                    linkLower.includes('calendar') ||
                    linkLower.includes('happening') ||
                    txt.includes('event') ||
                    txt.includes('register') ||
                    txt.includes('read more') ||
                    txt.includes('details');
                if (!looksRelevant)
                    continue;
                const abs = this.toAbsolute(href, baseUrl);
                if (abs)
                    out.add(abs);
                if (out.size >= 40)
                    break;
            }
            return Array.from(out);
        }
        toAbsolute(href, baseUrl) {
            try {
                return new URL(href, baseUrl).toString();
            }
            catch {
                return null;
            }
        }
        looksLikeContentImage(src) {
            const lower = src.toLowerCase();
            if (lower.endsWith('.svg'))
                return false;
            if (lower.includes('icon') || lower.includes('logo') || lower.includes('avatar'))
                return false;
            if (lower.includes('sprite') || lower.includes('placeholder'))
                return false;
            return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower) || lower.includes('cdn') || lower.includes('uploads');
        }
        decodeEntities(s) {
            return s
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
                .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
        }
        /** Stable URL for de-duplication (no hash, sorted query, trimmed trailing slash on path). */
        normalizeUrl(href) {
            try {
                const u = new URL(href);
                u.hash = '';
                const sp = new URLSearchParams(u.search);
                const keys = [...new Set([...sp.keys()])].sort();
                const out = new URL(`${u.origin}${u.pathname}`);
                for (const k of keys) {
                    for (const v of sp.getAll(k)) {
                        out.searchParams.append(k, v);
                    }
                }
                if (out.pathname.length > 1 && out.pathname.endsWith('/')) {
                    out.pathname = out.pathname.slice(0, -1);
                }
                return out.toString();
            }
            catch {
                return null;
            }
        }
        /**
         * Pagination and category nav are almost always in the first/last parts of the document.
         * Scanning a trimmed slice avoids pathological RAM/CPU on very large HTML files.
         */
        htmlSliceForLinkScan(html) {
            if (html.length <= MAX_HTML_CHARS_LINK_SCAN)
                return html;
            const head = Math.floor(MAX_HTML_CHARS_LINK_SCAN * 0.72);
            const tail = MAX_HTML_CHARS_LINK_SCAN - head;
            return html.slice(0, head) + html.slice(-tail);
        }
        /**
         * Extract same-origin URLs worth following for event listings: pagination,
         * category hubs, calendar views, archives, and `<link rel="next">`.
         */
        discoverCrawlTargets(currentUrl, html, seed) {
            const scan = this.htmlSliceForLinkScan(html);
            const out = new Set();
            const current = new URL(currentUrl);
            const relNext = scan.match(/<link[^>]*\brel\s*=\s*["'][^"']*next[^"']*["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i) ||
                scan.match(/<link[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*\brel\s*=\s*["'][^"']*next[^"']*["']/i);
            if (relNext?.[1]) {
                const abs = this.toAbsolute(relNext[1], currentUrl);
                if (abs && this.crawlLinkScore(seed, current, new URL(abs)) >= 8)
                    out.add(abs);
            }
            const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            let m;
            let iterations = 0;
            while ((m = re.exec(scan))) {
                if (++iterations > MAX_ANCHOR_SCAN_ITERATIONS)
                    break;
                const href = m[1]?.trim();
                if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:'))
                    continue;
                const abs = this.toAbsolute(href, currentUrl);
                if (!abs)
                    continue;
                let linkUrl;
                try {
                    linkUrl = new URL(abs);
                }
                catch {
                    continue;
                }
                if (linkUrl.hostname !== seed.hostname)
                    continue;
                const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                let navBoost = /\b(next|older|more|›|»|→|previous|prev)\b/i.test(inner) ? 28 : 0;
                if (/\b(load\s*more|show\s*more|view\s*more)\b/i.test(inner))
                    navBoost += 32;
                const score = this.crawlLinkScore(seed, current, linkUrl) + navBoost;
                if (score >= 10)
                    out.add(abs);
                if (out.size >= 400)
                    break;
            }
            return [...out];
        }
        crawlLinkScore(seed, current, link) {
            const path = link.pathname.toLowerCase();
            const search = link.search.toLowerCase();
            const full = `${path} ${search}`;
            if (/\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|png|jpe?g|gif|svg|webp|ico|css|js|mjs|map|woff2?|ttf|eot|mp4|webm|mp3)(\?|$)/i.test(link.pathname)) {
                return -999;
            }
            if (/mailto:|tel:/i.test(link.href))
                return -999;
            if (/(^|\/)(login|logout|signin|sign-in|signup|sign-up|register|account|password|reset|subscribe|unsubscribe|checkout|cart)(\/|$|\?)/i.test(full)) {
                return -80;
            }
            if (/privacy|terms|cookie|accessibility|sitemap|facebook\.com|twitter\.com|t\.co|instagram\.com|linkedin\.com|youtube\.com/i.test(full)) {
                return -80;
            }
            let s = 0;
            // Pagination / listing offsets (works for ?page=2, ?paged=2, Drupal offset, etc.)
            if (/[?&](page|paged|pg|pn|pag|page_no|page_number|offset|start|from|cursor|skip|per_page|limit)=/i.test(search)) {
                s += 45;
            }
            if (/[?&]page=\d+/i.test(search))
                s += 15;
            // Path-based paging: /events/page/2/, /listing/pg/3
            if (/(^|\/)(page|pg|pages)\/\d{1,4}(\/|$|\?)/i.test(path))
                s += 44;
            // Calendar / archive shapes
            if (/\/\d{4}(-|\/)\d{2}(-|\/)\d{0,2}\b/.test(path))
                s += 22;
            if (/[?&](month|year|m|mo|cal|view|mode|w|week|day)=/i.test(search))
                s += 22;
            if (/ical|\.ics(\?|$)/i.test(full))
                s -= 50;
            // Obvious event-listing paths
            if (/events?|calendar|agenda|schedule|listing|programs?|what'?s-?on|upcoming|today|seminar|symposium|colloquium|workshop/i.test(full)) {
                s += 32;
            }
            if (/category|categories|topics?|types?|tags?\/|\/tag\//i.test(full))
                s += 22;
            // Same path as current page but different filters (faceted nav)
            if (link.pathname === current.pathname && search.length > 1 && search !== current.search.toLowerCase()) {
                s += 16;
            }
            // Stay near the seed path prefix when the seed is not site root
            const seedPath = seed.pathname.replace(/\/+$/, '') || '/';
            if (seedPath !== '/' && seedPath !== '') {
                if (path === seedPath || path.startsWith(`${seedPath}/`))
                    s += 18;
            }
            // Site-root seeds: still prefer obvious listing sections
            if ((seedPath === '/' || seedPath === '') && /events?|calendar|agenda|schedule/i.test(full)) {
                s += 24;
            }
            s += this.nonEventPathPenalty(path, search);
            return s;
        }
        /**
         * Down-rank admissions, blogs, news, etc. unless the URL still looks like an event/calendar hub.
         */
        nonEventPathPenalty(path, search) {
            const full = `${path} ${search}`;
            if (/events?|calendar|agenda|schedule|symposium|seminar|workshop|colloquium|happening|register|rsvp/i.test(full)) {
                return 0;
            }
            if (/(^|\/)(admissions?|financial-aid|tuition|apply|application)(?:\/|$)/i.test(path))
                return -140;
            if (/(^|\/)(blogs?|faculty|staff\/|people\/|directory|careers|jobs|giving|donate|alumni|magazine|press-office|press\/)(?:\/|$)/i.test(path)) {
                return -140;
            }
            if (/\/news(\/|$)/i.test(path))
                return -110;
            if (/(^|\/)(policy|policies|legal|veterans|disability-services)(?:\/|$)/i.test(path))
                return -120;
            return 0;
        }
    };
    return WebScraperService = _classThis;
})();
exports.WebScraperService = WebScraperService;
//# sourceMappingURL=web-scraper.service.js.map