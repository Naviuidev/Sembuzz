import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Search: undefined;
  Events: undefined;
  Settings: undefined;
  Apps: undefined;
  Blogs: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  LikedNews: undefined;
  SavedNews: undefined;
};
