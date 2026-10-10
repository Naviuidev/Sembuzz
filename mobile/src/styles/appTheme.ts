import { DefaultTheme, type Theme } from '@react-navigation/native';

/** Let the app-wide SVG gradient show through screens and stack cards. */
export const appNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
  },
};

export const appScreenRoot = {
  flex: 1 as const,
  backgroundColor: 'transparent' as const,
};
