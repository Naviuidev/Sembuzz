/** Shared bottom tab bar sizing (custom tab bar + screen bottom inset). */
/** Ionicons glyph size — same for home, profile, apps, chat. */
export const TAB_BAR_ICON_SIZE = 30;
/** Square hit area per tab (icons centered inside). */
export const TAB_BAR_SLOT_SIZE = 48;
/** Header / feed toolbar icons — match bottom tab glyphs. */
export const TOOLBAR_ICON_SIZE = TAB_BAR_ICON_SIZE;
/** Square touch target for toolbar icon buttons (matches tab slot). */
export const TOOLBAR_BTN_SIZE = TAB_BAR_SLOT_SIZE;
/** Logged-in profile photo on the profile tab (matches glyph visual weight). */
export const TAB_BAR_AVATAR_SIZE = 36;
/**
 * Content lift for the floating tab pill (AppNavigator `tabBar` + pill).
 * Matches ~paddingTop 6 + pill vertical pad 20 + slot 48 + small gap.
 * Do NOT add `insets.bottom` on screens — the tab bar already pads for home indicator.
 */
export const MAIN_TAB_BAR_BODY_HEIGHT = 20;
