import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClubGroupChatRequestDto {
  @IsString()
  @MaxLength(500)
  clubKey!: string;

  @IsString()
  @MaxLength(200)
  pageName!: string;

  @IsString()
  @MaxLength(1000)
  icon!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
