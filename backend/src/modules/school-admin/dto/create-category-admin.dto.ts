import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCategoryAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
