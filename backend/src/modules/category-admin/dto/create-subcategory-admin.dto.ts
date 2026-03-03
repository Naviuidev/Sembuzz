import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateSubCategoryAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subCategoryId: string;
}
