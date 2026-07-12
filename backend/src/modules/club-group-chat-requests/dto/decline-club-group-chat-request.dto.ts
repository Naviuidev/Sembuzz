import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineClubGroupChatRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
