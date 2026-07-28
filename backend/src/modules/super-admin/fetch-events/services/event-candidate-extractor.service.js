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
exports.EventCandidateExtractorService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const cheerio_1 = require("cheerio");
const MAX_BLOCK_TEXT = 1_200;
const MAX_CANDIDATES_PER_PAGE = 90;
function sha12(parts) {
    return (0, crypto_1.createHash)('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
}
function toAbsolute(href, baseUrl) {
    try {
        return new URL(href.trim(), baseUrl).toString();
    }
    catch {
        return null;
    }
}
function sameSiteHost(pageHost, linkHost) {
    const a = pageHost.replace(/^www\./i, '').toLowerCase();
    const b = linkHost.replace(/^www\./i, '').toLowerCase();
    return a === b || b.endsWith(`.${a}`);
}
function looksLikeContentImage(src) {
    const lower = src.toLowerCase();
    if (lower.endsWith('.svg'))
        return false;
    if (/icon|logo|avatar|sprite|placeholder|spacer|1x1|pixel|badge|button/i.test(lower))
        return false;
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower) || /\/uploads\/|\/media\/|\/images\/|cdn/i.test(lower);
}
function stripWs(s) {
    return s.replace(/\s+/g, ' ').trim();
}
function collectBlockText($, root) {
    const el = $(root);
    const bits = [];
    el.find('h2, h3, h4, h5, p, li, span, time').each((_, n) => {
        const t = stripWs($(n).text());
        if (t.length > 2 && t.length < 400)
            bits.push(t);
    });
    if (bits.length === 0)
        bits.push(stripWs(el.text()));
    let out = bits.slice(0, 24).join('\n');
    if (out.length > MAX_BLOCK_TEXT)
        out = `${out.slice(0, MAX_BLOCK_TEXT)}…`;
    return out;
}
function pickTitle($, root) {
    const el = $(root);
    const h = el.find('h2, h3, h4, h5').first().text().trim();
    if (h.length >= 4)
        return h.slice(0, 500);
    const a = el.find('a[href]').first().text().trim();
    if (a.length >= 4)
        return a.slice(0, 500);
    const t = stripWs(el.text());
    return t.slice(0, 500) || 'Untitled event';
}
function pickDetailUrl($, root, baseUrl, pageHost) {
    const el = $(root);
    let best = '';
    let bestScore = -1;
    el.find('a[href]').each((_, n) => {
        const href = $(n).attr('href');
        if (!href || href.startsWith('#'))
            return;
        const abs = toAbsolute(href, baseUrl);
        if (!abs)
            return;
        let host;
        try {
            host = new URL(abs).hostname;
        }
        catch {
            return;
        }
        if (!sameSiteHost(pageHost, host))
            return;
        const path = new URL(abs).pathname.toLowerCase();
        if (/\.(pdf|zip|docx?|pptx?)(\?|$)/i.test(path))
            return;
        const txt = stripWs($(n).text()).toLowerCase();
        const score = (path.includes('event') ? 5 : 0) +
            (path.includes('calendar') ? 3 : 0) +
            (txt.includes('detail') || txt.includes('more') || txt.includes('register') || txt.includes('read') ? 2 : 0) +
            Math.min(4, Math.floor(path.length / 20));
        if (score > bestScore) {
            bestScore = score;
            best = abs;
        }
    });
    if (!best) {
        el.find('a[href]').each((_, n) => {
            const href = $(n).attr('href');
            if (!href || href.startsWith('#'))
                return;
            const abs = toAbsolute(href, baseUrl);
            if (!abs)
                return;
            try {
                const host = new URL(abs).hostname;
                if (!sameSiteHost(pageHost, host))
                    return;
                if (new URL(abs).pathname.length > 10)
                    best = abs;
            }
            catch {
                /* skip */
            }
        });
    }
    return best || undefined;
}
function pickImageUrl($, root, baseUrl, pageHost) {
    const el = $(root);
    let out;
    el.find('img[src]').each((_, n) => {
        if (out)
            return;
        const src = $(n).attr('src');
        if (!src)
            return;
        const abs = toAbsolute(src, baseUrl);
        if (!abs || !looksLikeContentImage(abs))
            return;
        try {
            if (sameSiteHost(pageHost, new URL(abs).hostname))
                out = abs;
        }
        catch {
            /* skip */
        }
    });
    return out;
}
function walkJsonLdNodes(node, visit) {
    if (!node || typeof node !== 'object')
        return;
    if (Array.isArray(node)) {
        for (const x of node)
            walkJsonLdNodes(x, visit);
        return;
    }
    const o = node;
    visit(o);
    if (Array.isArray(o['@graph']))
        walkJsonLdNodes(o['@graph'], visit);
}
function typeMatchesEvent(t) {
    if (typeof t !== 'string')
        return false;
    const s = t.toLowerCase();
    return s === 'event' || s === 'educationevent' || s === 'socialevent' || s === 'festival' || s.includes('event');
}
let EventCandidateExtractorService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EventCandidateExtractorService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EventCandidateExtractorService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * Deterministic extraction: JSON-LD Event, <time datetime>, and article-like blocks.
         * Does not call GPT — output is fed to the validator model in small batches.
         */
        extractFromHtml(pageUrl, html) {
            if (!html || html.length < 80)
                return [];
            let pageHost;
            try {
                pageHost = new URL(pageUrl).hostname;
            }
            catch {
                return [];
            }
            const out = [];
            try {
                const $ = (0, cheerio_1.load)(html);
                this.collectJsonLd($, pageUrl, pageHost, out);
                this.collectTimeAnchored($, pageUrl, pageHost, out);
                this.collectArticles($, pageUrl, pageHost, out);
            }
            catch {
                return dedupeCandidates(out).slice(0, MAX_CANDIDATES_PER_PAGE);
            }
            return dedupeCandidates(out).slice(0, MAX_CANDIDATES_PER_PAGE);
        }
        collectJsonLd($, pageUrl, pageHost, out) {
            $('script[type="application/ld+json"]').each((_, el) => {
                const raw = $(el).contents().text();
                if (!raw?.trim())
                    return;
                let data;
                try {
                    data = JSON.parse(raw);
                }
                catch {
                    return;
                }
                walkJsonLdNodes(data, (o) => {
                    const types = o['@type'];
                    const tList = Array.isArray(types) ? types : [types];
                    const isEvent = tList.some((x) => typeMatchesEvent(x));
                    if (!isEvent)
                        return;
                    const name = typeof o.name === 'string' ? o.name.trim() : '';
                    if (name.length < 3)
                        return;
                    const start = (typeof o.startDate === 'string' && o.startDate) ||
                        (typeof o.startTime === 'string' && o.startTime) ||
                        '';
                    const end = (typeof o.endDate === 'string' && o.endDate) ||
                        (typeof o.endTime === 'string' && o.endTime) ||
                        '';
                    let detailUrl;
                    if (typeof o.url === 'string')
                        detailUrl = toAbsolute(o.url, pageUrl) ?? undefined;
                    let imageUrl;
                    const img = o.image;
                    if (typeof img === 'string')
                        imageUrl = toAbsolute(img, pageUrl) ?? undefined;
                    else if (img && typeof img === 'object' && !Array.isArray(img) && typeof img.url === 'string') {
                        imageUrl = toAbsolute(img.url, pageUrl) ?? undefined;
                    }
                    else if (Array.isArray(img) && typeof img[0] === 'string') {
                        imageUrl = toAbsolute(img[0], pageUrl) ?? undefined;
                    }
                    if (imageUrl) {
                        try {
                            const u = new URL(imageUrl);
                            if (u.protocol !== 'https:' && u.protocol !== 'http:')
                                imageUrl = undefined;
                        }
                        catch {
                            imageUrl = undefined;
                        }
                    }
                    const desc = typeof o.description === 'string' ? stripWs(o.description).slice(0, 600) : '';
                    const loc = o.location;
                    let venue = '';
                    if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
                        const n = loc.name;
                        if (typeof n === 'string')
                            venue = n;
                    }
                    const rawBlock = [name, start && `Start: ${start}`, end && `End: ${end}`, venue && `Place: ${venue}`, desc]
                        .filter(Boolean)
                        .join('\n');
                    const id = sha12([name, start, detailUrl || '', pageUrl]);
                    out.push({
                        id,
                        sourcePageUrl: pageUrl,
                        title: name.slice(0, 500),
                        rawBlockText: rawBlock.slice(0, MAX_BLOCK_TEXT),
                        rawDateText: start ? start.slice(0, 120) : undefined,
                        rawTimeText: undefined,
                        detailUrl,
                        imageUrl,
                    });
                });
            });
        }
        collectTimeAnchored($, pageUrl, pageHost, out) {
            $('time[datetime]').each((_, timeEl) => {
                const dt = $(timeEl).attr('datetime')?.trim();
                if (!dt)
                    return;
                const $time = $(timeEl);
                const container = $time.closest('article, li, .views-row, .event, [class*="event"], [class*="calendar"], section, tr, .card');
                const root = container.length ? container.get(0) : ($time.parent().get(0) ?? timeEl);
                const title = pickTitle($, root);
                if (title.length < 4)
                    return;
                const rawBlockText = collectBlockText($, root);
                const detailUrl = pickDetailUrl($, root, pageUrl, pageHost);
                const imageUrl = pickImageUrl($, root, pageUrl, pageHost);
                const id = sha12([title, dt, detailUrl || '', pageUrl]);
                out.push({
                    id,
                    sourcePageUrl: pageUrl,
                    title,
                    rawBlockText,
                    rawDateText: dt.slice(0, 120),
                    rawTimeText: stripWs($(timeEl).text()).slice(0, 120) || undefined,
                    detailUrl,
                    imageUrl,
                });
            });
        }
        collectArticles($, pageUrl, pageHost, out) {
            $('article').each((_, art) => {
                const root = art;
                const text = collectBlockText($, root);
                if (text.length < 80)
                    return;
                if (!/\d{4}-\d{2}-\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text))
                    return;
                const title = pickTitle($, root);
                if (title.length < 4)
                    return;
                const detailUrl = pickDetailUrl($, root, pageUrl, pageHost);
                const imageUrl = pickImageUrl($, root, pageUrl, pageHost);
                const id = sha12([title, text.slice(0, 200), detailUrl || '', pageUrl]);
                out.push({
                    id,
                    sourcePageUrl: pageUrl,
                    title,
                    rawBlockText: text,
                    rawDateText: undefined,
                    detailUrl,
                    imageUrl,
                });
            });
        }
    };
    return EventCandidateExtractorService = _classThis;
})();
exports.EventCandidateExtractorService = EventCandidateExtractorService;
function dedupeCandidates(items) {
    const map = new Map();
    for (const c of items) {
        const key = `${c.title.toLowerCase().slice(0, 120)}|${(c.detailUrl || '').split('?')[0]}|${(c.rawDateText || '').slice(0, 40)}`;
        const prev = map.get(key);
        if (!prev || c.rawBlockText.length > prev.rawBlockText.length)
            map.set(key, c);
    }
    return [...map.values()];
}
//# sourceMappingURL=event-candidate-extractor.service.js.map