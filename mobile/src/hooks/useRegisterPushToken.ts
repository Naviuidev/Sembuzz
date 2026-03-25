import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
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
  const inflight = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const registerNow = useCallback(async () => {
    if (!user?.id || !token || inflight.current) return;
    // Real devices only in production. In __DEV__, allow simulator/emulator.
    if (!Device.isDevice && !__DEV__) return;
    inflight.current = true;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (__DEV__) console.log('[Push] existing permission:', existing);
      let final = existing;
      if (final !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        final = req.status;
        if (__DEV__) console.log('[Push] requested permission:', final);
      }
      if (final !== 'granted') {
        if (__DEV__) console.log('[Push] permission not granted, skipping registration');
        return;
      }

      const devicePush = await Notifications.getDevicePushTokenAsync();
      const pushToken = devicePush.data;
      if (!pushToken) return;

      const platform: 'android' | 'ios' | 'web' =
        Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      if (lastRegistered.current !== pushToken) {
        await userNotificationsService.registerPushToken(pushToken, platform);
        if (__DEV__) {
          const masked = `${pushToken.slice(0, 8)}...${pushToken.slice(-6)}`;
          console.log('[Push] registered token:', { platform, token: masked });
        }
        lastRegistered.current = pushToken;
      }
      clearRetry();
    } catch (e) {
      console.warn('[Push] registration skipped:', e);
      clearRetry();
      retryTimer.current = setTimeout(() => {
        void registerNow();
      }, 5000);
    } finally {
      inflight.current = false;
    }
  }, [clearRetry, token, user?.id]);

  useEffect(() => {
    if (!user?.id || !token) {
      lastRegistered.current = null;
      clearRetry();
      return;
    }
    void registerNow();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void registerNow();
      }
    });
    return () => {
      sub.remove();
      clearRetry();
    };
  }, [clearRetry, registerNow, token, user?.id]);
}
