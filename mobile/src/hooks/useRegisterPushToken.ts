import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';
import { userNotificationsService } from '../services/userNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers FCM/APNs device token with SemBuzz API when user is logged in.
 * Requires a dev/production build with Firebase (Android google-services.json, iOS APNs in Firebase).
 */
export function useRegisterPushToken() {
  const { user, token } = useAuth();
  const lastRegistered = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) {
      lastRegistered.current = null;
      return;
    }

    // Real devices only in production. In __DEV__, allow simulator/emulator (FCM works best on Android + Google Play image; iOS Simulator often cannot get a push token).
    if (!Device.isDevice && !__DEV__) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let final = existing;
        if (final !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          final = req.status;
        }
        if (final !== 'granted' || cancelled) return;

        const devicePush = await Notifications.getDevicePushTokenAsync();
        if (cancelled) return;
        const pushToken = devicePush.data;
        if (!pushToken || lastRegistered.current === pushToken) return;

        const platform: 'android' | 'ios' | 'web' =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

        await userNotificationsService.registerPushToken(pushToken, platform);
        lastRegistered.current = pushToken;
      } catch (e) {
        console.warn('[Push] registration skipped:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, token]);
}
