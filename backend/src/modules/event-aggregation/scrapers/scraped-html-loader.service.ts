import { Injectable, Optional } from '@nestjs/common';
import { PlaywrightRendererService } from '../../super-admin/fetch-events/services/playwright-renderer.service';

const DEFAULT_UA =
  'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

@Injectable()
export class ScrapedHtmlLoaderService {
  constructor(@Optional() private readonly playwright: PlaywrightRendererService | null) {}

  needsPlaywrightRetry(html: string): boolean {
    return this.playwright?.shouldUseCalendarEnhancement?.(html) ?? false;
  }

  async load(url: string): Promise<string> {
    const { html } = await this.loadWithMeta(url);
    return html;
  }

  async loadWithMeta(url: string): Promise<{ html: string; usedPlaywright: boolean }> {
    let html = await this.fetchUrl(url);
    const pw = this.playwright;
    const wantsPw =
      pw?.isEnabled?.() &&
      (pw.shouldAttemptEnhancement(html) || pw.shouldUseCalendarEnhancement(html));

    if (wantsPw && pw) {
      const rendered = await pw.renderHtml(url);
      if (rendered && this.renderedHtmlIsBetter(html, rendered)) {
        return { html: rendered, usedPlaywright: true };
      }
    }
    return { html, usedPlaywright: false };
  }

  /** Avoid replacing a good static HTML page with an empty Playwright shell. */
  private renderedHtmlIsBetter(original: string, rendered: string): boolean {
    const countMarkers = (h: string) => {
      const m = h.match(/em-card_title|evnt-block|gtm-event-title/gi);
      return m?.length ?? 0;
    };
    const origMarkers = countMarkers(original);
    const rendMarkers = countMarkers(rendered);
    if (origMarkers > 0 && rendMarkers < origMarkers) return false;
    const textLen = (h: string) =>
      h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    return rendMarkers > origMarkers || textLen(rendered) >= textLen(original) * 0.85;
  }

  private async fetchUrl(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(28_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
    return res.text();
  }
}
