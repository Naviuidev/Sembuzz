import * as cheerio from 'cheerio';

function scoreCalendarLink(abs: string, pageHost: string): number {
  let score = 0;
  try {
    const u = new URL(abs);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const pageHostNorm = pageHost.replace(/^www\./, '').toLowerCase();

    if (/^events\./i.test(u.hostname)) score += 100;
    if (host.startsWith('events.') && pageHostNorm && host.endsWith(pageHostNorm)) score += 90;
    if (/\/events\/?$/i.test(u.pathname)) score += 50;
    if (/\/events\//i.test(u.pathname) && !/\/news-events\//i.test(u.pathname)) score += 35;
    if (/calendar/i.test(u.pathname) || /calendar/i.test(u.hostname)) score += 25;
    if (/localist/i.test(abs)) score += 20;
    if (/news-events|spotlight|\/news\//i.test(u.pathname)) score -= 40;
    if (/\.(pdf|jpg|png|doc)/i.test(u.pathname)) score -= 100;
  } catch {
    return 0;
  }
  return score;
}

/**
 * When the saved URL is a university homepage, find a linked events/calendar URL.
 * e.g. https://miamioh.edu/ → https://events.miamioh.edu
 */
export function discoverEventCalendarUrl(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  let pageHost = '';
  try {
    pageHost = new URL(baseUrl).hostname;
  } catch {
    return null;
  }

  const seen = new Set<string>();
  const candidates: { url: string; score: number }[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).href;
    } catch {
      return;
    }
    if (!/^https?:\/\//i.test(abs)) return;
    const normalized = abs.split('#')[0]!.replace(/\/$/, '') || abs;
    if (seen.has(normalized)) return;
    const score = scoreCalendarLink(normalized, pageHost);
    if (score < 20) return;
    seen.add(normalized);
    candidates.push({ url: normalized, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return null;

  try {
    const baseNorm = new URL(baseUrl).href.split('#')[0]!.replace(/\/$/, '');
    if (best.url === baseNorm) return null;
  } catch {
    /* ignore */
  }

  return best.url;
}
