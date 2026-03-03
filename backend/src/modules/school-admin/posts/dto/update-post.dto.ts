import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

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

  /** JSON array of image URL strings */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
