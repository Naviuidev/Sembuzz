import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateScrapedEventSourceDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'websiteUrl must start with http:// or https://' })
  websiteUrl: string;

  @IsOptional()
  @IsString()
  scraperType?: string;

  @IsOptional()
  selectorsJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
