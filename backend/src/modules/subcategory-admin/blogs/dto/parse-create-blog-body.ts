import { CreateBlogDto } from './create-blog.dto';

/**
 * Build CreateBlogDto from raw JSON so POST /blog is not rejected by
 * forbidNonWhitelisted when the pipe uses a stale DTO or strips nested fields.
 */
export function parseCreateBlogBody(body: unknown): CreateBlogDto {
  const b =
    body && typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const imageUrls = Array.isArray(b.imageUrls)
    ? b.imageUrls.filter((x): x is string => typeof x === 'string')
    : undefined;
  return {
    subCategoryId: typeof b.subCategoryId === 'string' ? b.subCategoryId : '',
    title: typeof b.title === 'string' ? b.title : '',
    content: typeof b.content === 'string' ? b.content : undefined,
    coverImageUrl:
      typeof b.coverImageUrl === 'string' ? b.coverImageUrl : undefined,
    imageUrls,
    heroTitle: typeof b.heroTitle === 'string' ? b.heroTitle : undefined,
    heroParagraph:
      typeof b.heroParagraph === 'string' ? b.heroParagraph : undefined,
    heroButtonText:
      typeof b.heroButtonText === 'string' ? b.heroButtonText : undefined,
    heroButtonLink:
      typeof b.heroButtonLink === 'string' ? b.heroButtonLink : undefined,
    contentBlocks: Array.isArray(b.contentBlocks) ? b.contentBlocks : undefined,
  };
}
