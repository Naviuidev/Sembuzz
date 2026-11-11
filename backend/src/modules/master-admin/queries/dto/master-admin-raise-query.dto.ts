import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { CreateQueryDto } from '../../../school-admin/dto/create-query.dto';

export class MasterAdminRaiseQueryDto extends CreateQueryDto {
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsString()
  @IsIn(['super_admin', 'category_admin', 'subcategory_admin', 'school_admin'])
  recipient: 'super_admin' | 'category_admin' | 'subcategory_admin' | 'school_admin';
}
