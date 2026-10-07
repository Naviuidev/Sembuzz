import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateExternalAdminDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
