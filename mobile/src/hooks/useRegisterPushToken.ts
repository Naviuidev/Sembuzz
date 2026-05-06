import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  DeviceEventEmitter,
  Dimensions,
  InteractionManager,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';
import { userNotificationsService } from '../services/userNotifications';
import { NATIVE_UI_TOUCH_RECOVERY, READY_FOR_PUSH_PERMISSION } from '../constants/appEvents';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Extra wait after interactions so the system notification alert does not stack on RN Modals (iPad ghost touches). */
function tabletAwareDelayMs(): number {
  const tablet =
    Device.deviceType === Device.DeviceType.TABLET ||
    (Platform.OS === 'ios' && Platform.isPad === true);
  if (tablet) return 2200;
  return Platform.OS === 'ios' ? 650 : 350;
}

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
  const [mainUiReady, setMainUiReady] = useState(false);

  const clearRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const recoverNativeUiAfterSystemPrompt = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      InteractionManager.runAfterInteractions(() => {
        try {
          Dimensions.get('window');
        } catch {
          /* ignore */
        }
        DeviceEventEmitter.emit(NATIVE_UI_TOUCH_RECOVERY, { source: 'post-push-permission' });
        if (__DEV__) {
          console.log('[Push] post-permission UI recovery (tablet-safe)');
        }
      });
    });
  }, []);

  const registerNow = useCallback(async () => {
    if (!user?.id || !token || inflight.current) return;
    // Real devices only in production. In __DEV__, allow simulator/emulator.
    if (!Device.isDevice && !__DEV__) return;
    inflight.current = true;
    let didRequestPermissions = false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (__DEV__) console.log('[Push] existing permission:', existing);
      let final = existing;
      if (final !== 'granted') {
        didRequestPermissions = true;
        if (__DEV__) {
          console.log('[Push] requesting permission (after UI settle + delay)');
        }
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
      if (didRequestPermissions) {
        recoverNativeUiAfterSystemPrompt();
      }
      inflight.current = false;
    }
  }, [clearRetry, recoverNativeUiAfterSystemPrompt, token, user?.id]);

  /** Wait until Home finished first-login modals / prefs (or fallback timeout) before showing iOS alert. */
  useEffect(() => {
    if (!user?.id || !token) {
      setMainUiReady(false);
      return;
    }
    setMainUiReady(false);
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) {
        setMainUiReady(true);
        if (__DEV__) console.log('[Push] main UI ready for permission flow');
      }
    };

    const sub = DeviceEventEmitter.addListener(
      READY_FOR_PUSH_PERMISSION,
      (p: { userId?: string } | undefined) => {
        if (p?.userId === user?.id) markReady();
      },
    );

    /** Only if Home never emits (should be rare); keep long so first-login modal is never under the OS alert. */
    const fallbackMs = 300_000;
    const fallback = setTimeout(markReady, fallbackMs);

    return () => {
      cancelled = true;
      sub.remove();
      clearTimeout(fallback);
    };
  }, [token, user?.id]);

  useEffect(() => {
    if (!user?.id || !token) {
      lastRegistered.current = null;
      clearRetry();
      return;
    }
    if (!mainUiReady) return;

    const delayMs = tabletAwareDelayMs();
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        void registerNow();
      }, delayMs);
    });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (__DEV__) console.log('[Push] AppState active — refresh registration');
        void registerNow();
      }
    });

    return () => {
      task.cancel();
      sub.remove();
      clearRetry();
    };
  }, [clearRetry, mainUiReady, registerNow, token, user?.id]);
}
