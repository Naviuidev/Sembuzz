import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePipelineRequestsDto {
  @IsUUID()
  externalCategoryId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  schoolIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
