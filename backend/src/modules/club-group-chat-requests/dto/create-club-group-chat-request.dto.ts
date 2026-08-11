import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClubGroupChatRequestDto {
  @IsString()
  @MaxLength(500)
  clubKey!: string;

  @IsString()
  @MaxLength(200)
  pageName!: string;

  /** Social Share club icon — used to identify the club. */
  @IsString()
  @MaxLength(1000)
  clubIcon!: string;

  /** Icon shown for the group chat (can differ from the club icon). */
  @IsString()
  @MaxLength(1000)
  groupChatIcon!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
