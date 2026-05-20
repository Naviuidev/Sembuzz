import * as cheerio from 'cheerio';
import { DateTime } from 'luxon';
import type { RawNormalizedEventDraft } from './base-scraper.abstract';
import { parseDateRangeFromFreeText } from './parse-scraped-dates.util';
import type { UniversityIngestionWindow } from '../../super-admin/fetch-events/services/university-events-timezone.service';
import { universityEventRangeOverlapsWindow } from '../../super-admin/fetch-events/services/university-events-timezone.service';

const UA =
  'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

function localYmdFromIso(iso: string, zone: string): string | null {
  const dt = DateTime.fromISO(iso.slice(0, 10), { zone });
  return dt.isValid ? dt.toISODate() : null;
}

function instanceDatesInMonthFromHtml(
  html: string,
  win: Pick<UniversityIngestionWindow, 'timeZone' | 'firstDayInclusive' | 'lastDayInclusive'>,
): string[] {
  const $ = cheerio.load(html);
  const zone = win.timeZone;
  const seen = new Set<string>();

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html()?.trim();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const ev = node as Record<string, unknown>;
      if (ev['@type'] !== 'Event') continue;
      const iso = typeof ev.startDate === 'string' ? ev.startDate : null;
      if (!iso) continue;
      const ymd = localYmdFromIso(iso, zone);
      if (!ymd) continue;
      const dayStart = DateTime.fromISO(ymd, { zone }).startOf('day').toJSDate();
      if (universityEventRangeOverlapsWindow(dayStart, dayStart, win)) {
        seen.add(ymd);
      }
    }
  });

  return [...seen].sort();
}

async function fetchEventHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(22_000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/**
 * For Localist recurring cards: load detail JSON-LD instances and description date ranges.
 */
export async function enrichLocalistRecurringDrafts(
  drafts: RawNormalizedEventDraft[],
  win: UniversityIngestionWindow,
  dateZone: string,
  maxDetailFetches = 12,
): Promise<void> {
  let fetches = 0;
  const ordered = [...drafts].sort(
    (a, b) => Number(b.hasRecurringInstances) - Number(a.hasRecurringInstances),
  );

  for (const draft of ordered) {
    if (!draft.hasRecurringInstances && !draft.description) continue;
    if (!draft.sourceUrl?.trim()) continue;

    if (draft.description) {
      const range = parseDateRangeFromFreeText(draft.description, dateZone);
      if (range.start) {
        draft.startDate = range.start;
        draft.endDate = range.end ?? range.start;
      }
    }

    if (!draft.hasRecurringInstances || fetches >= maxDetailFetches) continue;

    const html = await fetchEventHtml(draft.sourceUrl);
    fetches += 1;
    if (!html) continue;

    const $ = cheerio.load(html);
    const desc =
      $('script[type="application/ld+json"]')
        .toArray()
        .map((el) => {
          try {
            const j = JSON.parse($(el).html() || 'null');
            const arr = Array.isArray(j) ? j : [j];
            const ev = arr.find((n: { '@type'?: string }) => n?.['@type'] === 'Event') as
              | { description?: string }
              | undefined;
            return ev?.description ?? '';
          } catch {
            return '';
          }
        })
        .find((d) => d.length > 20) ?? '';

    if (desc && !draft.description) draft.description = desc.slice(0, 8000);
    const range = parseDateRangeFromFreeText(desc || draft.description || '', dateZone);
    if (range.start) {
      draft.startDate = range.start;
      draft.endDate = range.end ?? range.start;
    }

    const inMonth = instanceDatesInMonthFromHtml(html, win);
    if (inMonth.length > 0) {
      draft.occurrenceDatesInMonth = inMonth;
      if (
        draft.listingOccurrenceYmd &&
        !inMonth.includes(draft.listingOccurrenceYmd) &&
        universityEventRangeOverlapsWindow(
          DateTime.fromISO(draft.listingOccurrenceYmd, { zone: win.timeZone }).toJSDate(),
          null,
          win,
        )
      ) {
        draft.occurrenceDatesInMonth = [...inMonth, draft.listingOccurrenceYmd].sort();
      }
      if (!draft.startDate) {
        const first = DateTime.fromISO(inMonth[0], { zone: dateZone }).toJSDate();
        const last = DateTime.fromISO(inMonth[inMonth.length - 1], { zone: dateZone }).toJSDate();
        draft.startDate = first;
        draft.endDate = last;
      }
    }
  }
}
