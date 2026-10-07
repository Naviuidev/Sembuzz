import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubcategoryExternalReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
