import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateSponsoredAdDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrls?: string; // JSON array of URLs, max 4

  @IsOptional()
  @IsString()
  externalLink?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
