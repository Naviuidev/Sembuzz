import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subcategories?: string[]; // Array of subcategory names (optional)
}
