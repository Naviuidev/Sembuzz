import { IsString, MinLength } from 'class-validator';

export class RevertBlogDto {
  @IsString()
  @MinLength(1)
  revertNotes!: string;
}
