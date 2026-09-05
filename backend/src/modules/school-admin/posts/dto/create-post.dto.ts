import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateSchoolAdminPostDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @IsString()
  categoryId: string;

  @IsString()
  subCategoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  /** ISO 8601 datetime. Omit or past = publish immediately. Future = scheduled queue. */
  @IsOptional()
  @IsString()
  publishAt?: string;
}
