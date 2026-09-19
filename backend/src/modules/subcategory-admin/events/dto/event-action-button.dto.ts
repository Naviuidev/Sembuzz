import { IsString, MaxLength } from 'class-validator';

export class EventActionButtonDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsString()
  @MaxLength(2000)
  url: string;
}
