import { IsBoolean } from 'class-validator';

export class UpdateDirectMessagingSettingDto {
  @IsBoolean()
  isEnabled: boolean;
}
