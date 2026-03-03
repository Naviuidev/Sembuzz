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
  imageUrls?: string;

  @IsOptional()
  @IsString()
  externalLink?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
