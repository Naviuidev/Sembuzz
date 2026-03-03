import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}
