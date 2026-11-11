import { IsString } from 'class-validator';

export class PublishMasterAdminPostDto {
  @IsString()
  schoolId: string;

  @IsString()
  categoryId: string;

  @IsString()
  subCategoryId: string;
}
