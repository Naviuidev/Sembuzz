/** Emitted when category prefs are saved (Settings) so Home can refresh strip/filter. */
export const CATEGORY_PREFS_CHANGED = 'sembuzz:category-prefs-changed';

/**
 * Home (Events) is done with first-login modals and prefs hydration — safe to show the
 * notification permission dialog without stacking on top of RN Modals (iPad ghost touch layer).
 */
export const READY_FOR_PUSH_PERMISSION = 'sembuzz:ready-for-push-permission';

/** After native notification permission resolves, bump a subscriber to refresh the React tree (iPad WKWebView-style touch recovery). */
export const NATIVE_UI_TOUCH_RECOVERY = 'sembuzz:native-ui-touch-recovery';
