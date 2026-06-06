import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJsonUploadDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsArray()
  events!: Record<string, unknown>[];
}
