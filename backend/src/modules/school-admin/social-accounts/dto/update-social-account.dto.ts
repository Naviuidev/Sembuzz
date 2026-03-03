import { IsString, IsOptional, MaxLength, IsUrl, Allow } from 'class-validator';

export class UpdateSocialAccountDto {
  @IsOptional()
  @IsString()
  pageName?: string;

  @Allow()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  icon?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(1000)
  link?: string;
}
