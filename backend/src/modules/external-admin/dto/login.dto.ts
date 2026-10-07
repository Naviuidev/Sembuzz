import { IsNotEmpty, IsString } from 'class-validator';

export class ExternalAdminLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
