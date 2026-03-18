import { IsString, MinLength } from 'class-validator';

export class RejectBlogDto {
  @IsString()
  @MinLength(1)
  rejectNotes!: string;
}
