import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveEventDto {
  /** When true (default), publish immediately if scheduled time has passed. */
  @IsOptional()
  @IsBoolean()
  publishNow?: boolean;

  /** Reschedule to a new publish datetime (ISO 8601). Used when original schedule was missed. */
  @IsOptional()
  @IsString()
  publishAt?: string;
}
