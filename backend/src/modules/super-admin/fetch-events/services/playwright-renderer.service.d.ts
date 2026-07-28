import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Optional headless Chromium render for JS-heavy calendars and SPAs.
 * Enable with UNIVERSITY_PLAYWRIGHT=1 and install browsers: npx playwright install chromium
 */
export declare class PlaywrightRendererService implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private browser;
    private browserLaunchFailed;
    private readonly enabled;
    private readonly timeoutMs;
    private readonly scrollRounds;
    constructor(config: ConfigService);
    isEnabled(): boolean;
    /**
     * True when HTML looks like an empty shell or has very little text (common for client-rendered apps).
     */
    shouldAttemptEnhancement(html: string): boolean;
    renderHtml(url: string): Promise<string | null>;
    /** Click "Load more" / pagination controls on calendar listing pages. */
    private clickLoadMoreButtons;
    /**
     * True when static HTML suggests JS pagination (Load more, empty event list shell, etc.).
     */
    shouldUseCalendarEnhancement(html: string): boolean;
    onModuleDestroy(): Promise<void>;
}
