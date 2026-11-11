import { IsNotEmpty, IsString } from 'class-validator';
import { CreateSubCategoryDto } from '../../../school-admin/dto/create-subcategory.dto';

export class CreateMasterAdminSubCategoryDto extends CreateSubCategoryDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;
}
