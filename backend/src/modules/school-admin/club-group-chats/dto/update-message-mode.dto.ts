import { IsIn } from 'class-validator';
import type { ClubGroupMessageMode } from '../../../club-group-chats/club-group-message.util';

export class UpdateClubGroupMessageModeDto {
  @IsIn(['admin_only', 'members'])
  messageMode: ClubGroupMessageMode;
}
