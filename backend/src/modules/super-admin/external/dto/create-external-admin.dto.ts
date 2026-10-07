import { ArrayMinSize, IsArray, IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateExternalAdminDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  adminEmail!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}
