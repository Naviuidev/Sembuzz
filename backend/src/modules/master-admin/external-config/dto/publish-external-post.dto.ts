import { IsIn, IsOptional, IsString } from 'class-validator';

export class PublishMasterAdminExternalPostDto {
  @IsString()
  schoolId!: string;

  @IsIn(['job', 'offer', 'campaign'])
  contentKind!: 'job' | 'offer' | 'campaign';

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;
}
