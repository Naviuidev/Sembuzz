import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { BaseScraper, type RawNormalizedEventDraft } from '../base-scraper.abstract';
import { parseScrapedDateLine } from '../parse-scraped-dates.util';
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
    const out: RawNormalizedEventDraft[] = [];
    const seen = new Set<string>();

    $('.em-card_text').each((_, el) => {
      const root = $(el);
      const titleA = root.find('.em-card_title a').first();
      const title = this.normalizeWhitespace(titleA.text());
      if (!title) return;

      const href = titleA.attr('href')?.trim() || null;
      let dateStr = '';
      let venue: string | null = null;

      root.find('p.em-text_icon').each((__, p) => {
        const pe = $(p);
        const hasMap = pe.find('.fa-map-marker-alt, .fa-map-marker, .fa-location-dot').length > 0;
        const t = this.normalizeWhitespace(pe.text());
        if (hasMap && t) venue = t;
        else if (!hasMap && t && !dateStr) dateStr = t;
      });

      const cardRoot = root.closest('.em-list_item, .em-card, li, article').first();
      const img =
        cardRoot.find('.em-card_image img, .img_featured').first().attr('src')?.trim() ||
        root.prevAll().find('img').first().attr('src')?.trim() ||
        null;

      const { start, end } = parseScrapedDateLine(dateStr, this.dateZone);

      const key = `${title}|${href ?? ''}|${dateStr}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        title,
        image: img,
        startDate: start ? new Date(start) : null,
        endDate: end ? new Date(end) : null,
        venue,
        sourceUrl: href,
      });
    });

    return out;
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
