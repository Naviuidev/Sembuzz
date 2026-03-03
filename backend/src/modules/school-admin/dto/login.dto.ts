import { IsString, IsNotEmpty } from 'class-validator';

export class SchoolAdminLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or refNum

  @IsString()
  @IsNotEmpty()
  password: string;
}
