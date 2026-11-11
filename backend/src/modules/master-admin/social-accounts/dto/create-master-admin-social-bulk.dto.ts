import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { CreateSocialAccountDto } from '../../../school-admin/social-accounts/dto/create-social-account.dto';

export class CreateMasterAdminSocialBulkDto {
  @IsString()
  schoolId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSocialAccountDto)
  accounts: CreateSocialAccountDto[];
}
