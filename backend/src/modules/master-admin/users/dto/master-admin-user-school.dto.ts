import { IsNotEmpty, IsString } from 'class-validator';

export class MasterAdminUserSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;
}
