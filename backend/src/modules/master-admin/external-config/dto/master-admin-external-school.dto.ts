import { IsNotEmpty, IsString } from 'class-validator';

export class MasterAdminExternalSchoolDto {
  @IsString()
  @IsNotEmpty()
  schoolId!: string;
}
