import { IsString } from 'class-validator';
import { UpdatePostDto } from '../../../school-admin/posts/dto/update-post.dto';

export class UpdateMasterAdminPostDto extends UpdatePostDto {
  @IsString()
  schoolId: string;
}
