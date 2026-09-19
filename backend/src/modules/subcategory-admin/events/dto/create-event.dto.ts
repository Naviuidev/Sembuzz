import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MaxLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventActionButtonDto } from './event-action-button.dto';

export class CreateEventDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  /** When the event happens (YYYY-MM-DD). */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'eventDate must be YYYY-MM-DD' })
  eventDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'eventStartTime must be HH:mm' })
  eventStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'eventEndTime must be HH:mm' })
  eventEndTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventLocation?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventActionButtonDto)
  actionButtons?: EventActionButtonDto[];

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @IsString()
  subCategoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  resubmitFromEventId?: string;

  /** ISO 8601 datetime — post goes live at this time after category admin approval. Omit for immediate publish on approval. */
  @IsOptional()
  @IsString()
  publishAt?: string;
}
