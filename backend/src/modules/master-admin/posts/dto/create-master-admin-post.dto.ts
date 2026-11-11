import { IsString } from 'class-validator';
import { CreateSchoolAdminPostDto } from '../../../school-admin/posts/dto/create-post.dto';

export class CreateMasterAdminPostDto extends CreateSchoolAdminPostDto {
  @IsString()
  schoolId: string;
}
