import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { userNotificationsService } from '../services/userNotifications';

/** Remove the current Expo push token from the API (call on logout). */
export async function unregisterCurrentPushToken(): Promise<void> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null)?.extra?.eas
        ?.projectId;
    if (!projectId) return;
    const expoPush = await Notifications.getExpoPushTokenAsync({ projectId });
    if (expoPush.data) {
      await userNotificationsService.removePushToken(expoPush.data);
    }
  } catch {
    /* offline or permission revoked */
  }
}
