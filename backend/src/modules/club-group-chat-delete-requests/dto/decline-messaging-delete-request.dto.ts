import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineMessagingDeleteRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
