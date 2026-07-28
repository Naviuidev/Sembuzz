"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocalistDateLine = void 0;
exports.parseScrapedDateLine = parseScrapedDateLine;
exports.parseDateRangeFromFreeText = parseDateRangeFromFreeText;
const luxon_1 = require("luxon");
/** Parse event date lines from Localist, UWM, and common US calendar formats. */
function parseScrapedDateLine(raw, zone) {
    const s = raw.replace(/\s+/g, ' ').trim();
    if (!s)
        return { start: null, end: null };
    const z = zone || 'America/New_York';
    // UWM / general: "March 26 - August 14, 2026" or "April 1 - July 1, 2026"
    const crossMonthRange = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/i);
    if (crossMonthRange) {
        const startText = `${crossMonthRange[1]} ${crossMonthRange[2]}, ${crossMonthRange[5]}`;
        const endText = `${crossMonthRange[3]} ${crossMonthRange[4]}, ${crossMonthRange[5]}`;
        const startDt = tryLuxonParse(startText, z);
        const endDt = tryLuxonParse(endText, z);
        if (startDt) {
            return {
                start: startDt.toJSDate(),
                end: endDt ? endDt.toJSDate() : null,
            };
        }
    }
    // Same month: "May 20 - May 25, 2026"
    const sameMonthRange = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})$/i);
    if (sameMonthRange) {
        const y = sameMonthRange[4];
        const startText = `${sameMonthRange[1]} ${sameMonthRange[2]}, ${y}`;
        const endText = `${sameMonthRange[1]} ${sameMonthRange[3]}, ${y}`;
        const startDt = tryLuxonParse(startText, z);
        const endDt = tryLuxonParse(endText, z);
        if (startDt) {
            return {
                start: startDt.toJSDate(),
                end: endDt ? endDt.toJSDate() : null,
            };
        }
    }
    // Localist: "Saturday, May 16, 2026 10:30am to 12pm"
    const rangeSameDay = s.match(/^(.+?\d{4})\s+(\d{1,2}:\d{2}\s*(?:am|pm))\s+to\s+(\d{1,2}:\d{2}\s*(?:am|pm))$/i);
    if (rangeSameDay) {
        const startDt = tryLuxonParse(`${rangeSameDay[1]} ${rangeSameDay[2]}`, z);
        const endDt = tryLuxonParse(`${rangeSameDay[1]} ${rangeSameDay[3]}`, z);
        if (startDt) {
            return {
                start: startDt.toJSDate(),
                end: endDt ? endDt.toJSDate() : null,
            };
        }
    }
    const single = tryLuxonParse(s, z);
    if (single)
        return { start: single.toJSDate(), end: null };
    return { start: null, end: null };
}
function tryLuxonParse(text, zone) {
    const t = text.trim();
    const formats = [
        'EEE, LLL d, yyyy h:mma',
        'EEE, LLL d, yyyy',
        'ccc, LLL d, yyyy h:mma',
        'ccc, LLL d, yyyy',
        'EEEE, LLLL d, yyyy h:mma',
        'EEEE, LLLL d, yyyy',
        'LLLL d, yyyy h:mma',
        'LLLL d, yyyy',
        'LLL. d, yyyy',
        'LLL d, yyyy',
        'LLL d yyyy',
    ];
    for (const fmt of formats) {
        const dt = luxon_1.DateTime.fromFormat(t, fmt, { zone });
        if (dt.isValid)
            return dt;
    }
    const iso = luxon_1.DateTime.fromISO(t, { zone });
    return iso.isValid ? iso : null;
}
/** Find prose ranges like "Jan. 27 - June. 13, 2026" in Localist descriptions. */
function parseDateRangeFromFreeText(text, zone) {
    if (!text?.trim())
        return { start: null, end: null };
    const z = zone || 'America/New_York';
    const m = text.match(/([A-Za-z]+\.?\s+\d{1,2})\s*[-–]\s*([A-Za-z]+\.?\s+\d{1,2}),?\s*(\d{4})/i);
    if (!m)
        return { start: null, end: null };
    const normMonth = (part) => part.replace(/\./g, '').replace(/\s+/g, ' ').trim();
    const startText = `${normMonth(m[1])}, ${m[3]}`;
    const endText = `${normMonth(m[2])}, ${m[3]}`;
    const startDt = tryLuxonParse(startText, z);
    const endDt = tryLuxonParse(endText, z);
    if (!startDt)
        return { start: null, end: null };
    return { start: startDt.toJSDate(), end: endDt ? endDt.toJSDate() : null };
}
/** @deprecated use parseScrapedDateLine */
exports.parseLocalistDateLine = parseScrapedDateLine;
//# sourceMappingURL=parse-scraped-dates.util.js.map