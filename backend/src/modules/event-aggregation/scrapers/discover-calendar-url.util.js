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
exports.discoverEventCalendarUrl = discoverEventCalendarUrl;
const cheerio = __importStar(require("cheerio"));
function scoreCalendarLink(abs, pageHost) {
    let score = 0;
    try {
        const u = new URL(abs);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        const pageHostNorm = pageHost.replace(/^www\./, '').toLowerCase();
        if (/^events\./i.test(u.hostname))
            score += 100;
        if (host.startsWith('events.') && pageHostNorm && host.endsWith(pageHostNorm))
            score += 90;
        if (/\/events\/?$/i.test(u.pathname))
            score += 50;
        if (/\/events\//i.test(u.pathname) && !/\/news-events\//i.test(u.pathname))
            score += 35;
        if (/calendar/i.test(u.pathname) || /calendar/i.test(u.hostname))
            score += 25;
        if (/localist/i.test(abs))
            score += 20;
        if (/news-events|spotlight|\/news\//i.test(u.pathname))
            score -= 40;
        if (/\.(pdf|jpg|png|doc)/i.test(u.pathname))
            score -= 100;
    }
    catch {
        return 0;
    }
    return score;
}
/**
 * When the saved URL is a university homepage, find a linked events/calendar URL.
 * e.g. https://miamioh.edu/ → https://events.miamioh.edu
 */
function discoverEventCalendarUrl(html, baseUrl) {
    const $ = cheerio.load(html);
    let pageHost = '';
    try {
        pageHost = new URL(baseUrl).hostname;
    }
    catch {
        return null;
    }
    const seen = new Set();
    const candidates = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href')?.trim();
        if (!href || href.startsWith('#') || href.startsWith('mailto:'))
            return;
        let abs;
        try {
            abs = new URL(href, baseUrl).href;
        }
        catch {
            return;
        }
        if (!/^https?:\/\//i.test(abs))
            return;
        const normalized = abs.split('#')[0].replace(/\/$/, '') || abs;
        if (seen.has(normalized))
            return;
        const score = scoreCalendarLink(normalized, pageHost);
        if (score < 20)
            return;
        seen.add(normalized);
        candidates.push({ url: normalized, score });
    });
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best)
        return null;
    try {
        const baseNorm = new URL(baseUrl).href.split('#')[0].replace(/\/$/, '');
        if (best.url === baseNorm)
            return null;
    }
    catch {
        /* ignore */
    }
    return best.url;
}
//# sourceMappingURL=discover-calendar-url.util.js.map