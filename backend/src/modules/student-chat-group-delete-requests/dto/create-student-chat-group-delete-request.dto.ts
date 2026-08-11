import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStudentChatGroupDeleteRequestDto {
  @IsString()
  studentChatGroupId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
