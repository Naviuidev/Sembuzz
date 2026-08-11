import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClubGroupChatDeleteRequestDto {
  @IsString()
  clubGroupChatId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
