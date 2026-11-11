import { IsNotEmpty, IsString } from 'class-validator';
import { SupportRequestDto } from '../../../super-admin/dto/support-request.dto';

export class MasterAdminDeveloperRequestDto extends SupportRequestDto {
  @IsString()
  @IsNotEmpty()
  schoolId: string;
}
