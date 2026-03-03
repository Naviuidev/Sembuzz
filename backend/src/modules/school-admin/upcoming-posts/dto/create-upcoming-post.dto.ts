import { IsString, IsOptional, IsArray, IsDateString, MaxLength, ValidateIf } from 'class-validator';

export class CreateUpcomingPostDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  categoryId: string;

  @IsString()
  subCategoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  /** Accepted as alias for scheduledTo (backward compatibility). */
  @IsOptional()
  @IsDateString({}, { message: 'scheduledDate must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).' })
  scheduledDate?: string;

  @ValidateIf((o) => !o.scheduledDate)
  @IsDateString({}, { message: 'scheduledTo must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).' })
  scheduledTo?: string;
}
