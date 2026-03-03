import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateFeatureDto {
  @IsString()
  @IsOptional()
  name?: string;
}
