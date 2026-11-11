import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateBlogDto } from '../../../subcategory-admin/blogs/dto/create-blog.dto';

export class CreateMasterAdminBlogDto extends CreateBlogDto {
  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateMasterAdminBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  heroTitle?: string;

  @IsOptional()
  heroParagraph?: string;

  @IsOptional()
  heroButtonText?: string;

  @IsOptional()
  heroButtonLink?: string;

  @IsOptional()
  contentBlocks?: unknown;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
