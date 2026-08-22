import type { NavigatorScreenParams } from '@react-navigation/native';

/** Nested stack under Settings tab — keeps bottom tab bar visible (e.g. Change categories). */
export type SettingsStackParamList = {
  SettingsMain: { openLogin?: boolean; openSignUp?: boolean } | undefined;
  ChangeCategories: undefined;
};

export type MainTabParamList = {
  Search: undefined;
  Events: { focusEventId?: string } | undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
  Apps: undefined;
  Chat: undefined;
  Universities: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  LikedNews: undefined;
  SavedNews: undefined;
  Notifications: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ViewProfile: undefined;
  StudentGroupChat: {
    groupId: string;
    groupName: string;
    visibility: 'public' | 'private';
  };
  ClubGroupChat: {
    groupChatId: string;
    pageName: string;
    icon: string;
    messageMode?: 'admin_only' | 'members';
  };
  DirectChat: {
    conversationId: string;
    peerId: string;
    peerName: string;
    peerEmail: string;
    peerProfilePicUrl?: string | null;
  };
  Blogs: undefined;
  BlogDetail: { blogId: string };
  UniversityEvents: { universityId: string; universityName: string };
  AllUniversityEvents: undefined;
};
