import { CreateBlogDto } from './create-blog.dto';
/**
 * Build CreateBlogDto from raw JSON so POST /blog is not rejected by
 * forbidNonWhitelisted when the pipe uses a stale DTO or strips nested fields.
 */
export declare function parseCreateBlogBody(body: unknown): CreateBlogDto;
