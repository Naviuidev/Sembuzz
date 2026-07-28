import { PlaywrightRendererService } from '../../super-admin/fetch-events/services/playwright-renderer.service';
export declare class ScrapedHtmlLoaderService {
    private readonly playwright;
    constructor(playwright: PlaywrightRendererService | null);
    needsPlaywrightRetry(html: string): boolean;
    load(url: string): Promise<string>;
    loadWithMeta(url: string): Promise<{
        html: string;
        usedPlaywright: boolean;
    }>;
    /** Avoid replacing a good static HTML page with an empty Playwright shell. */
    private renderedHtmlIsBetter;
    private fetchUrl;
}
