import type { NavigatorScreenParams } from '@react-navigation/native';

/** Nested stack under Settings tab — keeps bottom tab bar visible (e.g. Change categories). */
export type SettingsStackParamList = {
  SettingsMain: undefined;
  ChangeCategories: undefined;
};

export type MainTabParamList = {
  Search: undefined;
  Events: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
  Apps: undefined;
  Blogs: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  LikedNews: undefined;
  SavedNews: undefined;
  Notifications: undefined;
  Profile: undefined;
  EditProfile: undefined;
  ViewProfile: undefined;
};
