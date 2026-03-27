import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
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
 * Registers an **Expo push token** (`ExponentPushToken[...]`) with the API so the backend can send
 * via Expo Push (works on iOS TestFlight and Android). Native `getDevicePushTokenAsync()` on iOS is
 * an APNs token, not an FCM token — Firebase `sendEachForMulticast` cannot use it.
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

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null)?.extra?.eas
          ?.projectId;

      let pushToken: string | null = null;
      if (projectId) {
        const expoPush = await Notifications.getExpoPushTokenAsync({ projectId });
        pushToken = expoPush.data;
      } else {
        if (__DEV__) {
          console.warn('[Push] No EAS projectId in app config; falling back to native token (Android FCM only).');
        }
        const devicePush = await Notifications.getDevicePushTokenAsync();
        pushToken = devicePush.data ?? null;
      }
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
