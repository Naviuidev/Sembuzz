import {
  IsString,
  IsEmail,
  IsArray,
  IsNotEmpty,
  ArrayMinSize,
  IsOptional,
  IsInt,
  Min,
  Matches,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { FiltersVisibility } from '@prisma/client';

export class CreateSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  state?: string; // Required only for US

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, {
    message: 'Domain must be a valid domain name (e.g., school.edu)',
  })
  domain: string;

  @IsString()
  @IsOptional()
  image?: string; // URL or base64 string for image

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  selectedFeatures: string[]; // feature codes or IDs

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  /** Required only when "ADS" is in selectedFeatures. Email for the Ads Admin (manages banner/sponsored ads). */
  @ValidateIf((o) => (o.adsAdminEmail ?? '') !== '')
  @IsEmail({}, { message: 'Ads Admin email must be a valid email when provided.' })
  @IsOptional()
  adsAdminEmail?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  tenure?: number; // Tenure in months

  /** Required when "FILTERS" is in selectedFeatures. */
  @ValidateIf((o) => Array.isArray(o.selectedFeatures) && o.selectedFeatures.includes('FILTERS'))
  @IsEnum(FiltersVisibility)
  filtersVisibility?: FiltersVisibility;
}
