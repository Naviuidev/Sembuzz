import type { JoinableClubGroupChat } from '../services/user-club-group-chats.service';
import type { StudentChatGroupInboxItem } from '../services/user-student-chat-groups.service';

export type ChatGroupListItem = {
  id: string;
  kind: 'student' | 'club';
  name: string;
  subtitle: string;
  visibility: 'public' | 'private' | 'club';
  avatarUrl?: string | null;
  clubIcon?: string;
  isMember: boolean;
  isOwner?: boolean;
  membershipStatus?: 'pending' | 'approved' | 'banned' | null;
  studentGroup?: StudentChatGroupInboxItem;
  clubGroup?: JoinableClubGroupChat;
};
