import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class UpdateCategoryAdminCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  categoryIds: string[];
}
