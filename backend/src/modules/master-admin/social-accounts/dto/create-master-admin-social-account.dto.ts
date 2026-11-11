import { IsString } from 'class-validator';
import { CreateSocialAccountDto } from '../../../school-admin/social-accounts/dto/create-social-account.dto';

export class CreateMasterAdminSocialAccountDto extends CreateSocialAccountDto {
  @IsString()
  schoolId: string;
}
