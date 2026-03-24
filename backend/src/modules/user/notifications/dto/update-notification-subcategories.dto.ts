import { IsArray, IsString } from 'class-validator';

export class UpdateNotificationSubcategoriesDto {
  /** Empty = no category notifications (no pushes for news). */
  @IsArray()
  @IsString({ each: true })
  subCategoryIds!: string[];
}
