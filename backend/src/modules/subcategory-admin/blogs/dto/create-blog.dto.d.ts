export declare class CreateBlogDto {
    subCategoryId: string;
    title: string;
    /** Plain text for listings / search; optional if contentBlocks carry text. */
    content?: string;
    coverImageUrl?: string;
    imageUrls?: string[];
    heroTitle?: string;
    heroParagraph?: string;
    heroButtonText?: string;
    heroButtonLink?: string;
    /** Raw JSON array; validated in service (avoids strict pipe issues). */
    contentBlocks?: unknown;
}
