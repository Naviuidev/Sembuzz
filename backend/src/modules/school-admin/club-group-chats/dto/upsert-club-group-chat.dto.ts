import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertClubGroupChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clubKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pageName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  icon: string;
}
