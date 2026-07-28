/**
 * When the saved URL is a university homepage, find a linked events/calendar URL.
 * e.g. https://miamioh.edu/ → https://events.miamioh.edu
 */
export declare function discoverEventCalendarUrl(html: string, baseUrl: string): string | null;
