import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export enum SupportRequestType {
  RAISE_ISSUE = 'raise_issue',
  INTEGRATE_FEATURE = 'integrate_feature',
  UI_CHANGE = 'ui_change',
  UPSCALE_PLATFORM = 'upscale_platform',
  CUSTOM_MESSAGE = 'custom_message',
  SCHEDULE_MEETING = 'schedule_meeting',
}

export enum MeetingType {
  GOOGLE_MEET = 'google_meet',
  ZOOM = 'zoom',
}

export enum TimeZone {
  US = 'US',
  INDIA = 'India',
}

export class SupportRequestDto {
  @IsString()
  @IsIn(Object.values(SupportRequestType))
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(MeetingType))
  meetingType?: string;

  @IsOptional()
  @IsDateString()
  meetingDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(TimeZone))
  timeZone?: string;

  @IsOptional()
  @IsString()
  timeSlot?: string;

  @IsOptional()
  @IsString()
  customMessage?: string;
}
