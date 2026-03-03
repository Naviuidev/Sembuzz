import { IsOptional, IsBoolean, IsArray, IsString, IsEmail, IsInt, Min } from 'class-validator';

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
}
