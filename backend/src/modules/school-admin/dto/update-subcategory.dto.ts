import { IsString, IsOptional } from 'class-validator';

export class UpdateSubCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;
}
