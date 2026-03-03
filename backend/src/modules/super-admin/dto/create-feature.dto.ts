import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, { message: 'Code must be uppercase letters and underscores only' })
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
