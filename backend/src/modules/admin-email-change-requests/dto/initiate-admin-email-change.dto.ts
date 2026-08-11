import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class InitiateAdminEmailChangeDto {
  @IsIn(['category_admin', 'subcategory_admin', 'ads_admin'])
  targetRole!: 'category_admin' | 'subcategory_admin' | 'ads_admin';

  @IsString()
  @IsNotEmpty()
  targetAdminId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason!: string;
}
