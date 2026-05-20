import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Browser } from 'playwright';

async function delay(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Optional headless Chromium render for JS-heavy calendars and SPAs.
 * Enable with UNIVERSITY_PLAYWRIGHT=1 and install browsers: npx playwright install chromium
 */
@Injectable()
export class PlaywrightRendererService implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightRendererService.name);
  private browser: Browser | null = null;
  private browserLaunchFailed = false;
  private readonly enabled: boolean;
  private readonly timeoutMs: number;
  private readonly scrollRounds: number;

  constructor(private readonly config: ConfigService) {
    this.enabled =
      this.config.get('UNIVERSITY_PLAYWRIGHT') === '1' ||
      this.config.get('UNIVERSITY_PLAYWRIGHT') === 'true';
    const t = Number(this.config.get('UNIVERSITY_PLAYWRIGHT_TIMEOUT_MS'));
    this.timeoutMs = Number.isFinite(t) && t >= 5000 ? Math.min(t, 90_000) : 28_000;
    const sr = Number(this.config.get('UNIVERSITY_PLAYWRIGHT_SCROLL_ROUNDS'));
    this.scrollRounds = Number.isFinite(sr) && sr >= 0 ? Math.min(sr, 12) : 3;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * True when HTML looks like an empty shell or has very little text (common for client-rendered apps).
   */
  shouldAttemptEnhancement(html: string): boolean {
    if (!this.enabled || this.browserLaunchFailed) return false;
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ');
    const text = stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const htmlLen = html.length;
    // Many calendar SPAs ship a large HTML shell with almost no visible text until JS runs.
    if (text.length < 1400) return true;
    if (htmlLen > 25_000 && text.length < 3500 && text.length * 45 < htmlLen) return true;
    if (
      /id=["']root["']|id=["']app["']|id=["']__next["']/i.test(html) &&
      text.length < 2500
    ) {
      return true;
    }
    return false;
  }

  async renderHtml(url: string): Promise<string | null> {
    if (!this.enabled || this.browserLaunchFailed) return null;
    let browser = this.browser;
    if (!browser) {
      try {
        const { chromium } = await import('playwright');
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        this.browser = browser;
        this.logger.log('Playwright Chromium launched for university crawls');
      } catch (e) {
        this.browserLaunchFailed = true;
        this.logger.warn(
          `Playwright unavailable (${(e as Error).message}). Install with: npx playwright install chromium`,
        );
        return null;
      }
    }

    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (compatible; SembuzzEventsBot/1.0; +https://sembuzz.com/bot) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs });
      try {
        await page.waitForLoadState('networkidle', { timeout: Math.min(12_000, this.timeoutMs) });
      } catch {
        // non-fatal — many sites never reach true idle
      }
      for (let i = 0; i < this.scrollRounds; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(380);
      }
      await this.clickLoadMoreButtons(page);
      return await page.content();
    } catch (e) {
      this.logger.warn(`Playwright render failed for ${url}: ${(e as Error).message}`);
      return null;
    } finally {
      await page.close().catch(() => null);
    }
  }

  /** Click "Load more" / pagination controls on calendar listing pages. */
  private async clickLoadMoreButtons(page: import('playwright').Page): Promise<void> {
    const maxClicks = 8;
    for (let i = 0; i < maxClicks; i++) {
      const btn = page
        .locator(
          'button, a[role="button"], .load-more, .load-more-events, [class*="load-more"]',
        )
        .filter({ hasText: /load more|show more|view more|see more/i })
        .first();
      try {
        if (!(await btn.isVisible({ timeout: 600 }))) break;
        await btn.click({ timeout: 3000 });
        await delay(900);
      } catch {
        break;
      }
    }
  }

  /**
   * True when static HTML suggests JS pagination (Load more, empty event list shell, etc.).
   */
  shouldUseCalendarEnhancement(html: string): boolean {
    if (this.shouldAttemptEnhancement(html)) return true;
    if (/load more|loading events|show all events/i.test(html)) return true;
    if (/evnt-block/i.test(html) && (html.match(/evnt-block/gi)?.length ?? 0) < 3) return true;
    return false;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => null);
      this.browser = null;
    }
  }
}
