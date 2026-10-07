import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubcategoryExternalActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
