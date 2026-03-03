import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CreateCategoryAdminQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['custom_message', 'schedule_meeting'])
  type: string;

  @IsString()
  @IsOptional()
  @IsIn(['google_meet', 'zoom'])
  meetingType?: string;

  @IsDateString()
  @IsOptional()
  meetingDate?: string;

  @IsString()
  @IsOptional()
  timeSlot?: string;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  customMessage?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
