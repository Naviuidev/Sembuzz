import { IsString, IsUUID } from 'class-validator';

export class AddStudentChatGroupMemberDto {
  @IsString()
  @IsUUID()
  userId!: string;
}
