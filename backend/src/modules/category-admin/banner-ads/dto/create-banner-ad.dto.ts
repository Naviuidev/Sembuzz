import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateBannerAdDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  externalLink?: string;

  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @IsDateString()
  @IsNotEmpty()
  endAt: string;
}
