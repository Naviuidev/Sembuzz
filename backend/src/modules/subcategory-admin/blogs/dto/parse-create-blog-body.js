"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateBlogBody = parseCreateBlogBody;
/**
 * Build CreateBlogDto from raw JSON so POST /blog is not rejected by
 * forbidNonWhitelisted when the pipe uses a stale DTO or strips nested fields.
 */
function parseCreateBlogBody(body) {
    const b = body && typeof body === 'object' && body !== null
        ? body
        : {};
    const imageUrls = Array.isArray(b.imageUrls)
        ? b.imageUrls.filter((x) => typeof x === 'string')
        : undefined;
    return {
        subCategoryId: typeof b.subCategoryId === 'string' ? b.subCategoryId : '',
        title: typeof b.title === 'string' ? b.title : '',
        content: typeof b.content === 'string' ? b.content : undefined,
        coverImageUrl: typeof b.coverImageUrl === 'string' ? b.coverImageUrl : undefined,
        imageUrls,
        heroTitle: typeof b.heroTitle === 'string' ? b.heroTitle : undefined,
        heroParagraph: typeof b.heroParagraph === 'string' ? b.heroParagraph : undefined,
        heroButtonText: typeof b.heroButtonText === 'string' ? b.heroButtonText : undefined,
        heroButtonLink: typeof b.heroButtonLink === 'string' ? b.heroButtonLink : undefined,
        contentBlocks: Array.isArray(b.contentBlocks) ? b.contentBlocks : undefined,
    };
}
//# sourceMappingURL=parse-create-blog-body.js.map