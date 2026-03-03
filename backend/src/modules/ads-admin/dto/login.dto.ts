import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class AdsAdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
