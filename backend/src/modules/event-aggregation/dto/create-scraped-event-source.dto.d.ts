export declare class CreateScrapedEventSourceDto {
    name: string;
    websiteUrl: string;
    scraperType?: string;
    selectorsJson?: Record<string, unknown>;
    active?: boolean;
}
