import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MASTER_ADMIN_PORTAL_SECTIONS } from '../../portal-sections.constants';

export class ProvisionSchoolMasterAdminDto {
  @IsUUID()
  schoolId!: string;

  @IsIn(['email', 'sso'])
  accessMethod!: 'email' | 'sso';

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(120)
  firstName!: string;

  @IsString()
  @MaxLength(120)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  verificationDocumentUrl?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...MASTER_ADMIN_PORTAL_SECTIONS], { each: true })
  allowedPortalSections!: string[];
}
