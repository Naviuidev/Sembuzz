import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class SubCategoryAdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
