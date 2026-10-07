import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PipelineActionMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
