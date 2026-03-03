import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class CreateSocialAccountDto {
  @IsString()
  platformId: string;

  @IsString()
  platformName: string;

  @IsString()
  pageName: string;

  @IsString()
  icon: string;

  @IsString()
  @IsUrl()
  @MaxLength(1000)
  link: string;
}
