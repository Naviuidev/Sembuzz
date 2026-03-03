import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['dev_support', 'features_not_working', 'schedule_meeting', 'custom_message'])
  type: string;

  @IsString()
  @IsOptional()
  @IsIn(['google_meet', 'zoom'])
  meetingType?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  timeSlot?: string;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** Custom message text (for type custom_message). Stored in description. */
  @IsString()
  @IsOptional()
  customMessage?: string;

  /** Optional document attachment URL */
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
