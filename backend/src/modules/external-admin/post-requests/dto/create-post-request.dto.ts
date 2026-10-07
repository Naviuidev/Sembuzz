import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateExternalPostRequestDto {
  @IsUUID()
  externalCategoryId!: string;

  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  imageUrls?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  eventStartTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  eventEndTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  actionButtons?: string;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}
