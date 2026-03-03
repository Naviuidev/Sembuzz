import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateBannerAdDto {
  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsString()
  externalLink?: string;
}
