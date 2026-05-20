import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import { BaseScraper, type RawNormalizedEventDraft } from '../base-scraper.abstract';
import { parseDateRangeFromFreeText, parseScrapedDateLine } from '../parse-scraped-dates.util';
import type { GenericSelectorConfig } from '../selector-config.types';

export class GenericSelectorScraper extends BaseScraper {
  private dateZone = 'America/New_York';

  setDateZone(zone: string) {
    this.dateZone = zone || 'America/New_York';
  }

  async loadRenderedHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(28_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
    return res.text();
  }

  extractEvents(
    html: string,
    selectors: GenericSelectorConfig,
  ): { drafts: RawNormalizedEventDraft[]; extractionMode: 'generic' | 'localist' | 'uwm' | 'none' } {
    const $ = cheerio.load(html);
    const useGeneric =
      Boolean(selectors.listItemSelector?.trim()) && Boolean(selectors.titleSelector?.trim());

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
  private autoDetect($: cheerio.CheerioAPI): {
    drafts: RawNormalizedEventDraft[];
    extractionMode: 'generic' | 'localist' | 'uwm' | 'none';
  } {
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

  private extractWithListItems(
    $: cheerio.CheerioAPI,
    selectors: GenericSelectorConfig,
  ): RawNormalizedEventDraft[] {
    const listSel = selectors.listItemSelector!.trim();
    const titleSel = selectors.titleSelector!.trim();
    const out: RawNormalizedEventDraft[] = [];

    $(listSel).each((_, el) => {
      const root = $(el);
      const titleNode = root.find(titleSel).first();
      let title = this.normalizeWhitespace(titleNode.text());
      if (!title && titleSel) {
        title = this.normalizeWhitespace(root.find(titleSel).attr('title') || '');
      }
      if (!title) return;

      const description = selectors.descriptionSelector
        ? this.normalizeWhitespace(root.find(selectors.descriptionSelector).first().text()) || undefined
        : undefined;

      const dateText = selectors.dateSelector
        ? this.normalizeWhitespace(root.find(selectors.dateSelector).first().text())
        : '';

      const venue = selectors.locationSelector
        ? this.normalizeWhitespace(root.find(selectors.locationSelector).first().text()) || null
        : null;

      let sourceUrl: string | null = null;
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

      const { start, end } = parseScrapedDateLine(dateText, this.dateZone);

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
  private extractLocalist($: cheerio.CheerioAPI): RawNormalizedEventDraft[] {
    const byKey = new Map<string, RawNormalizedEventDraft>();

    $('.em-card_text').each((_, el) => {
      const root = $(el);
      const titleA = root.find('.em-card_title a').first();
      const title = this.normalizeWhitespace(titleA.text());
      if (!title) return;

      const href = titleA.attr('href')?.trim() || null;
      const { dateStr, venue } = this.extractLocalistDateAndVenue($, root);

      const cardRoot = root.closest('.em-list_item, .em-card, li, article').first();
      const img =
        cardRoot.find('.em-card_image img, .img_featured').first().attr('src')?.trim() ||
        root.prevAll().find('img').first().attr('src')?.trim() ||
        null;

      const { start, end } = parseScrapedDateLine(dateStr, this.dateZone);
      const listingOccurrenceYmd = start
        ? DateTime.fromJSDate(new Date(start), { zone: this.dateZone }).toISODate()
        : null;
      const hasRecurringInstances =
        root.find('.recurringmessage').length > 0 || cardRoot.find('.recurringmessage').length > 0;
      const ld = this.findAdjacentLocalistJsonLd($, cardRoot.length ? cardRoot : root, href);
      const descRange = ld.description
        ? parseDateRangeFromFreeText(ld.description, this.dateZone)
        : { start: null as Date | null, end: null as Date | null };
      const programStart = descRange.start ?? (start ? new Date(start) : null);
      const programEnd = descRange.end ?? (end ? new Date(end) : null) ?? programStart;

      const draft: RawNormalizedEventDraft = {
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
  private extractLocalistDateAndVenue(
    $: cheerio.CheerioAPI,
    root: cheerio.Cheerio<AnyNode>,
  ): { dateStr: string; venue: string | null } {
    let dateStr = '';
    let venue: string | null = null;

    const consumeParagraph = (pe: cheerio.Cheerio<AnyNode>) => {
      const hasMap =
        pe.find('.fa-map-marker-alt, .fa-map-marker, .fa-location-dot').length > 0;
      const hasCalendar = pe.find('.fa-calendar, .fa-calendar-alt, .fa-calendar-days').length > 0;
      const t = this.normalizeWhitespace(pe.text());
      if (!t) return;
      if (hasMap && !venue) venue = t;
      else if ((hasCalendar || !hasMap) && !dateStr) dateStr = t;
    };

    root.find('p.em-text_icon, p.em-card_event-text').each((__, p) => {
      consumeParagraph($(p));
    });

    return { dateStr, venue };
  }

  /** JSON-LD `<script>` often sits immediately before the `.em-card` on Localist listing pages. */
  private findAdjacentLocalistJsonLd(
    $: cheerio.CheerioAPI,
    cardRoot: cheerio.Cheerio<AnyNode>,
    href: string | null,
  ): { description: string | null; venue: string | null } {
    if (!href) return { description: null, venue: null };
    const normHref = href.split('?')[0];
    const scripts = cardRoot.prevAll('script[type="application/ld+json"]').toArray();
    for (const el of scripts.slice(0, 3)) {
      const raw = $(el).html()?.trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as unknown;
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue;
          const ev = node as Record<string, unknown>;
          if (ev['@type'] !== 'Event') continue;
          const url = typeof ev.url === 'string' ? ev.url.split('?')[0] : '';
          if (url && url !== normHref) continue;
          const loc = ev.location as { name?: string } | undefined;
          return {
            description: typeof ev.description === 'string' ? ev.description : null,
            venue: loc?.name ?? null,
          };
        }
      } catch {
        /* ignore */
      }
    }
    return { description: null, venue: null };
  }

  /** Prefer dated rows; fill image/venue from duplicates (carousel vs list markup). */
  private mergeLocalistDrafts(
    a: RawNormalizedEventDraft,
    b: RawNormalizedEventDraft,
  ): RawNormalizedEventDraft {
    const pick =
      a.startDate && !b.startDate ? a : !a.startDate && b.startDate ? b : b.startDate ? b : a;
    const other = pick === a ? b : a;
    return {
      ...pick,
      image: pick.image || other.image,
      venue: pick.venue || other.venue,
      description: pick.description || other.description,
      endDate: pick.endDate || other.endDate,
      hasRecurringInstances: pick.hasRecurringInstances || other.hasRecurringInstances,
      occurrenceDatesInMonth:
        pick.occurrenceDatesInMonth?.length || other.occurrenceDatesInMonth?.length
          ? [...new Set([...(pick.occurrenceDatesInMonth ?? []), ...(other.occurrenceDatesInMonth ?? [])])].sort()
          : undefined,
    };
  }

  /** UWM / WordPress calendar – e.g. https://uwm.edu/events/ */
  private extractUwm($: cheerio.CheerioAPI): RawNormalizedEventDraft[] {
    const out: RawNormalizedEventDraft[] = [];
    const seen = new Set<string>();

    $('.evnt-block').each((_, el) => {
      const root = $(el);
      const titleA = root.find('a.gtm-event-title').first();
      const title = this.normalizeWhitespace(titleA.text());
      if (!title) return;

      let href = titleA.attr('href')?.trim() || null;
      if (href && href.startsWith('/')) {
        try {
          href = new URL(href, 'https://uwm.edu').href;
        } catch {
          /* keep relative */
        }
      }

      const dateText = this.normalizeWhitespace(root.find('li.evnt-date span').first().text());
      const timeText = this.normalizeWhitespace(root.find('li.evnt-time span').first().text());
      const combinedDate = [dateText, timeText].filter(Boolean).join(' ');

      const venue = this.normalizeWhitespace(root.find('li.evnt-loc span').first().text()) || null;
      const description =
        this.normalizeWhitespace(root.find('p.evnt-desc').first().text()) || undefined;
      const img = root.find('img').first().attr('src')?.trim() || null;

      const { start, end } = parseScrapedDateLine(combinedDate || dateText, this.dateZone);

      const key = `${title}|${href ?? ''}|${dateText}`;
      if (seen.has(key)) return;
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

  private extractJsonLd($: cheerio.CheerioAPI): RawNormalizedEventDraft[] {
    const out: RawNormalizedEventDraft[] = [];
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
        this.collectJsonLdEvents(node, out, seen);
      }
    });

    return out;
  }

  private collectJsonLdEvents(node: unknown, out: RawNormalizedEventDraft[], seen: Set<string>): void {
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
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
            venue: typeof o.location === 'object' && o.location && typeof (o.location as { name?: string }).name === 'string'
              ? (o.location as { name: string }).name
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

export function buildDedupeKey(sourceId: string, draft: RawNormalizedEventDraft): string {
  const payload = [
    sourceId,
    draft.sourceUrl ?? '',
    draft.title,
    draft.startDate?.toISOString() ?? '',
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

export function buildSlug(draft: RawNormalizedEventDraft, dedupeKey: string): string {
  const base = draft.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
  const safe = base || 'event';
  return `${safe}-${dedupeKey.slice(0, 12)}`.slice(0, 320);
}
