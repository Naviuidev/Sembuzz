import {
  Allow,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBlogDto {
  @IsUUID()
  subCategoryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  /** Plain text for listings / search; optional if contentBlocks carry text. */
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroParagraph?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  heroButtonText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  heroButtonLink?: string;

  /** Raw JSON array; validated in service (avoids strict pipe issues). */
  @IsOptional()
  @Allow()
  contentBlocks?: unknown;
}
