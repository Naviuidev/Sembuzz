import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateUserHelpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
