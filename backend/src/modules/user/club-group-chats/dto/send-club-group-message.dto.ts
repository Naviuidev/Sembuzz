import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendClubGroupMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentUrl?: string;

  @IsOptional()
  @IsIn(['image', 'pdf'])
  attachmentType?: 'image' | 'pdf';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentName?: string;

  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;
}
