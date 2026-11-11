import { IsNotEmpty, IsString } from 'class-validator';

export class MasterAdminLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
