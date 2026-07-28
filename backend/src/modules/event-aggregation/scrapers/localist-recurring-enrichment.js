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
exports.enrichLocalistRecurringDrafts = enrichLocalistRecurringDrafts;
const cheerio = __importStar(require("cheerio"));
const luxon_1 = require("luxon");
const parse_scraped_dates_util_1 = require("./parse-scraped-dates.util");
const university_events_timezone_service_1 = require("../../super-admin/fetch-events/services/university-events-timezone.service");
const UA = 'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
function localYmdFromIso(iso, zone) {
    const dt = luxon_1.DateTime.fromISO(iso.slice(0, 10), { zone });
    return dt.isValid ? dt.toISODate() : null;
}
function instanceDatesInMonthFromHtml(html, win) {
    const $ = cheerio.load(html);
    const zone = win.timeZone;
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
            if (!node || typeof node !== 'object')
                continue;
            const ev = node;
            if (ev['@type'] !== 'Event')
                continue;
            const iso = typeof ev.startDate === 'string' ? ev.startDate : null;
            if (!iso)
                continue;
            const ymd = localYmdFromIso(iso, zone);
            if (!ymd)
                continue;
            const dayStart = luxon_1.DateTime.fromISO(ymd, { zone }).startOf('day').toJSDate();
            if ((0, university_events_timezone_service_1.universityEventRangeOverlapsWindow)(dayStart, dayStart, win)) {
                seen.add(ymd);
            }
        }
    });
    return [...seen].sort();
}
async function fetchEventHtml(url) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'text/html' },
            redirect: 'follow',
            signal: AbortSignal.timeout(22_000),
        });
        if (!res.ok)
            return null;
        return res.text();
    }
    catch {
        return null;
    }
}
/**
 * For Localist recurring cards: load detail JSON-LD instances and description date ranges.
 */
async function enrichLocalistRecurringDrafts(drafts, win, dateZone, maxDetailFetches = 12) {
    let fetches = 0;
    const ordered = [...drafts].sort((a, b) => Number(b.hasRecurringInstances) - Number(a.hasRecurringInstances));
    for (const draft of ordered) {
        if (!draft.hasRecurringInstances && !draft.description)
            continue;
        if (!draft.sourceUrl?.trim())
            continue;
        if (draft.description) {
            const range = (0, parse_scraped_dates_util_1.parseDateRangeFromFreeText)(draft.description, dateZone);
            if (range.start) {
                draft.startDate = range.start;
                draft.endDate = range.end ?? range.start;
            }
        }
        if (!draft.hasRecurringInstances || fetches >= maxDetailFetches)
            continue;
        const html = await fetchEventHtml(draft.sourceUrl);
        fetches += 1;
        if (!html)
            continue;
        const $ = cheerio.load(html);
        const desc = $('script[type="application/ld+json"]')
            .toArray()
            .map((el) => {
            try {
                const j = JSON.parse($(el).html() || 'null');
                const arr = Array.isArray(j) ? j : [j];
                const ev = arr.find((n) => n?.['@type'] === 'Event');
                return ev?.description ?? '';
            }
            catch {
                return '';
            }
        })
            .find((d) => d.length > 20) ?? '';
        if (desc && !draft.description)
            draft.description = desc.slice(0, 8000);
        const range = (0, parse_scraped_dates_util_1.parseDateRangeFromFreeText)(desc || draft.description || '', dateZone);
        if (range.start) {
            draft.startDate = range.start;
            draft.endDate = range.end ?? range.start;
        }
        const inMonth = instanceDatesInMonthFromHtml(html, win);
        if (inMonth.length > 0) {
            draft.occurrenceDatesInMonth = inMonth;
            if (draft.listingOccurrenceYmd &&
                !inMonth.includes(draft.listingOccurrenceYmd) &&
                (0, university_events_timezone_service_1.universityEventRangeOverlapsWindow)(luxon_1.DateTime.fromISO(draft.listingOccurrenceYmd, { zone: win.timeZone }).toJSDate(), null, win)) {
                draft.occurrenceDatesInMonth = [...inMonth, draft.listingOccurrenceYmd].sort();
            }
            if (!draft.startDate) {
                const first = luxon_1.DateTime.fromISO(inMonth[0], { zone: dateZone }).toJSDate();
                const last = luxon_1.DateTime.fromISO(inMonth[inMonth.length - 1], { zone: dateZone }).toJSDate();
                draft.startDate = first;
                draft.endDate = last;
            }
        }
    }
}
//# sourceMappingURL=localist-recurring-enrichment.js.map