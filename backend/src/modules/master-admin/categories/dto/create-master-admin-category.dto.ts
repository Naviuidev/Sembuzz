import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCategoryDto } from '../../../school-admin/dto/create-category.dto';

export class CreateMasterAdminCategoryDto extends CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;
}
