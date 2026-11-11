import { IsString } from 'class-validator';
import { UpdateSocialAccountDto } from '../../../school-admin/social-accounts/dto/update-social-account.dto';

export class UpdateMasterAdminSocialAccountDto extends UpdateSocialAccountDto {
  @IsString()
  schoolId: string;
}
