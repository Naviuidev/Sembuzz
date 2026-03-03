import { IsString, IsEmail, MinLength, IsUUID, IsIn, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsIn(['school_domain', 'gmail'], { message: 'registrationMethod must be school_domain or gmail' })
  registrationMethod: 'school_domain' | 'gmail';

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  profilePicUrl?: string;

  @IsUUID()
  schoolId: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  /** Required for gmail/public domain: URL of uploaded school doc (ID card, fee receipt, etc.) */
  @IsOptional()
  @IsString()
  verificationDocUrl?: string;
}
