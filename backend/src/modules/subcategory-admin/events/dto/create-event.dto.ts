import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateEventDto {
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
  subCategoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  resubmitFromEventId?: string;

  /** ISO 8601 datetime — post goes live at this time after category admin approval. Omit for immediate publish on approval. */
  @IsOptional()
  @IsString()
  publishAt?: string;
}
