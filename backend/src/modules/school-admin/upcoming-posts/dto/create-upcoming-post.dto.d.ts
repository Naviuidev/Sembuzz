export declare class CreateUpcomingPostDto {
    title: string;
    description?: string;
    categoryId: string;
    subCategoryId: string;
    imageUrls?: string[];
    /** Accepted as alias for scheduledTo (backward compatibility). */
    scheduledDate?: string;
    scheduledTo?: string;
}
