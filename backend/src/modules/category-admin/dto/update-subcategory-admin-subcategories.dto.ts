import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class UpdateSubCategoryAdminSubCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  subCategoryIds: string[];
}
