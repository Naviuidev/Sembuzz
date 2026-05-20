import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateScrapedEventSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'websiteUrl must start with http:// or https://' })
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  scraperType?: string;

  @IsOptional()
  selectorsJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
