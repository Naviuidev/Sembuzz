import { IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class AskReuploadDto {
  @IsString()
  @IsNotEmpty({ message: 'Please provide a message to send to the student.' })
  @MinLength(1, { message: 'Message cannot be empty.' })
  message: string;

  @IsOptional()
  @IsString()
  @IsIn(['reupload', 'additional'], { message: 'type must be reupload or additional' })
  type?: 'reupload' | 'additional';
}
