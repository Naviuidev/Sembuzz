import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ExternalPostActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
