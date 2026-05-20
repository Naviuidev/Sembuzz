import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { EventCandidate } from './event-candidate.types';

const MAX_BLOCK_TEXT = 1_200;
const MAX_CANDIDATES_PER_PAGE = 90;

function sha12(parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
}

function toAbsolute(href: string, baseUrl: string): string | null {
  try {
    return new URL(href.trim(), baseUrl).toString();
  } catch {
    return null;
  }
}

function sameSiteHost(pageHost: string, linkHost: string): boolean {
  const a = pageHost.replace(/^www\./i, '').toLowerCase();
  const b = linkHost.replace(/^www\./i, '').toLowerCase();
  return a === b || b.endsWith(`.${a}`);
}

function looksLikeContentImage(src: string): boolean {
  const lower = src.toLowerCase();
  if (lower.endsWith('.svg')) return false;
  if (/icon|logo|avatar|sprite|placeholder|spacer|1x1|pixel|badge|button/i.test(lower)) return false;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower) || /\/uploads\/|\/media\/|\/images\/|cdn/i.test(lower);
}

function stripWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function collectBlockText($: ReturnType<typeof load>, root: AnyNode): string {
  const el = $(root);
  const bits: string[] = [];
  el.find('h2, h3, h4, h5, p, li, span, time').each((_, n) => {
    const t = stripWs($(n).text());
    if (t.length > 2 && t.length < 400) bits.push(t);
  });
  if (bits.length === 0) bits.push(stripWs(el.text()));
  let out = bits.slice(0, 24).join('\n');
  if (out.length > MAX_BLOCK_TEXT) out = `${out.slice(0, MAX_BLOCK_TEXT)}…`;
  return out;
}

function pickTitle($: ReturnType<typeof load>, root: AnyNode): string {
  const el = $(root);
  const h = el.find('h2, h3, h4, h5').first().text().trim();
  if (h.length >= 4) return h.slice(0, 500);
  const a = el.find('a[href]').first().text().trim();
  if (a.length >= 4) return a.slice(0, 500);
  const t = stripWs(el.text());
  return t.slice(0, 500) || 'Untitled event';
}

function pickDetailUrl($: ReturnType<typeof load>, root: AnyNode, baseUrl: string, pageHost: string): string | undefined {
  const el = $(root);
  let best = '';
  let bestScore = -1;
  el.find('a[href]').each((_, n) => {
    const href = $(n).attr('href');
    if (!href || href.startsWith('#')) return;
    const abs = toAbsolute(href, baseUrl);
    if (!abs) return;
    let host: string;
    try {
      host = new URL(abs).hostname;
    } catch {
      return;
    }
    if (!sameSiteHost(pageHost, host)) return;
    const path = new URL(abs).pathname.toLowerCase();
    if (/\.(pdf|zip|docx?|pptx?)(\?|$)/i.test(path)) return;
    const txt = stripWs($(n).text()).toLowerCase();
    const score =
      (path.includes('event') ? 5 : 0) +
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
      if (!href || href.startsWith('#')) return;
      const abs = toAbsolute(href, baseUrl);
      if (!abs) return;
      try {
        const host = new URL(abs).hostname;
        if (!sameSiteHost(pageHost, host)) return;
        if (new URL(abs).pathname.length > 10) best = abs;
      } catch {
        /* skip */
      }
    });
  }
  return best || undefined;
}

function pickImageUrl($: ReturnType<typeof load>, root: AnyNode, baseUrl: string, pageHost: string): string | undefined {
  const el = $(root);
  let out: string | undefined;
  el.find('img[src]').each((_, n) => {
    if (out) return;
    const src = $(n).attr('src');
    if (!src) return;
    const abs = toAbsolute(src, baseUrl);
    if (!abs || !looksLikeContentImage(abs)) return;
    try {
      if (sameSiteHost(pageHost, new URL(abs).hostname)) out = abs;
    } catch {
      /* skip */
    }
  });
  return out;
}

function walkJsonLdNodes(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const x of node) walkJsonLdNodes(x, visit);
    return;
  }
  const o = node as Record<string, unknown>;
  visit(o);
  if (Array.isArray(o['@graph'])) walkJsonLdNodes(o['@graph'], visit);
}

function typeMatchesEvent(t: unknown): boolean {
  if (typeof t !== 'string') return false;
  const s = t.toLowerCase();
  return s === 'event' || s === 'educationevent' || s === 'socialevent' || s === 'festival' || s.includes('event');
}

@Injectable()
export class EventCandidateExtractorService {
  /**
   * Deterministic extraction: JSON-LD Event, <time datetime>, and article-like blocks.
   * Does not call GPT — output is fed to the validator model in small batches.
   */
  extractFromHtml(pageUrl: string, html: string): EventCandidate[] {
    if (!html || html.length < 80) return [];
    let pageHost: string;
    try {
      pageHost = new URL(pageUrl).hostname;
    } catch {
      return [];
    }

    const out: EventCandidate[] = [];
    try {
      const $ = load(html);
      this.collectJsonLd($, pageUrl, pageHost, out);
      this.collectTimeAnchored($, pageUrl, pageHost, out);
      this.collectArticles($, pageUrl, pageHost, out);
    } catch {
      return dedupeCandidates(out).slice(0, MAX_CANDIDATES_PER_PAGE);
    }
    return dedupeCandidates(out).slice(0, MAX_CANDIDATES_PER_PAGE);
  }

  private collectJsonLd(
    $: ReturnType<typeof load>,
    pageUrl: string,
    pageHost: string,
    out: EventCandidate[],
  ): void {
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      if (!raw?.trim()) return;
      let data: unknown;
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        return;
      }
      walkJsonLdNodes(data, (o) => {
        const types = o['@type'];
        const tList = Array.isArray(types) ? types : [types];
        const isEvent = tList.some((x) => typeMatchesEvent(x));
        if (!isEvent) return;
        const name = typeof o.name === 'string' ? o.name.trim() : '';
        if (name.length < 3) return;
        const start =
          (typeof o.startDate === 'string' && o.startDate) ||
          (typeof o.startTime === 'string' && o.startTime) ||
          '';
        const end =
          (typeof o.endDate === 'string' && o.endDate) ||
          (typeof o.endTime === 'string' && o.endTime) ||
          '';
        let detailUrl: string | undefined;
        if (typeof o.url === 'string') detailUrl = toAbsolute(o.url, pageUrl) ?? undefined;
        let imageUrl: string | undefined;
        const img = o.image;
        if (typeof img === 'string') imageUrl = toAbsolute(img, pageUrl) ?? undefined;
        else if (img && typeof img === 'object' && !Array.isArray(img) && typeof (img as { url?: string }).url === 'string') {
          imageUrl = toAbsolute((img as { url: string }).url, pageUrl) ?? undefined;
        } else if (Array.isArray(img) && typeof img[0] === 'string') {
          imageUrl = toAbsolute(img[0], pageUrl) ?? undefined;
        }
        if (imageUrl) {
          try {
            const u = new URL(imageUrl);
            if (u.protocol !== 'https:' && u.protocol !== 'http:') imageUrl = undefined;
          } catch {
            imageUrl = undefined;
          }
        }
        const desc = typeof o.description === 'string' ? stripWs(o.description).slice(0, 600) : '';
        const loc = o.location;
        let venue = '';
        if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
          const n = (loc as { name?: string }).name;
          if (typeof n === 'string') venue = n;
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

  private collectTimeAnchored(
    $: ReturnType<typeof load>,
    pageUrl: string,
    pageHost: string,
    out: EventCandidate[],
  ): void {
    $('time[datetime]').each((_, timeEl) => {
      const dt = $(timeEl).attr('datetime')?.trim();
      if (!dt) return;
      const $time = $(timeEl);
      const container = $time.closest(
        'article, li, .views-row, .event, [class*="event"], [class*="calendar"], section, tr, .card',
      );
      const root = container.length ? container.get(0)! : ($time.parent().get(0) ?? timeEl);
      const title = pickTitle($, root);
      if (title.length < 4) return;
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

  private collectArticles($: ReturnType<typeof load>, pageUrl: string, pageHost: string, out: EventCandidate[]): void {
    $('article').each((_, art) => {
      const root = art;
      const text = collectBlockText($, root);
      if (text.length < 80) return;
      if (!/\d{4}-\d{2}-\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text)) return;
      const title = pickTitle($, root);
      if (title.length < 4) return;
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
}

function dedupeCandidates(items: EventCandidate[]): EventCandidate[] {
  const map = new Map<string, EventCandidate>();
  for (const c of items) {
    const key = `${c.title.toLowerCase().slice(0, 120)}|${(c.detailUrl || '').split('?')[0]}|${(c.rawDateText || '').slice(0, 40)}`;
    const prev = map.get(key);
    if (!prev || c.rawBlockText.length > prev.rawBlockText.length) map.set(key, c);
  }
  return [...map.values()];
}
