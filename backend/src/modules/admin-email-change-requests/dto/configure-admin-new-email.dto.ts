import { IsEmail, IsNotEmpty } from 'class-validator';

export class ConfigureAdminNewEmailDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail!: string;
}
