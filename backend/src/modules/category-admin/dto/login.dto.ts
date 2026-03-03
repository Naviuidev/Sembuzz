import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CategoryAdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
