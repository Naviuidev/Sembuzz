import { IsString } from 'class-validator';

export class RevertEventDto {
  @IsString()
  revertNotes: string;
}
