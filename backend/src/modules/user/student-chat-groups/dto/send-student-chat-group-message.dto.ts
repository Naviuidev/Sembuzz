import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendStudentChatGroupMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentName?: string;

  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}
