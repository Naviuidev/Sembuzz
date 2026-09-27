import { IsOptional, IsBoolean, IsArray, IsString, IsEmail, IsInt, Min, IsEnum } from 'class-validator';
import { FiltersVisibility } from '@prisma/client';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  schoolName?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tenure?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedFeatures?: string[];

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  resetAdminPassword?: boolean;

  @IsOptional()
  @IsEnum(FiltersVisibility)
  filtersVisibility?: FiltersVisibility | null;
}
