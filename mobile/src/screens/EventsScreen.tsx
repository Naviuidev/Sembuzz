import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  DeviceEventEmitter,
  InteractionManager,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_TAB_BAR_BODY_HEIGHT } from '../navigation/tabBarMetrics';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FunnelIcon from 'react-native-bootstrap-icons/icons/funnel';
import FunnelFillIcon from 'react-native-bootstrap-icons/icons/funnel-fill';
import CalendarEventIcon from 'react-native-bootstrap-icons/icons/calendar-event';
import CalendarEventFillIcon from 'react-native-bootstrap-icons/icons/calendar-event-fill';
import SearchIcon from 'react-native-bootstrap-icons/icons/search';
import NewspaperIcon from 'react-native-bootstrap-icons/icons/newspaper';
import BuildingIcon from 'react-native-bootstrap-icons/icons/building';
import { GuestSignInStrip } from '../components/GuestSignInStrip';
import {
  getApprovedEvents,
  getCategoriesBySchool,
  getEngagementCounts,
  getActiveBannerAds,
  getActiveSponsoredAds,
  recordBannerAdClick,
  getUpcomingByDate,
  getScheduledEvents,
  buildGoogleCalendarAddAuthUrl,
  imageSrc,
  schoolLogoSrc,
  getSchoolFilterSettings,
  getSchoolExternalEnabled,
  ApprovedEventPublic,
  CategoryPublic,
  SponsoredAdPublic,
  BannerAdPublic,
  UpcomingPostPublic,
  type SchoolFilterSettings,
} from '../services/events';
import { shouldShowSchoolFilterUi } from '../utils/filtersVisibility';
import { parseImageUrls } from '../services/publicBlogs';
import { getFrontendBaseUrl } from '../config/env';
import type { MainTabParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { buildPublicFeedItems, type PublicFeedItem } from '../utils/publicFeed';
import {
  collectFeedDatesByMode,
  eventMatchesCalendarDateYmd,
  filterEventsByViewByDate,
  getFeedDateFilterTzOffsetMinutes,
} from '../utils/eventFeedDate';
import { FeedCalendarMonthGrid } from '../components/FeedCalendarMonthGrid';
import { FirstLoginCategoriesModal } from '../components/FirstLoginCategoriesModal';
import { ExternalPublicFeedPanel } from '../components/ExternalPublicFeedPanel';
import { InshortsPagedFeed } from '../components/InshortsPagedFeed';
import { SchoolLogo } from '../components/SchoolLogo';
import { userEventsService } from '../services/userEvents';
import {
  getUserCategoryDone,
  getUserSubCategoryIds,
  setUserCategoryDone,
  setUserSubCategoryIds,
} from '../utils/userCategoryPrefs';
import { userNotificationsService } from '../services/userNotifications';
import { CATEGORY_PREFS_CHANGED, READY_FOR_PUSH_PERMISSION } from '../constants/appEvents';
import { getSchools, type SchoolOption } from '../services/userAuth';
import { authModalTheme } from '../styles/authModalTheme';

type EventsRoute = RouteProp<MainTabParamList, 'Events'>;
type HomeFeedMode = 'mySchool' | 'external' | 'allSchools';

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatUpcomingHeader(dateYmd: string): string {
  return new Date(`${dateYmd}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCalendarDraftLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return toYmd(a) === toYmd(b);
}

function getTomorrowDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export default function EventsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Events'>>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const route = useRoute<EventsRoute>();
  const focusEventId = route.params?.focusEventId;
  const { user } = useAuth();
  const [homeFeedMode, setHomeFeedMode] = useState<HomeFeedMode>('mySchool');
  const showAllSchools = homeFeedMode === 'allSchools';
  const showExternalHomeFeed = homeFeedMode === 'external';
  const [schoolExternalEnabled, setSchoolExternalEnabled] = useState(false);
  const [events, setEvents] = useState<ApprovedEventPublic[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [loggedInFeedDateFilter, setLoggedInFeedDateFilter] = useState<string | null>(null);
  const [loggedInFeedPostTypeFilter, setLoggedInFeedPostTypeFilter] = useState<'event' | 'posted' | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedListHeight, setFeedListHeight] = useState(0);
  const feedPageHeight = useMemo(() => {
    if (feedListHeight > 0) return feedListHeight;
    const reserved =
      insets.top + MAIN_TAB_BAR_BODY_HEIGHT + insets.bottom + 220;
    return Math.max(360, windowHeight - reserved);
  }, [feedListHeight, windowHeight, insets.top, insets.bottom]);
  const [homeFilterMenuOpen, setHomeFilterMenuOpen] = useState(false);
  const [showFirstLoginCategories, setShowFirstLoginCategories] = useState(false);
  const [categoryModalSelectedIds, setCategoryModalSelectedIds] = useState<string[]>([]);
  const [categoryModalSaving, setCategoryModalSaving] = useState(false);
  /** Subcategory ids saved at first-login / Settings — used only to decide which category pills appear (matches web). */
  const [persistedPrefSubIds, setPersistedPrefSubIds] = useState<string[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [upcomingDateFilter, setUpcomingDateFilter] = useState<string | null>(null);
  const [selectedUpcomingPost, setSelectedUpcomingPost] = useState<UpcomingPostPublic | null>(null);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPostPublic[]>([]);
  const [calendarApprovedEvents, setCalendarApprovedEvents] = useState<ApprovedEventPublic[]>([]);
  const [calendarScheduledEvents, setCalendarScheduledEvents] = useState<ApprovedEventPublic[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDraftDate, setCalendarDraftDate] = useState(() => new Date());
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(Platform.OS === 'ios');
  /** Emit push-permission readiness once per login so the OS dialog does not stack on first-login Modals (iPad). */
  const pushPermissionReadyEmittedForUser = useRef<string | null>(null);
  const [guestSchoolId, setGuestSchoolId] = useState<string | null>(null);
  const [guestSchools, setGuestSchools] = useState<SchoolOption[]>([]);
  const [guestSchoolsLoading, setGuestSchoolsLoading] = useState(false);
  const [guestSchoolModalVisible, setGuestSchoolModalVisible] = useState(false);
  const [schoolPickerTarget, setSchoolPickerTarget] = useState<'guest' | 'allSchools'>('guest');
  const [allSchoolsFilterSchoolId, setAllSchoolsFilterSchoolId] = useState<string | null>(null);
  const [calendarFilterSchoolId, setCalendarFilterSchoolId] = useState<string | null>(null);
  const [calendarFilterStep, setCalendarFilterStep] = useState<'date' | 'school'>('date');
  const [guestFeedDateFilter, setGuestFeedDateFilter] = useState<string | null>(null);
  const [guestFeedPostTypeFilter, setGuestFeedPostTypeFilter] = useState<'event' | 'posted' | null>(null);
  const [calendarModalPostTypeDraft, setCalendarModalPostTypeDraft] = useState<'event' | 'posted' | null>(
    null,
  );
  const [calendarModalSchoolDraft, setCalendarModalSchoolDraft] = useState<string | null>(null);
  const [loggedInCalendarSchoolId, setLoggedInCalendarSchoolId] = useState<string | null>(null);
  const [calendarVisibleMonth, setCalendarVisibleMonth] = useState(() => new Date());
  const [calendarMarkerEvents, setCalendarMarkerEvents] = useState<ApprovedEventPublic[]>([]);
  const [calendarMarkersLoading, setCalendarMarkersLoading] = useState(false);
  const [calendarSchoolPickerOpen, setCalendarSchoolPickerOpen] = useState(false);
  const [calendarGuestAppliedMessage, setCalendarGuestAppliedMessage] = useState(false);

  const schoolId = user?.schoolId ?? null;
  const [schoolFilterSettings, setSchoolFilterSettings] = useState<SchoolFilterSettings>({
    filtersEnabled: false,
    filtersVisibility: null,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sid = user?.schoolId ?? guestSchoolId ?? null;
        const settings = await getSchoolFilterSettings(sid);
        if (!cancelled) setSchoolFilterSettings(settings);
      } catch {
        if (!cancelled) {
          setSchoolFilterSettings({ filtersEnabled: false, filtersVisibility: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.schoolId, guestSchoolId, user]);

  useEffect(() => {
    if (!schoolId) {
      setSchoolExternalEnabled(false);
      return;
    }
    void getSchoolExternalEnabled(schoolId)
      .then(setSchoolExternalEnabled)
      .catch(() => setSchoolExternalEnabled(false));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolExternalEnabled && homeFeedMode === 'external') {
      setHomeFeedMode('mySchool');
    }
  }, [schoolExternalEnabled, homeFeedMode]);

  useEffect(() => {
    if (route.params?.homeFeedMode === 'allSchools') {
      setHomeFeedMode('allSchools');
      const { homeFeedMode: _consumed, ...rest } = route.params ?? {};
      navigation.setParams(rest);
    }
  }, [route.params, navigation]);

  const showSchoolFilterUi = shouldShowSchoolFilterUi(
    schoolFilterSettings.filtersEnabled,
    schoolFilterSettings.filtersVisibility,
    !!user,
  );

  const showCategories = !!user && homeFeedMode === 'mySchool' && showSchoolFilterUi;
  /** Logged-in All schools tab: Latest/Popular pills in the strip (guest uses funnel dropdown only). */
  const showSortPillsInline = !!user && showAllSchools;
  const isMySchoolFeed = !!user && homeFeedMode === 'mySchool' && !!schoolId;
  /** Logged-in All schools: date/post-type filters live on the calendar icon only. */
  const showHomeFunnel = showSchoolFilterUi && (!user || homeFeedMode === 'mySchool');

  const clearSubCategoryFilter = useCallback(() => setSelectedSubCategoryIds([]), []);

  /** Open URL immediately; record click in background (same redirect URL as API; avoids network delay). */
  const onBannerAdPress = useCallback((banner: BannerAdPublic) => {
    const url = banner.externalLink?.trim();
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
    void recordBannerAdClick(banner.id)
      .then((r) => {
        if (!url && r.redirectUrl) Linking.openURL(r.redirectUrl).catch(() => {});
      })
      .catch(() => {});
  }, []);

  const fetchGuestSchools = useCallback(async () => {
    setGuestSchoolsLoading(true);
    try {
      const list = await getSchools();
      setGuestSchools(list);
    } catch {
      setGuestSchools([]);
    } finally {
      setGuestSchoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (guestSchoolModalVisible) void fetchGuestSchools();
  }, [guestSchoolModalVisible, fetchGuestSchools]);

  useEffect(() => {
    if (!user || showAllSchools) void fetchGuestSchools();
  }, [user, showAllSchools, fetchGuestSchools]);

  const openGuestLogin = useCallback(() => {
    (navigation as { navigate: (name: string, params?: object) => void }).navigate('Settings', {
      screen: 'SettingsMain',
      params: { openLogin: true },
    });
  }, [navigation]);

  const openSearch = useCallback(() => {
    (navigation as { navigate: (name: string) => void }).navigate('Search');
  }, [navigation]);

  useEffect(() => {
    if (user?.id) setGuestSchoolId(null);
  }, [user?.id]);

  const clearGuestSchoolFilter = useCallback(() => {
    setGuestSchoolId(null);
    setGuestSchoolModalVisible(false);
  }, []);

  const clearAllSchoolsFilter = useCallback(() => {
    setAllSchoolsFilterSchoolId(null);
    setGuestSchoolModalVisible(false);
  }, []);

  const openSchoolPicker = useCallback((target: 'guest' | 'allSchools') => {
    setSchoolPickerTarget(target);
    setGuestSchoolModalVisible(true);
  }, []);

  const selectGuestSchool = useCallback((id: string) => {
    setGuestSchoolId(id);
    setUpcomingDateFilter(null);
    setCalendarFilterSchoolId(null);
    setSelectedUpcomingPost(null);
    setGuestSchoolModalVisible(false);
    setHomeFilterMenuOpen(false);
  }, []);

  const selectAllSchoolsFilterSchool = useCallback((id: string) => {
    setAllSchoolsFilterSchoolId(id);
    setGuestSchoolModalVisible(false);
    setHomeFilterMenuOpen(false);
  }, []);

  const isGuestSchoolFeed = !user && !!guestSchoolId;
  const isAllSchoolsFiltered = !!user && showAllSchools && !!allSchoolsFilterSchoolId;
  const isAllSchoolsBrowseMode = !!user && showAllSchools && !allSchoolsFilterSchoolId;
  const isSchoolScopedFeed = isMySchoolFeed || isGuestSchoolFeed || isAllSchoolsFiltered;

  const loggedInPostTypeDateFilterActive =
    !!user &&
    !upcomingDateFilter &&
    !!loggedInFeedDateFilter &&
    !!loggedInFeedPostTypeFilter;

  const guestPostTypeDateFilterActive =
    !user &&
    !upcomingDateFilter &&
    !!guestFeedDateFilter &&
    !!guestFeedPostTypeFilter;

  const fetchEvents = useCallback(async () => {
    const school = !user
      ? guestSchoolId
      : loggedInPostTypeDateFilterActive && loggedInCalendarSchoolId
        ? loggedInCalendarSchoolId
        : showAllSchools
          ? allSchoolsFilterSchoolId
          : schoolId ?? null;
    const subIds = showCategories && selectedSubCategoryIds.length > 0 ? selectedSubCategoryIds : undefined;
    const guestDateFilterActive =
      !user && !upcomingDateFilter && guestFeedDateFilter && guestFeedPostTypeFilter;
    const loggedInDateFilterActive =
      !!user && !upcomingDateFilter && loggedInFeedDateFilter && loggedInFeedPostTypeFilter;
    const dateFilterActive = guestDateFilterActive || loggedInDateFilterActive;
    const dateFilter = dateFilterActive
      ? guestDateFilterActive
        ? guestFeedDateFilter
        : loggedInFeedDateFilter
      : undefined;
    const dateMode = dateFilterActive
      ? guestDateFilterActive
        ? guestFeedPostTypeFilter
        : loggedInFeedPostTypeFilter
      : undefined;
    try {
      let list = await getApprovedEvents(
        school,
        subIds,
        dateFilter ?? undefined,
        dateFilter ? getFeedDateFilterTzOffsetMinutes() : undefined,
        dateMode ?? undefined,
      );
      if (dateFilter && dateMode) {
        list = filterEventsByViewByDate(list, dateFilter, dateMode);
      }
      setEvents(list);
      const ids = list.map((e) => e.id);
      if (ids.length === 0) {
        setInshortsEngagement({ likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] });
      } else {
        void (async () => {
          try {
            const rPublic = await getEngagementCounts(ids);
            if (!user) {
              setInshortsEngagement({
                likes: rPublic.likes,
                commentCounts: rPublic.commentCounts,
                likedByMe: [],
                savedByMe: [],
              });
              return;
            }
            try {
              const rUser = await userEventsService.getEngagement(ids);
              setInshortsEngagement({
                likes: { ...rPublic.likes, ...rUser.likes },
                commentCounts: { ...rPublic.commentCounts, ...rUser.commentCounts },
                likedByMe: rUser.likedByMe,
                savedByMe: rUser.savedByMe,
              });
            } catch {
              setInshortsEngagement({
                likes: rPublic.likes,
                commentCounts: rPublic.commentCounts,
                likedByMe: [],
                savedByMe: [],
              });
            }
          } catch {
            /* keep previous */
          }
        })();
      }
      setError(null);
    } catch (e) {
      if (__DEV__) {
        console.warn('[EventsScreen] fetchEvents failed', e);
      }
      setError('Unable to load events right now. Pull to refresh and try again.');
    }
  }, [
    showAllSchools,
    schoolId,
    showCategories,
    selectedSubCategoryIds,
    user,
    guestSchoolId,
    allSchoolsFilterSchoolId,
    loggedInFeedDateFilter,
    loggedInFeedPostTypeFilter,
    guestFeedDateFilter,
    guestFeedPostTypeFilter,
    loggedInCalendarSchoolId,
    loggedInPostTypeDateFilterActive,
    upcomingDateFilter,
  ]);

  useEffect(() => {
    if (!(showCategories || showFirstLoginCategories) || !schoolId) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }
    let cancelled = false;
    setCategoriesLoading(true);
    getCategoriesBySchool(schoolId)
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showCategories, showFirstLoginCategories, schoolId]);

  useEffect(() => {
    if (!showSchoolFilterUi) {
      setSelectedSubCategoryIds([]);
      setExpandedCategoryId(null);
      setHomeFilterMenuOpen(false);
    }
  }, [showSchoolFilterUi]);

  /** Load saved subcategory filter + first-login gate (same prefs as web). */
  useEffect(() => {
    if (!user?.id) {
      setPrefsLoaded(false);
      setShowFirstLoginCategories(false);
      setSelectedSubCategoryIds([]);
      setPersistedPrefSubIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const done = await getUserCategoryDone(user.id);
      if (cancelled) return;
      if (done === 'true' || done === 'skip') {
        let ids = await getUserSubCategoryIds(user.id);
        try {
          const remote = await userNotificationsService.getSubcategories();
          if (remote.subCategoryIds.length > 0) {
            ids = remote.subCategoryIds;
            await setUserSubCategoryIds(user.id, ids);
          }
        } catch {
          /* offline */
        }
        if (!cancelled) {
          // Persisted prefs drive which category pills show (homeContentCategories), not the session filter UI.
          setPersistedPrefSubIds(ids);
          setSelectedSubCategoryIds([]);
        }
        setShowFirstLoginCategories(false);
      } else if (done === null && user.schoolId) {
        setShowFirstLoginCategories(true);
        setCategoryModalSelectedIds([]);
        setPersistedPrefSubIds([]);
      } else {
        setShowFirstLoginCategories(false);
      }
      if (!cancelled) setPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.schoolId]);

  useEffect(() => {
    if (!user?.id) {
      pushPermissionReadyEmittedForUser.current = null;
      return;
    }
    if (!prefsLoaded || showFirstLoginCategories) return;
    if (pushPermissionReadyEmittedForUser.current === user.id) return;
    pushPermissionReadyEmittedForUser.current = user.id;
    const t = setTimeout(() => {
      DeviceEventEmitter.emit(READY_FOR_PUSH_PERMISSION, { userId: user.id });
      if (__DEV__) console.log('[Events] READY_FOR_PUSH_PERMISSION', user.id);
    }, 0);
    return () => clearTimeout(t);
  }, [user?.id, prefsLoaded, showFirstLoginCategories]);

  /** When Settings saves category prefs, refresh strip + filter without resetting first-login flow. */
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CATEGORY_PREFS_CHANGED, async () => {
      if (!user?.id) return;
      const done = await getUserCategoryDone(user.id);
      if (done === 'true' || done === 'skip') {
        const ids = await getUserSubCategoryIds(user.id);
        setPersistedPrefSubIds(ids);
        setSelectedSubCategoryIds([]);
      }
    });
    return () => sub.remove();
  }, [user?.id]);

  const toggleCategoryModalSub = useCallback((subId: string) => {
    setCategoryModalSelectedIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
    );
  }, []);

  const saveCategorySelectionMobile = useCallback(
    async (skip: boolean) => {
      if (!user?.id || categoryModalSaving) return;
      setCategoryModalSaving(true);

      // Close immediately so the UI feels instant; do the persistence work in background.
      setShowFirstLoginCategories(false);
      const idsToPersist = skip ? [] : categoryModalSelectedIds.slice();
      setCategoryModalSelectedIds([]);
      setSelectedSubCategoryIds([]);
      setPersistedPrefSubIds(idsToPersist);

      InteractionManager.runAfterInteractions(() => {
        (async () => {
          try {
            await setUserCategoryDone(user.id, skip ? 'skip' : 'true');
            await setUserSubCategoryIds(user.id, idsToPersist);
            try {
              await userNotificationsService.setSubcategories(idsToPersist);
            } catch {
              /* push sync optional */
            }
          } finally {
            setCategoryModalSaving(false);
          }
        })().catch(() => {
          setCategoryModalSaving(false);
        });
      });
    },
    [user?.id, categoryModalSelectedIds, categoryModalSaving],
  );

  /** Same as web `homeContentCategories`: filter category pills by first-login prefs, not live filter toggles. */
  const homeContentCategories = useMemo(() => {
    if (!categories.length) return [];
    if (persistedPrefSubIds.length === 0) return categories;
    return categories.filter((cat) =>
      (cat.subcategories ?? []).some((s) => persistedPrefSubIds.includes(s.id)),
    );
  }, [categories, persistedPrefSubIds]);

  const expandedCategory = useMemo(
    () => (expandedCategoryId ? homeContentCategories.find((c) => c.id === expandedCategoryId) ?? null : null),
    [expandedCategoryId, homeContentCategories],
  );

  useEffect(() => {
    // Avoid double load on app reopen:
    // wait for user preference hydration before first fetch for logged-in users.
    if (user?.id && !prefsLoaded) return;
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents, user?.id, prefsLoaded]);

  useEffect(() => {
    if (!showCategories) setExpandedCategoryId(null);
  }, [showCategories]);

  useEffect(() => {
    if (user && showAllSchools) setHomeFilterMenuOpen(false);
  }, [user, showAllSchools]);

  useEffect(() => {
    if (!upcomingDateFilter || !calendarFilterSchoolId) {
      setUpcomingPosts([]);
      setCalendarApprovedEvents([]);
      setCalendarScheduledEvents([]);
      return;
    }
    setUpcomingLoading(true);
    Promise.all([
      getUpcomingByDate(upcomingDateFilter, calendarFilterSchoolId),
      getApprovedEvents(
        calendarFilterSchoolId,
        undefined,
        upcomingDateFilter,
        getFeedDateFilterTzOffsetMinutes(),
      ),
      getScheduledEvents(calendarFilterSchoolId),
    ])
      .then(([upcoming, approved, scheduled]) => {
        setUpcomingPosts(upcoming);
        setCalendarApprovedEvents(
          filterEventsByViewByDate(approved, upcomingDateFilter),
        );
        setCalendarScheduledEvents(
          scheduled.filter((e) => eventMatchesCalendarDateYmd(e, upcomingDateFilter)),
        );
      })
      .catch(() => {
        setUpcomingPosts([]);
        setCalendarApprovedEvents([]);
        setCalendarScheduledEvents([]);
      })
      .finally(() => setUpcomingLoading(false));
  }, [upcomingDateFilter, calendarFilterSchoolId]);

  const clearUpcomingView = useCallback(() => {
    setUpcomingDateFilter(null);
    setCalendarFilterSchoolId(null);
    setSelectedUpcomingPost(null);
    setUpcomingPosts([]);
    setCalendarApprovedEvents([]);
    setCalendarScheduledEvents([]);
    setCalendarExtrasModalVisible(false);
    setCalendarFeedListHeight(0);
  }, []);

  const openCalendarFilter = useCallback(() => {
    setCalendarFilterStep('date');
    const initialDate =
      !user && guestFeedDateFilter
        ? new Date(`${guestFeedDateFilter}T12:00:00`)
        : user && loggedInFeedDateFilter
          ? new Date(`${loggedInFeedDateFilter}T12:00:00`)
          : new Date();
    setCalendarDraftDate(initialDate);
    setCalendarVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    setCalendarModalPostTypeDraft(
      user ? loggedInFeedPostTypeFilter : null,
    );
    setCalendarModalSchoolDraft(user ? loggedInCalendarSchoolId ?? schoolId ?? null : null);
    setCalendarGuestAppliedMessage(false);
    setCalendarSchoolPickerOpen(false);
    setShowCalendarModal(true);
    setHomeFilterMenuOpen(false);
    if (user) void fetchGuestSchools();
  }, [
    fetchGuestSchools,
    user,
    guestFeedDateFilter,
    loggedInFeedDateFilter,
    loggedInFeedPostTypeFilter,
    loggedInCalendarSchoolId,
    schoolId,
  ]);

  const applyGuestCalendarFilter = useCallback(() => {
    if (!calendarModalPostTypeDraft) return;
    setGuestFeedDateFilter(toYmd(calendarDraftDate));
    setGuestFeedPostTypeFilter(calendarModalPostTypeDraft);
    setCalendarGuestAppliedMessage(true);
  }, [calendarDraftDate, calendarModalPostTypeDraft]);

  const applyLoggedInCalendarFilter = useCallback(() => {
    if (!calendarModalPostTypeDraft || !calendarModalSchoolDraft) return;
    setLoggedInFeedDateFilter(toYmd(calendarDraftDate));
    setLoggedInFeedPostTypeFilter(calendarModalPostTypeDraft);
    setLoggedInCalendarSchoolId(calendarModalSchoolDraft);
    setShowCalendarModal(false);
    setCalendarGuestAppliedMessage(false);
    setCalendarSchoolPickerOpen(false);
  }, [calendarDraftDate, calendarModalPostTypeDraft, calendarModalSchoolDraft]);

  const closeCalendarModal = useCallback(() => {
    setShowCalendarModal(false);
    setCalendarGuestAppliedMessage(false);
    setCalendarFilterStep('date');
    setCalendarSchoolPickerOpen(false);
  }, []);

  const clearGuestDateFilter = useCallback(() => {
    setGuestFeedDateFilter(null);
    setGuestFeedPostTypeFilter(null);
  }, []);

  const applyCalendarSchool = useCallback((schoolIdForCalendar: string) => {
    setUpcomingDateFilter(toYmd(calendarDraftDate));
    setCalendarFilterSchoolId(schoolIdForCalendar);
    setGuestSchoolId(null);
    setShowCalendarModal(false);
    setSelectedUpcomingPost(null);
    setCalendarFilterStep('date');
  }, [calendarDraftDate]);

  const clearCalendarFilter = useCallback(() => {
    setUpcomingDateFilter(null);
    setCalendarFilterSchoolId(null);
    setSelectedUpcomingPost(null);
  }, []);

  const guestSchoolName = useMemo(() => {
    if (!guestSchoolId) return null;
    return guestSchools.find((s) => s.id === guestSchoolId)?.name
      ?? events.find((e) => e.schoolId === guestSchoolId)?.school?.name
      ?? null;
  }, [guestSchoolId, guestSchools, events]);

  const allSchoolsFilterSchoolName = useMemo(() => {
    if (!allSchoolsFilterSchoolId) return null;
    return guestSchools.find((s) => s.id === allSchoolsFilterSchoolId)?.name
      ?? events.find((e) => e.schoolId === allSchoolsFilterSchoolId)?.school?.name
      ?? null;
  }, [allSchoolsFilterSchoolId, guestSchools, events]);

  const calendarFilterSchoolName = useMemo(() => {
    if (!calendarFilterSchoolId) return null;
    return guestSchools.find((s) => s.id === calendarFilterSchoolId)?.name ?? null;
  }, [calendarFilterSchoolId, guestSchools]);

  const loggedInCalendarSchoolName = useMemo(() => {
    if (!loggedInCalendarSchoolId) return null;
    return (
      guestSchools.find((s) => s.id === loggedInCalendarSchoolId)?.name
      ?? events.find((e) => e.schoolId === loggedInCalendarSchoolId)?.school?.name
      ?? null
    );
  }, [loggedInCalendarSchoolId, guestSchools, events]);

  const calendarModalSchoolName = useMemo(() => {
    if (!calendarModalSchoolDraft) return null;
    return guestSchools.find((s) => s.id === calendarModalSchoolDraft)?.name ?? null;
  }, [calendarModalSchoolDraft, guestSchools]);

  const calendarMarkedDates = useMemo(() => {
    if (!calendarModalPostTypeDraft) return new Set<string>();
    return collectFeedDatesByMode(calendarMarkerEvents, calendarModalPostTypeDraft);
  }, [calendarMarkerEvents, calendarModalPostTypeDraft]);

  useEffect(() => {
    if (!showCalendarModal || !calendarModalPostTypeDraft) {
      setCalendarMarkerEvents([]);
      return;
    }
    const schoolForMarkers = user ? calendarModalSchoolDraft : guestSchoolId;
    if (user && !schoolForMarkers) {
      setCalendarMarkerEvents([]);
      return;
    }
    setCalendarMarkersLoading(true);
    getApprovedEvents(schoolForMarkers ?? undefined)
      .then((list) => setCalendarMarkerEvents(Array.isArray(list) ? list : []))
      .catch(() => setCalendarMarkerEvents([]))
      .finally(() => setCalendarMarkersLoading(false));
  }, [
    showCalendarModal,
    calendarModalPostTypeDraft,
    calendarModalSchoolDraft,
    guestSchoolId,
    user,
  ]);

  const addUpcomingToGoogleCalendar = useCallback((post: UpcomingPostPublic) => {
    const returnUrl = `${getFrontendBaseUrl().replace(/\/$/, '')}/events`;
    const url = buildGoogleCalendarAddAuthUrl(post, returnUrl);
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open calendar', 'Try again in a browser.');
    });
  }, []);

  const [calendarExtrasModalVisible, setCalendarExtrasModalVisible] = useState(false);
  const [calendarFeedListHeight, setCalendarFeedListHeight] = useState(0);
  const calendarFeedPageHeight =
    calendarFeedListHeight > 0 ? calendarFeedListHeight : feedPageHeight;
  const [calendarEngagementCounts, setCalendarEngagementCounts] = useState<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    savedCounts: Record<string, number>;
  }>({ likes: {}, commentCounts: {}, savedCounts: {} });
  const [calendarInshortsEngagement, setCalendarInshortsEngagement] = useState<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    likedByMe: string[];
    savedByMe: string[];
  }>({ likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] });

  const calendarEventIds = useMemo(
    () => calendarApprovedEvents.map((e) => e.id),
    [calendarApprovedEvents],
  );

  const calendarSortedEvents = useMemo(() => {
    if (feedSort === 'latest') {
      return [...calendarApprovedEvents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    const { likes, commentCounts, savedCounts } = calendarEngagementCounts;
    return [...calendarApprovedEvents].sort((a, b) => {
      const scoreA = (likes[a.id] ?? 0) + (commentCounts[a.id] ?? 0) + (savedCounts[a.id] ?? 0);
      const scoreB = (likes[b.id] ?? 0) + (commentCounts[b.id] ?? 0) + (savedCounts[b.id] ?? 0);
      const diff = scoreB - scoreA;
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [calendarApprovedEvents, feedSort, calendarEngagementCounts]);

  const calendarFeedItems = useMemo(
    (): PublicFeedItem[] => buildPublicFeedItems(calendarSortedEvents, [], [], feedSort),
    [calendarSortedEvents, feedSort],
  );

  const calendarHasPosted = calendarFeedItems.length > 0;
  const calendarExtrasCount = calendarScheduledEvents.length + upcomingPosts.length;

  useEffect(() => {
    if (calendarEventIds.length === 0) {
      setCalendarInshortsEngagement({
        likes: {},
        commentCounts: {},
        likedByMe: [],
        savedByMe: [],
      });
      return;
    }
    void (async () => {
      try {
        const rPublic = await getEngagementCounts(calendarEventIds);
        if (!user) {
          setCalendarInshortsEngagement({
            likes: rPublic.likes,
            commentCounts: rPublic.commentCounts,
            likedByMe: [],
            savedByMe: [],
          });
          return;
        }
        try {
          const rUser = await userEventsService.getEngagement(calendarEventIds);
          setCalendarInshortsEngagement({
            likes: { ...rPublic.likes, ...rUser.likes },
            commentCounts: { ...rPublic.commentCounts, ...rUser.commentCounts },
            likedByMe: rUser.likedByMe,
            savedByMe: rUser.savedByMe,
          });
        } catch {
          setCalendarInshortsEngagement({
            likes: rPublic.likes,
            commentCounts: rPublic.commentCounts,
            likedByMe: [],
            savedByMe: [],
          });
        }
      } catch {
        /* keep previous */
      }
    })();
  }, [calendarEventIds.join(','), user?.id]);

  useEffect(() => {
    if (calendarEventIds.length === 0 || feedSort !== 'popular') {
      setCalendarEngagementCounts({ likes: {}, commentCounts: {}, savedCounts: {} });
      return;
    }
    getEngagementCounts(calendarEventIds)
      .then(setCalendarEngagementCounts)
      .catch(() => setCalendarEngagementCounts({ likes: {}, commentCounts: {}, savedCounts: {} }));
  }, [calendarEventIds.join(','), feedSort]);

  const refreshCalendarFeed = useCallback(() => {
    if (!upcomingDateFilter || !calendarFilterSchoolId) return;
    setUpcomingLoading(true);
    Promise.all([
      getUpcomingByDate(upcomingDateFilter, calendarFilterSchoolId),
      getApprovedEvents(
        calendarFilterSchoolId,
        undefined,
        upcomingDateFilter,
        getFeedDateFilterTzOffsetMinutes(),
      ),
      getScheduledEvents(calendarFilterSchoolId),
    ])
      .then(([upcoming, approved, scheduled]) => {
        setUpcomingPosts(upcoming);
        setCalendarApprovedEvents(
          filterEventsByViewByDate(approved, upcomingDateFilter),
        );
        setCalendarScheduledEvents(
          scheduled.filter((e) => eventMatchesCalendarDateYmd(e, upcomingDateFilter)),
        );
      })
      .finally(() => setUpcomingLoading(false));
  }, [upcomingDateFilter, calendarFilterSchoolId]);

  const getCalendarEventEngagement = useCallback(
    (eventId: string) => ({
      likeCount: calendarInshortsEngagement.likes[eventId] ?? 0,
      commentCount: calendarInshortsEngagement.commentCounts[eventId] ?? 0,
      isLiked: !!user && calendarInshortsEngagement.likedByMe.includes(eventId),
      isSaved: !!user && calendarInshortsEngagement.savedByMe.includes(eventId),
    }),
    [calendarInshortsEngagement, user],
  );

  const calendarLikeRevertRef = useRef<typeof calendarInshortsEngagement | null>(null);
  const calendarSaveRevertRef = useRef<typeof calendarInshortsEngagement | null>(null);

  const onCalendarLike = useCallback(
    async (eventId: string) => {
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to like events.');
        return;
      }
      setCalendarInshortsEngagement((prev) => {
        calendarLikeRevertRef.current = prev;
        const isLiked = prev.likedByMe.includes(eventId);
        const nextCount = (prev.likes[eventId] ?? 0) + (isLiked ? -1 : 1);
        return {
          ...prev,
          likes: { ...prev.likes, [eventId]: Math.max(0, nextCount) },
          likedByMe: isLiked ? prev.likedByMe.filter((id) => id !== eventId) : [...prev.likedByMe, eventId],
        };
      });
      try {
        const r = await userEventsService.toggleLike(eventId);
        setCalendarInshortsEngagement((prev) => ({
          ...prev,
          likes: { ...prev.likes, [eventId]: r.count },
          likedByMe: r.liked
            ? [...new Set([...prev.likedByMe.filter((id) => id !== eventId), eventId])]
            : prev.likedByMe.filter((id) => id !== eventId),
        }));
        calendarLikeRevertRef.current = null;
      } catch {
        const snap = calendarLikeRevertRef.current;
        if (snap) setCalendarInshortsEngagement(snap);
        calendarLikeRevertRef.current = null;
      }
    },
    [user],
  );

  const onCalendarSave = useCallback(
    async (eventId: string) => {
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to save events.');
        return;
      }
      setCalendarInshortsEngagement((prev) => {
        calendarSaveRevertRef.current = prev;
        const isSaved = prev.savedByMe.includes(eventId);
        return {
          ...prev,
          savedByMe: isSaved ? prev.savedByMe.filter((id) => id !== eventId) : [...prev.savedByMe, eventId],
        };
      });
      try {
        const r = await userEventsService.toggleSave(eventId);
        setCalendarInshortsEngagement((prev) => ({
          ...prev,
          savedByMe: r.saved
            ? [...new Set([...prev.savedByMe.filter((id) => id !== eventId), eventId])]
            : prev.savedByMe.filter((id) => id !== eventId),
        }));
        calendarSaveRevertRef.current = null;
      } catch {
        const snap = calendarSaveRevertRef.current;
        if (snap) setCalendarInshortsEngagement(snap);
        calendarSaveRevertRef.current = null;
      }
    },
    [user],
  );

  const onCalendarCommentAdded = useCallback(() => {
    if (!user || calendarEventIds.length === 0) return;
    userEventsService
      .getEngagement(calendarEventIds)
      .then((r) =>
        setCalendarInshortsEngagement({
          likes: r.likes,
          commentCounts: r.commentCounts,
          likedByMe: r.likedByMe,
          savedByMe: r.savedByMe,
        }),
      )
      .catch(() => {});
  }, [user, calendarEventIds]);

  const [engagementCounts, setEngagementCounts] = useState<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    savedCounts: Record<string, number>;
  }>({ likes: {}, commentCounts: {}, savedCounts: {} });

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);

  /** Inshorts feed: guest counts from public API; logged-in full engagement for like/save/comment. */
  const [inshortsEngagement, setInshortsEngagement] = useState<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    likedByMe: string[];
    savedByMe: string[];
  }>({ likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] });


  const getEventEngagement = useCallback(
    (eventId: string) => ({
      likeCount: inshortsEngagement.likes[eventId] ?? 0,
      commentCount: inshortsEngagement.commentCounts[eventId] ?? 0,
      isLiked: !!user && inshortsEngagement.likedByMe.includes(eventId),
      isSaved: !!user && inshortsEngagement.savedByMe.includes(eventId),
    }),
    [inshortsEngagement, user],
  );

  type InshortsEngagementState = {
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    likedByMe: string[];
    savedByMe: string[];
  };
  const inshortsLikeRevertRef = useRef<InshortsEngagementState | null>(null);
  const inshortsSaveRevertRef = useRef<InshortsEngagementState | null>(null);

  const onInshortsLike = useCallback(
    async (eventId: string) => {
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to like events.');
        return;
      }
      setInshortsEngagement((prev) => {
        inshortsLikeRevertRef.current = prev;
        const isLiked = prev.likedByMe.includes(eventId);
        const nextCount = (prev.likes[eventId] ?? 0) + (isLiked ? -1 : 1);
        return {
          ...prev,
          likes: { ...prev.likes, [eventId]: Math.max(0, nextCount) },
          likedByMe: isLiked ? prev.likedByMe.filter((id) => id !== eventId) : [...prev.likedByMe, eventId],
        };
      });
      try {
        const r = await userEventsService.toggleLike(eventId);
        setInshortsEngagement((prev) => ({
          ...prev,
          likes: { ...prev.likes, [eventId]: r.count },
          likedByMe: r.liked
            ? [...new Set([...prev.likedByMe.filter((id) => id !== eventId), eventId])]
            : prev.likedByMe.filter((id) => id !== eventId),
        }));
        inshortsLikeRevertRef.current = null;
      } catch {
        const snap = inshortsLikeRevertRef.current;
        if (snap) setInshortsEngagement(snap);
        inshortsLikeRevertRef.current = null;
      }
    },
    [user],
  );

  const onInshortsSave = useCallback(
    async (eventId: string) => {
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to save events.');
        return;
      }
      setInshortsEngagement((prev) => {
        inshortsSaveRevertRef.current = prev;
        const isSaved = prev.savedByMe.includes(eventId);
        return {
          ...prev,
          savedByMe: isSaved ? prev.savedByMe.filter((id) => id !== eventId) : [...prev.savedByMe, eventId],
        };
      });
      try {
        const r = await userEventsService.toggleSave(eventId);
        setInshortsEngagement((prev) => ({
          ...prev,
          savedByMe: r.saved
            ? [...new Set([...prev.savedByMe.filter((id) => id !== eventId), eventId])]
            : prev.savedByMe.filter((id) => id !== eventId),
        }));
        inshortsSaveRevertRef.current = null;
      } catch {
        const snap = inshortsSaveRevertRef.current;
        if (snap) setInshortsEngagement(snap);
        inshortsSaveRevertRef.current = null;
      }
    },
    [user],
  );

  const onInshortsCommentAdded = useCallback(() => {
    if (!user || eventIds.length === 0) return;
    userEventsService
      .getEngagement(eventIds)
      .then((r) =>
        setInshortsEngagement({
          likes: r.likes,
          commentCounts: r.commentCounts,
          likedByMe: r.likedByMe,
          savedByMe: r.savedByMe,
        }),
      )
      .catch(() => {});
  }, [user, eventIds]);

  useEffect(() => {
    if (eventIds.length === 0 || feedSort !== 'popular') {
      setEngagementCounts({ likes: {}, commentCounts: {}, savedCounts: {} });
      return;
    }
    getEngagementCounts(eventIds)
      .then(setEngagementCounts)
      .catch(() => setEngagementCounts({ likes: {}, commentCounts: {}, savedCounts: {} }));
  }, [eventIds.join(','), feedSort]);

  const sortedEvents = useMemo(() => {
    if (feedSort === 'latest') {
      return [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    const { likes, commentCounts, savedCounts } = engagementCounts;
    return [...events].sort((a, b) => {
      const scoreA = (likes[a.id] ?? 0) + (commentCounts[a.id] ?? 0) + (savedCounts[a.id] ?? 0);
      const scoreB = (likes[b.id] ?? 0) + (commentCounts[b.id] ?? 0) + (savedCounts[b.id] ?? 0);
      const diff = scoreB - scoreA;
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [events, feedSort, engagementCounts]);

  const [activeBannerAds, setActiveBannerAds] = useState<BannerAdPublic[]>([]);
  const [activeSponsoredAds, setActiveSponsoredAds] = useState<SponsoredAdPublic[]>([]);

  /** Match web: logged-in + all schools → optional school filter; else user’s school. Guests → optional school filter. */
  const effectiveSchoolId = useMemo(() => {
    if (!user) return guestSchoolId;
    return showAllSchools ? allSchoolsFilterSchoolId : schoolId;
  }, [user, showAllSchools, schoolId, guestSchoolId, allSchoolsFilterSchoolId]);

  const loadAds = useCallback(async () => {
    try {
      const [banners, sponsored] = await Promise.all([
        getActiveBannerAds(effectiveSchoolId ?? undefined),
        getActiveSponsoredAds(effectiveSchoolId ?? undefined),
      ]);
      setActiveBannerAds(banners);
      setActiveSponsoredAds(sponsored);
    } catch (e) {
      if (__DEV__) {
        console.warn('[EventsScreen] loadAds failed', e);
      }
      setActiveBannerAds([]);
      setActiveSponsoredAds([]);
    }
  }, [effectiveSchoolId]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const feedItems = useMemo(
    (): PublicFeedItem[] =>
      buildPublicFeedItems(sortedEvents, activeSponsoredAds, activeBannerAds, feedSort),
    [sortedEvents, activeSponsoredAds, activeBannerAds, feedSort],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchEvents(), loadAds()]).finally(() => setRefreshing(false));
  }, [fetchEvents, loadAds]);

  const toggleSubCategory = (subId: string) => {
    setSelectedSubCategoryIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
    );
  };

  const openSchoolEmptyMessage = () => {
    Alert.alert(
      'News from this school',
      'News of this school will be coming soon.\n\nApproved news from this school will appear here once category admins approve posts.',
      [{ text: 'OK' }],
    );
  };

  const switchToMySchool = useCallback(() => {
    setExpandedCategoryId(null);
    setHomeFilterMenuOpen(false);
    setHomeFeedMode('mySchool');
    setAllSchoolsFilterSchoolId(null);
    clearUpcomingView();
  }, [clearUpcomingView]);

  const switchToAllSchools = useCallback(() => {
    setExpandedCategoryId(null);
    setHomeFilterMenuOpen(false);
    setHomeFeedMode('allSchools');
    clearUpcomingView();
  }, [clearUpcomingView]);

  const switchToExternal = useCallback(() => {
    setExpandedCategoryId(null);
    setHomeFilterMenuOpen(false);
    setHomeFeedMode('external');
    clearUpcomingView();
  }, [clearUpcomingView]);

  /** Home tab + badges: feed school image first, then profile `schoolImage` (matches web). */
  const mySchoolTabSchool = useMemo(() => {
    const sid = user?.schoolId ?? schoolId;
    const hit =
      sid
        ? events.find((e) => e.schoolId === sid && e.school?.image?.trim())
        : undefined;
    const image = hit?.school?.image?.trim() || user?.schoolImage?.trim() || '';
    const name =
      user?.schoolName?.trim() ||
      hit?.school?.name?.trim() ||
      user?.name?.trim() ||
      'My school';
    return { name, image };
  }, [events, schoolId, user?.schoolId, user?.schoolImage, user?.schoolName, user?.name]);

  const mySchoolLogo = useMemo(() => {
    const raw = mySchoolTabSchool.image?.trim();
    return raw ? schoolLogoSrc(raw) : '';
  }, [mySchoolTabSchool.image]);

  const selectedSubCategoryMeta = useMemo(() => {
    if (!selectedSubCategoryIds.length || !categories.length) return [];
    const byId = new Map<string, { id: string; name: string }>();
    categories.forEach((cat) => {
      (cat.subcategories ?? []).forEach((sub) => byId.set(sub.id, { id: sub.id, name: sub.name }));
    });
    return selectedSubCategoryIds
      .map((id) => byId.get(id))
      .filter((v): v is { id: string; name: string } => !!v);
  }, [selectedSubCategoryIds, categories]);

  const renderCalendarExtrasSections = () => (
    <>
      {calendarScheduledEvents.length > 0 ? (
        <>
          <Text style={styles.calendarSectionLabel}>Scheduled news</Text>
          {calendarScheduledEvents.map((event) => (
            <View key={event.id} style={styles.upcomingCard}>
              <View style={styles.upcomingItem}>
                <SchoolLogo school={event.school} size={36} borderRadius={18} />
                <View style={styles.upcomingItemText}>
                  <Text style={styles.upcomingItemTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={styles.upcomingItemSub} numberOfLines={1}>
                    {event.publishAt
                      ? new Date(event.publishAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Scheduled'}
                    {event.subCategory?.name ? ` · ${event.subCategory.name}` : ''}
                  </Text>
                </View>
                <View style={styles.scheduledBadge}>
                  <Text style={styles.scheduledBadgeText}>Scheduled</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      ) : null}
      {upcomingPosts.length > 0 ? (
        <>
          <Text style={styles.calendarSectionLabel}>Upcoming news</Text>
          {upcomingPosts.map((post) => (
            <View key={post.id} style={styles.upcomingCard}>
              <TouchableOpacity
                style={styles.upcomingItem}
                onPress={() => {
                  setCalendarExtrasModalVisible(false);
                  setSelectedUpcomingPost(post);
                }}
                activeOpacity={0.85}
              >
                <SchoolLogo school={post.school} size={36} borderRadius={18} />
                <View style={styles.upcomingItemText}>
                  <Text style={styles.upcomingItemTitle} numberOfLines={1}>
                    {post.title}
                  </Text>
                  <Text style={styles.upcomingItemSub} numberOfLines={1}>
                    {post.school?.name ?? 'School'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8e8e8e" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.upcomingCalIconBtn}
                onPress={() => addUpcomingToGoogleCalendar(post)}
                accessibilityLabel="Add to Google Calendar"
              >
                <Ionicons name="calendar-outline" size={20} color="#6c757d" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : null}
    </>
  );

  const calendarHeaderRow = (
    <View style={styles.upcomingHeaderRow}>
      <Text style={styles.upcomingHeaderLabel}>
        News for {formatUpcomingHeader(upcomingDateFilter!)}
        {calendarFilterSchoolName ? ` · ${calendarFilterSchoolName}` : ''}
      </Text>
      <TouchableOpacity onPress={clearUpcomingView} style={styles.upcomingBackBtn}>
        <Text style={styles.upcomingBackBtnText}>Show regular feed</Text>
      </TouchableOpacity>
    </View>
  );

  const showGuestSchoolPicker = showSchoolFilterUi && !user;
  const showAllSchoolsPicker = showSchoolFilterUi && !!user && showAllSchools;
  const schoolPickerActiveId = showGuestSchoolPicker ? guestSchoolId : allSchoolsFilterSchoolId;
  const schoolPickerLabel = showGuestSchoolPicker
    ? guestSchoolName ?? 'Select school'
    : allSchoolsFilterSchoolName ?? 'Select school';

  const mySchoolReturnBadgeLabel =
    user?.schoolName?.trim() || user?.name?.trim() || 'My school';

  const schoolFilterBadgeLabel = isGuestSchoolFeed
    ? guestSchoolName
    : isAllSchoolsFiltered
      ? allSchoolsFilterSchoolName
      : isAllSchoolsBrowseMode
        ? mySchoolReturnBadgeLabel
        : null;

  const showSchoolFilterBadge =
    !upcomingDateFilter &&
    !selectedUpcomingPost &&
    !!schoolFilterBadgeLabel &&
    (isGuestSchoolFeed || isAllSchoolsFiltered || isAllSchoolsBrowseMode);

  const onSchoolFilterBadgePress = () => {
    if (isGuestSchoolFeed) {
      clearGuestSchoolFilter();
      return;
    }
    if (isAllSchoolsFiltered) {
      clearAllSchoolsFilter();
      return;
    }
    if (isAllSchoolsBrowseMode) {
      switchToMySchool();
    }
  };

  const renderSchoolFilterBadge = (placement: 'guestHeader' | 'feed') => {
    if (!showSchoolFilterBadge || !schoolFilterBadgeLabel) return null;
    if (placement === 'guestHeader' && user) return null;
    if (placement === 'feed' && !user) return null;
    const badgeHint = isAllSchoolsBrowseMode
      ? 'Tap to return to your school feed'
      : 'Clear filter to choose another school';
    const a11yLabel = isAllSchoolsBrowseMode
      ? `Return to ${schoolFilterBadgeLabel} feed`
      : `Clear school filter for ${schoolFilterBadgeLabel}`;
    return (
      <View
        style={[
          styles.schoolFilterAboveFeed,
          placement === 'guestHeader' && styles.schoolFilterAboveFeedGuestHeader,
        ]}
      >
        {isAllSchoolsBrowseMode ? (
          <Text style={styles.schoolFilterBrowseContext} numberOfLines={1}>
            Browsing all schools
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.schoolFilterClearBadge}
          onPress={onSchoolFilterBadgePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
        >
          {isAllSchoolsBrowseMode && mySchoolLogo ? (
            <Image source={{ uri: mySchoolLogo }} style={styles.schoolFilterBadgeLogo} />
          ) : (
            <BuildingIcon width={14} height={14} fill="#14532D" />
          )}
          <Text style={styles.schoolFilterClearBadgeLabel} numberOfLines={1}>
            {schoolFilterBadgeLabel}
          </Text>
          <View style={styles.schoolFilterClearBadgeClose}>
            <Text style={styles.schoolFilterClearBadgeCloseText}>×</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.schoolFilterAboveFeedHint}>{badgeHint}</Text>
      </View>
    );
  };

  const homeFilterRow = (
    <View
      style={[
        styles.homeFilterRow,
        !user ? styles.guestHomeFilterRow : null,
        user ? styles.loggedInHomeFilterRow : null,
      ]}
    >
      {showGuestSchoolPicker || showAllSchoolsPicker ? (
        <>
          <TouchableOpacity
            style={[
              styles.guestSchoolSelectBtn,
              schoolPickerActiveId ? styles.guestSchoolSelectBtnActive : null,
            ]}
            onPress={() => openSchoolPicker(showGuestSchoolPicker ? 'guest' : 'allSchools')}
            activeOpacity={0.85}
          >
            <BuildingIcon
              width={16}
              height={16}
              fill={schoolPickerActiveId ? '#14532D' : '#166534'}
            />
            <Text
              style={[
                styles.guestSchoolSelectBtnText,
                schoolPickerActiveId ? styles.guestSchoolSelectBtnTextActive : null,
              ]}
              numberOfLines={1}
            >
              {schoolPickerLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={schoolPickerActiveId ? '#14532D' : '#4B5563'}
            />
          </TouchableOpacity>
        </>
      ) : null}
      {showCategories || showSortPillsInline ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesStrip}
        contentContainerStyle={styles.categoriesStripContent}
      >
        {showSortPillsInline ? (
            <>
              <TouchableOpacity
                style={[
                  styles.categoryMainPill,
                  feedSort === 'latest' && styles.inlineSortPillActive,
                ]}
                onPress={() => setFeedSort('latest')}
                accessibilityLabel="Sort by latest"
              >
                <Text
                  style={[
                    styles.categoryMainPillText,
                    feedSort === 'latest' && styles.inlineSortPillTextActive,
                  ]}
                >
                  Latest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryMainPill,
                  feedSort === 'popular' && styles.inlineSortPillActive,
                ]}
                onPress={() => setFeedSort('popular')}
                accessibilityLabel="Sort by popular"
              >
                <Text
                  style={[
                    styles.categoryMainPillText,
                    feedSort === 'popular' && styles.inlineSortPillTextActive,
                  ]}
                >
                  Popular
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {showCategories && homeContentCategories.length > 0 && selectedSubCategoryIds.length > 0 ? (
                <TouchableOpacity onPress={clearSubCategoryFilter} style={styles.clearCatsBtn}>
                  <Text style={styles.clearCatsText}>Reset All</Text>
                </TouchableOpacity>
              ) : null}
              {showCategories && homeContentCategories.length > 0
                ? homeContentCategories.map((cat) => {
                    const hasSelection = selectedSubCategoryIds.some((id) =>
                      (cat.subcategories ?? []).some((s) => s.id === id),
                    );
                    const isOpen = expandedCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryMainPill,
                          (hasSelection || isOpen) && styles.categoryMainPillEmphasis,
                        ]}
                        onPress={() => {
                          setExpandedCategoryId((prev) => (prev === cat.id ? null : cat.id));
                        }}
                        accessibilityLabel={`Category ${cat.name}`}
                      >
                        <Text
                          style={[
                            styles.categoryMainPillText,
                            (hasSelection || isOpen) && styles.categoryMainPillTextEmphasis,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                : null}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.homeFilterRowSpacer} />
      )}
        {showSchoolFilterUi ? (
          <View style={styles.homeFilterActions}>
            {showHomeFunnel ? (
            <View style={styles.filterFunnelWrap}>
            <TouchableOpacity
              style={[
                styles.homeFilterBtn,
                (homeFilterMenuOpen ||
                  feedSort !== 'latest' ||
                  (!user && isGuestSchoolFeed)) &&
                  styles.homeFilterBtnActive,
              ]}
              onPress={() => setHomeFilterMenuOpen((o) => !o)}
              accessibilityLabel="Filter"
            >
              {homeFilterMenuOpen ||
              feedSort !== 'latest' ||
              (!user && isGuestSchoolFeed) ? (
                <FunnelFillIcon width={24} height={24} fill="#087990" />
              ) : (
                <FunnelIcon width={24} height={24} fill="#6c757d" />
              )}
            </TouchableOpacity>
            {homeFilterMenuOpen ? (
              <ScrollView
                style={styles.sortDropdownScroll}
                contentContainerStyle={styles.sortDropdownScrollContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
              <View style={styles.sortDropdown} pointerEvents="box-none">
                <View style={styles.sortDropdownHeaderRow}>
                  <Text style={styles.sortDropdownLabel}>Filter</Text>
                  <TouchableOpacity
                    onPress={() => setHomeFilterMenuOpen(false)}
                    hitSlop={8}
                    accessibilityLabel="Close filter"
                  >
                    <Text style={styles.sortDropdownClose}>×</Text>
                  </TouchableOpacity>
                </View>
                {!showSortPillsInline ? (
                  <>
                    <Text style={styles.sortDropdownSubLabel}>Sort</Text>
                    <View style={styles.sortPillRow}>
                      <TouchableOpacity
                        style={[styles.sortPillSm, feedSort === 'latest' && styles.sortPillSmActive]}
                        onPress={() => {
                          setFeedSort('latest');
                          setHomeFilterMenuOpen(false);
                        }}
                      >
                        <Text style={[styles.sortPillSmText, feedSort === 'latest' && styles.sortPillSmTextActive]}>
                          Latest
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sortPillSm, feedSort === 'popular' && styles.sortPillSmActive]}
                        onPress={() => {
                          setFeedSort('popular');
                          setHomeFilterMenuOpen(false);
                        }}
                      >
                        <Text style={[styles.sortPillSmText, feedSort === 'popular' && styles.sortPillSmTextActive]}>
                          Popular
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
              </ScrollView>
            ) : null}
            </View>
            ) : null}
            <TouchableOpacity
              style={[
                styles.homeFilterBtn,
                (showCalendarModal ||
                  !!upcomingDateFilter ||
                  guestPostTypeDateFilterActive ||
                  loggedInPostTypeDateFilterActive) &&
                  styles.homeFilterBtnActive,
              ]}
              onPress={openCalendarFilter}
              accessibilityLabel="Upcoming news by date"
            >
              {showCalendarModal ||
              upcomingDateFilter ||
              guestPostTypeDateFilterActive ||
              loggedInPostTypeDateFilterActive ? (
                <CalendarEventFillIcon width={24} height={24} fill="#087990" />
              ) : (
                <CalendarEventIcon width={24} height={24} fill="#6c757d" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeFilterBtn}
              onPress={openSearch}
              accessibilityLabel="Search"
            >
              <SearchIcon width={24} height={24} fill="#6c757d" />
            </TouchableOpacity>
          </View>
        ) : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: MAIN_TAB_BAR_BODY_HEIGHT + insets.bottom }]}
      edges={['top']}
    >
      {!user ? (
        <View style={styles.guestHomeHeader}>
          <GuestSignInStrip onSignInPress={openGuestLogin} />
          {renderSchoolFilterBadge('guestHeader')}
          {homeFilterRow}
        </View>
      ) : (
        <>
          <View style={styles.homeStickyHeader}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tab}
              onPress={switchToMySchool}
              accessibilityRole="tab"
              accessibilityState={{ selected: homeFeedMode === 'mySchool' }}
            >
              <View
                style={[
                  styles.tabPill,
                  homeFeedMode === 'mySchool' ? styles.tabPillMySchoolActive : styles.tabPillOutlineDark,
                ]}
              >
                <SchoolLogo
                  school={mySchoolTabSchool}
                  size={22}
                  borderRadius={11}
                  style={styles.tabSchoolLogoWrap}
                />
                <Text
                  style={[
                    styles.tabText,
                    homeFeedMode === 'mySchool' ? styles.tabTextMySchoolActive : styles.tabTextOutlineDark,
                  ]}
                  numberOfLines={1}
                >
                  My school
                </Text>
              </View>
            </TouchableOpacity>
            {schoolExternalEnabled ? (
              <TouchableOpacity
                style={styles.tab}
                onPress={switchToExternal}
                accessibilityRole="tab"
                accessibilityState={{ selected: homeFeedMode === 'external' }}
              >
                <View
                  style={[
                    styles.tabPill,
                    homeFeedMode === 'external' ? styles.tabPillExternalActive : styles.tabPillOutlineDark,
                  ]}
                >
                  <View style={styles.tabSchoolLogoFallback}>
                    <Ionicons
                      name="log-in-outline"
                      size={14}
                      color={homeFeedMode === 'external' ? authModalTheme.primaryDark : '#1a1f2e'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabText,
                      homeFeedMode === 'external' ? styles.tabTextExternalActive : styles.tabTextOutlineDark,
                    ]}
                  >
                    External
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.tab}
                onPress={switchToAllSchools}
                accessibilityRole="tab"
                accessibilityState={{ selected: showAllSchools }}
              >
                <View
                  style={[
                    styles.tabPill,
                    showAllSchools ? styles.tabPillExternalActive : styles.tabPillOutlineDark,
                  ]}
                >
                  <View style={styles.tabSchoolLogoFallback}>
                    <BuildingIcon
                      width={14}
                      height={14}
                      fill={showAllSchools ? authModalTheme.primaryDark : '#1a1f2e'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabText,
                      showAllSchools ? styles.tabTextExternalActive : styles.tabTextOutlineDark,
                    ]}
                  >
                    All schools
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          {!showExternalHomeFeed ? homeFilterRow : null}
          </View>
        </>
      )}

      {user && loggedInPostTypeDateFilterActive ? (
        <View style={styles.activeDateFilterBar}>
          <Text style={styles.activeDateFilterText} numberOfLines={3}>
            {loggedInFeedPostTypeFilter === 'event' ? 'Event date' : 'Posted date'} ·{' '}
            {formatUpcomingHeader(loggedInFeedDateFilter!)}
            {loggedInCalendarSchoolName ? ` · ${loggedInCalendarSchoolName}` : ''}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLoggedInFeedDateFilter(null);
              setLoggedInFeedPostTypeFilter(null);
              setLoggedInCalendarSchoolId(null);
            }}
            hitSlop={8}
          >
            <Text style={styles.guestSchoolChipAction}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {guestPostTypeDateFilterActive ? (
        <View style={styles.guestDateFilterBlock}>
          <View style={styles.activeDateFilterBar}>
            <Text style={styles.activeDateFilterText} numberOfLines={2}>
              {guestFeedPostTypeFilter === 'event' ? 'Event date' : 'Posted date'} ·{' '}
              {formatUpcomingHeader(guestFeedDateFilter!)}
            </Text>
            <TouchableOpacity onPress={clearGuestDateFilter} hitSlop={8}>
              <Text style={styles.guestSchoolChipAction}>Clear</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.guestDateFilterSignInHint}>
            Sign in to filter news by your selected school and use more filters.
          </Text>
        </View>
      ) : null}

      {isMySchoolFeed && showSchoolFilterUi && selectedSubCategoryMeta.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedSubCatScroll}
          contentContainerStyle={styles.selectedSubCatRow}
        >
          {selectedSubCategoryMeta.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.selectedSubCatPill}
              onPress={() => toggleSubCategory(sub.id)}
              activeOpacity={0.85}
              accessibilityLabel={`Remove ${sub.name}`}
            >
              <Text style={styles.selectedSubCatPillText}>{sub.name}</Text>
              <View style={styles.selectedSubCatCloseBadge}>
                <Text style={styles.selectedSubCatCloseText}>×</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {selectedUpcomingPost ? (
        <ScrollView style={styles.upcomingDetailScroll} contentContainerStyle={styles.upcomingDetailContent}>
          <View style={styles.upcomingDetailHeader}>
            <View style={styles.upcomingDetailSchoolRow}>
              <SchoolLogo school={selectedUpcomingPost.school} size={40} borderRadius={20} />
              <View style={styles.upcomingDetailSchoolText}>
                <Text style={styles.upcomingDetailSchoolName}>
                  {selectedUpcomingPost.school?.name ?? 'School'}
                </Text>
                <Text style={styles.upcomingDetailSubCat}>
                  {selectedUpcomingPost.subCategory?.name ?? 'News'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedUpcomingPost(null)} style={styles.upcomingDetailCloseBtn}>
              <Text style={styles.upcomingDetailCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingBadgeWrap}>
            <View style={styles.upcomingBadgePill}>
              <Text style={styles.upcomingBadgeText}>Upcoming</Text>
            </View>
          </View>
          {parseImageUrls(selectedUpcomingPost.imageUrls)[0] ? (
            <Image
              source={{ uri: imageSrc(parseImageUrls(selectedUpcomingPost.imageUrls)[0]) }}
              style={styles.upcomingDetailImage}
            />
          ) : null}
          <Text style={styles.upcomingDetailTitle}>{selectedUpcomingPost.title}</Text>
          {selectedUpcomingPost.description ? (
            <Text style={styles.upcomingDetailDesc}>{selectedUpcomingPost.description}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.addToCalBtn}
            onPress={() => addUpcomingToGoogleCalendar(selectedUpcomingPost)}
          >
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.addToCalBtnText}>Add to Google Calendar</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : upcomingDateFilter ? (
        calendarHasPosted ? (
          <View style={styles.calendarPostedHost}>
            <View style={styles.calendarPostedHeaderWrap}>
              {calendarHeaderRow}
              {calendarExtrasCount > 0 ? (
                <TouchableOpacity
                  style={styles.calendarExtrasBtn}
                  onPress={() => setCalendarExtrasModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar-outline" size={16} color="#087990" />
                  <Text style={styles.calendarExtrasBtnText}>
                    Scheduled & upcoming ({calendarExtrasCount})
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {upcomingLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a1f2e" />
                <Text style={styles.calendarLoadingText}>Loading news for this date…</Text>
              </View>
            ) : (
              <View
                style={styles.inshortsFeedHost}
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h > 0 && Math.abs(h - calendarFeedListHeight) > 1) setCalendarFeedListHeight(h);
                }}
              >
                {calendarFeedPageHeight > 0 ? (
                  <InshortsPagedFeed
                    key={`calendar-${upcomingDateFilter}-${calendarFilterSchoolId ?? ''}`}
                    feedItems={calendarFeedItems}
                    pageHeight={calendarFeedPageHeight}
                    onRefresh={refreshCalendarFeed}
                    refreshing={upcomingLoading}
                    userId={user?.id ?? null}
                    getEventEngagement={getCalendarEventEngagement}
                    onLike={onCalendarLike}
                    onSave={onCalendarSave}
                    onCommentAdded={onCalendarCommentAdded}
                    onBannerClick={onBannerAdPress}
                  />
                ) : (
                  <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1a1f2e" />
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <ScrollView
            style={styles.upcomingFeedScroll}
            contentContainerStyle={styles.upcomingFeedContent}
            refreshControl={<RefreshControl refreshing={upcomingLoading} onRefresh={refreshCalendarFeed} />}
          >
            {calendarHeaderRow}
            {upcomingLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a1f2e" />
                <Text style={styles.calendarLoadingText}>Loading news for this date…</Text>
              </View>
            ) : calendarScheduledEvents.length === 0 && upcomingPosts.length === 0 ? (
              <Text style={styles.upcomingEmpty}>
                {calendarFilterSchoolName
                  ? `No posted, scheduled, or upcoming news for ${calendarFilterSchoolName} on this date.`
                  : 'No news for this date.'}
              </Text>
            ) : (
              renderCalendarExtrasSections()
            )}
          </ScrollView>
        )
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!upcomingDateFilter && !selectedUpcomingPost ? (
        <View style={styles.feedWithFilterColumn}>
          {!showExternalHomeFeed ? renderSchoolFilterBadge('feed') : null}
          {showExternalHomeFeed && user ? (
            <View
              style={styles.inshortsFeedHost}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && Math.abs(h - feedListHeight) > 1) setFeedListHeight(h);
              }}
            >
              {feedPageHeight > 0 ? (
                <ExternalPublicFeedPanel pageHeight={feedPageHeight} />
              ) : (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#1a1f2e" />
                </View>
              )}
            </View>
          ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : feedItems.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyFeedScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyFeedCard}>
            <View style={styles.emptyFeedIconWrap}>
              <NewspaperIcon width={40} height={40} fill="#6c757d" />
            </View>
            <Text style={styles.emptyFeedPrimary}>
              {isSchoolScopedFeed
                ? 'No approved news for this school yet.'
                : 'No approved news yet.'}
            </Text>
            {isSchoolScopedFeed ? (
              <TouchableOpacity onPress={openSchoolEmptyMessage} style={styles.emptyFeedViewMsg}>
                <Text style={styles.emptyFeedViewMsgText}>View message</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.emptyFeedSecondary}>
                  <Text style={styles.emptyFeedStrong}>Approved</Text>
                  {' '}
                  news from schools appears here after category admin approval.
                </Text>
                {!user ? (
                  <Text style={styles.emptyFeedSecondary}>
                    Sign in or register with your school to like, comment, and save.
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <View
          key={showAllSchools ? 'feed-all-schools' : 'feed-my-school'}
          style={styles.inshortsFeedHost}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - feedListHeight) > 1) setFeedListHeight(h);
          }}
        >
          {feedPageHeight > 0 ? (
            <InshortsPagedFeed
              key={showAllSchools ? 'inshorts-all' : 'inshorts-my'}
              feedItems={feedItems}
              pageHeight={feedPageHeight}
              alignTop
              onRefresh={onRefresh}
              refreshing={refreshing}
              userId={user?.id ?? null}
              getEventEngagement={getEventEngagement}
              onLike={onInshortsLike}
              onSave={onInshortsSave}
              onCommentAdded={onInshortsCommentAdded}
              onBannerClick={onBannerAdPress}
              initialEventId={focusEventId}
            />
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#1a1f2e" />
            </View>
          )}
        </View>
      )}
        </View>
      ) : null}

      {calendarExtrasModalVisible ? (
        <Modal
          visible
          animationType="slide"
          transparent
          onRequestClose={() => setCalendarExtrasModalVisible(false)}
        >
          <Pressable style={styles.schoolPickerOverlay} onPress={() => setCalendarExtrasModalVisible(false)}>
            <Pressable style={styles.schoolPickerContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.schoolPickerHeader}>
                <Text style={styles.schoolPickerTitle}>More on this date</Text>
                <TouchableOpacity onPress={() => setCalendarExtrasModalVisible(false)}>
                  <Text style={styles.schoolPickerClose}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.schoolPickerList} contentContainerStyle={styles.upcomingFeedContent}>
                {renderCalendarExtrasSections()}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {guestSchoolModalVisible ? (
        <Modal visible animationType="slide" transparent onRequestClose={() => setGuestSchoolModalVisible(false)}>
          <Pressable style={styles.schoolPickerOverlay} onPress={() => setGuestSchoolModalVisible(false)}>
            <Pressable style={styles.schoolPickerContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.schoolPickerHeader}>
                <Text style={styles.schoolPickerTitle}>Select a school</Text>
                <TouchableOpacity onPress={() => setGuestSchoolModalVisible(false)}>
                  <Text style={styles.schoolPickerClose}>Close</Text>
                </TouchableOpacity>
              </View>
              {(schoolPickerTarget === 'guest' ? guestSchoolId : allSchoolsFilterSchoolId) ? (
                <TouchableOpacity
                  style={styles.schoolPickerShowAll}
                  onPress={schoolPickerTarget === 'guest' ? clearGuestSchoolFilter : clearAllSchoolsFilter}
                >
                  <Text style={styles.guestSchoolChipAction}>
                    {schoolPickerTarget === 'allSchools' ? 'All schools' : 'Clear filter'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {guestSchoolsLoading ? (
                <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 24 }} />
              ) : guestSchools.length === 0 ? (
                <Text style={styles.schoolPickerEmpty}>No schools found.</Text>
              ) : (
                <ScrollView style={styles.schoolPickerList}>
                  {guestSchools.map((s) => {
                    const isSelected = schoolPickerTarget === 'allSchools'
                      ? allSchoolsFilterSchoolId === s.id
                      : guestSchoolId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.schoolPickerItem, isSelected && styles.schoolPickerItemSelected]}
                        onPress={() => (
                          schoolPickerTarget === 'allSchools'
                            ? selectAllSchoolsFilterSchool(s.id)
                            : selectGuestSchool(s.id)
                        )}
                        activeOpacity={0.85}
                      >
                        {s.image ? (
                          <Image source={{ uri: imageSrc(s.image) }} style={styles.schoolPickerLogo} />
                        ) : (
                          <View style={styles.schoolPickerLogoPlaceholder}>
                            <Text style={styles.schoolPickerLogoLetter}>{s.name?.charAt(0) ?? '?'}</Text>
                          </View>
                        )}
                        <Text style={styles.schoolPickerName}>{s.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showCalendarModal ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closeCalendarModal}
        >
          <Pressable style={styles.calendarModalOverlay} onPress={closeCalendarModal}>
            <Pressable style={styles.calendarModalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.calendarModalTitle}>
                  {!user
                    ? calendarGuestAppliedMessage
                      ? 'Filter applied'
                      : 'Filter by date'
                    : 'Filter by date'}
                </Text>
                <TouchableOpacity onPress={closeCalendarModal} hitSlop={12} accessibilityLabel="Close">
                  <Ionicons name="close" size={22} color="#6c757d" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.calendarModalScroll}
                contentContainerStyle={styles.calendarModalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {!user && calendarGuestAppliedMessage ? (
                  <View style={styles.calendarGuestAppliedBlock}>
                    <Text style={styles.calendarGuestAppliedLead}>
                      Showing news by{' '}
                      {calendarModalPostTypeDraft === 'event' ? 'event date' : 'posted date'} for{' '}
                      {formatUpcomingHeader(toYmd(calendarDraftDate))}.
                    </Text>
                    <Text style={styles.calendarGuestAppliedHint}>
                      Sign in to filter news by your selected school and access more filter options.
                    </Text>
                    <TouchableOpacity
                      style={styles.calendarApplyFilterBtn}
                      onPress={closeCalendarModal}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.calendarApplyFilterBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : !user ? (
                  <>
                    <Text style={styles.calendarModalSubtitle}>
                      {calendarModalPostTypeDraft
                        ? 'Pick a day for your filter.'
                        : 'Choose how you want to filter news by date.'}
                    </Text>
                    <View style={styles.calendarGuestPostTypeColumn}>
                      <TouchableOpacity
                        style={[
                          styles.calendarGuestPostTypeBadge,
                          calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeBadgeActive,
                        ]}
                        onPress={() => setCalendarModalPostTypeDraft('event')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.calendarGuestPostTypeBadgeText,
                            calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeBadgeTextActive,
                          ]}
                        >
                          Filter via event date
                        </Text>
                        <Text
                          style={[
                            styles.calendarGuestPostTypeHint,
                            calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeHintActive,
                          ]}
                        >
                          Uses the event date fields set when the news was posted.
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.calendarGuestPostTypeBadge,
                          calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeBadgeActive,
                        ]}
                        onPress={() => setCalendarModalPostTypeDraft('posted')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.calendarGuestPostTypeBadgeText,
                            calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeBadgeTextActive,
                          ]}
                        >
                          Filter via posted date
                        </Text>
                        <Text
                          style={[
                            styles.calendarGuestPostTypeHint,
                            calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeHintActive,
                          ]}
                        >
                          Shows news that was posted on the selected day.
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {calendarModalPostTypeDraft ? (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setCalendarModalPostTypeDraft(null);
                            setShowNativeDatePicker(Platform.OS === 'ios');
                          }}
                          style={styles.calendarChangeDateLink}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="arrow-back" size={16} color={authModalTheme.primary} />
                          <Text style={styles.calendarChangeDateLinkText}>Change filter type</Text>
                        </TouchableOpacity>

                        <View style={styles.calendarQuickPickRow}>
                          <TouchableOpacity
                            style={[
                              styles.calendarQuickPill,
                              isSameCalendarDay(calendarDraftDate, new Date()) && styles.calendarQuickPillActive,
                            ]}
                            onPress={() => setCalendarDraftDate(new Date())}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.calendarQuickPillText,
                                isSameCalendarDay(calendarDraftDate, new Date()) && styles.calendarQuickPillTextActive,
                              ]}
                            >
                              Today
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.calendarQuickPill,
                              isSameCalendarDay(calendarDraftDate, getTomorrowDate()) &&
                                styles.calendarQuickPillActive,
                            ]}
                            onPress={() => setCalendarDraftDate(getTomorrowDate())}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.calendarQuickPillText,
                                isSameCalendarDay(calendarDraftDate, getTomorrowDate()) &&
                                  styles.calendarQuickPillTextActive,
                              ]}
                            >
                              Tomorrow
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.calendarSelectedDateRow}>
                          <Ionicons name="calendar-outline" size={17} color={authModalTheme.primary} />
                          <Text style={styles.calendarSelectedDateText} numberOfLines={2}>
                            {formatCalendarDraftLabel(calendarDraftDate)}
                          </Text>
                        </View>

                        <View style={styles.calendarPickerCard}>
                          {calendarMarkersLoading ? (
                            <ActivityIndicator
                              size="small"
                              color="#1a1f2e"
                              style={styles.calendarMarkersLoading}
                            />
                          ) : null}
                          <FeedCalendarMonthGrid
                            variant="guest"
                            visibleMonth={calendarVisibleMonth}
                            selectedDate={calendarDraftDate}
                            markedDates={calendarMarkedDates}
                            onSelectDate={(date) => {
                              setCalendarDraftDate(date);
                              setCalendarVisibleMonth(
                                new Date(date.getFullYear(), date.getMonth(), 1),
                              );
                            }}
                            onChangeMonth={(next) => setCalendarVisibleMonth(next)}
                          />
                        </View>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.calendarModalSubtitle}>
                      {calendarModalPostTypeDraft
                        ? 'Choose a school, then pick a day.'
                        : 'Choose how you want to filter news by date.'}
                    </Text>
                    <View style={styles.calendarGuestPostTypeColumn}>
                      <TouchableOpacity
                        style={[
                          styles.calendarGuestPostTypeBadge,
                          calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeBadgeActive,
                        ]}
                        onPress={() => setCalendarModalPostTypeDraft('event')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.calendarGuestPostTypeBadgeText,
                            calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeBadgeTextActive,
                          ]}
                        >
                          Filter via event date
                        </Text>
                        <Text
                          style={[
                            styles.calendarGuestPostTypeHint,
                            calendarModalPostTypeDraft === 'event' && styles.calendarGuestPostTypeHintActive,
                          ]}
                        >
                          Uses the event date fields set when the news was posted.
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.calendarGuestPostTypeBadge,
                          calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeBadgeActive,
                        ]}
                        onPress={() => setCalendarModalPostTypeDraft('posted')}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.calendarGuestPostTypeBadgeText,
                            calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeBadgeTextActive,
                          ]}
                        >
                          Filter via posted date
                        </Text>
                        <Text
                          style={[
                            styles.calendarGuestPostTypeHint,
                            calendarModalPostTypeDraft === 'posted' && styles.calendarGuestPostTypeHintActive,
                          ]}
                        >
                          Shows news that was posted on the selected day.
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {calendarModalPostTypeDraft ? (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setCalendarModalPostTypeDraft(null);
                            setCalendarSchoolPickerOpen(false);
                          }}
                          style={styles.calendarChangeDateLink}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="arrow-back" size={16} color={authModalTheme.primary} />
                          <Text style={styles.calendarChangeDateLinkText}>Change filter type</Text>
                        </TouchableOpacity>

                        <Text style={styles.calendarModalSchoolLabel}>School</Text>
                        <TouchableOpacity
                          style={[
                            styles.calendarModalSchoolBtn,
                            calendarModalSchoolDraft ? styles.calendarModalSchoolBtnActive : null,
                          ]}
                          onPress={() => setCalendarSchoolPickerOpen((open) => !open)}
                          activeOpacity={0.85}
                        >
                          <BuildingIcon width={16} height={16} fill="#14532D" />
                          <Text style={styles.calendarModalSchoolBtnText} numberOfLines={1}>
                            {calendarModalSchoolName ?? 'Select school'}
                          </Text>
                          <Ionicons
                            name={calendarSchoolPickerOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#6c757d"
                          />
                        </TouchableOpacity>
                        {calendarSchoolPickerOpen ? (
                          guestSchoolsLoading ? (
                            <ActivityIndicator size="small" color="#1a1f2e" style={styles.calendarSchoolLoading} />
                          ) : (
                            <View style={styles.calendarSchoolListCard}>
                              {guestSchools.map((s) => {
                                const selected = calendarModalSchoolDraft === s.id;
                                return (
                                  <TouchableOpacity
                                    key={s.id}
                                    style={[
                                      styles.calendarSchoolRow,
                                      selected && styles.calendarSchoolRowSelected,
                                    ]}
                                    onPress={() => {
                                      setCalendarModalSchoolDraft(s.id);
                                      setCalendarSchoolPickerOpen(false);
                                    }}
                                    activeOpacity={0.85}
                                  >
                                    {s.image ? (
                                      <Image source={{ uri: imageSrc(s.image) }} style={styles.schoolPickerLogo} />
                                    ) : (
                                      <View style={styles.schoolPickerLogoPlaceholder}>
                                        <Text style={styles.schoolPickerLogoLetter}>
                                          {s.name?.charAt(0) ?? '?'}
                                        </Text>
                                      </View>
                                    )}
                                    <Text style={styles.schoolPickerName} numberOfLines={2}>
                                      {s.name}
                                    </Text>
                                    {selected ? (
                                      <Ionicons name="checkmark-circle" size={20} color={authModalTheme.successDark} />
                                    ) : (
                                      <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )
                        ) : null}

                        <View style={styles.calendarQuickPickRow}>
                          <TouchableOpacity
                            style={[
                              styles.calendarQuickPill,
                              isSameCalendarDay(calendarDraftDate, new Date()) && styles.calendarQuickPillActive,
                            ]}
                            onPress={() => setCalendarDraftDate(new Date())}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.calendarQuickPillText,
                                isSameCalendarDay(calendarDraftDate, new Date()) && styles.calendarQuickPillTextActive,
                              ]}
                            >
                              Today
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.calendarQuickPill,
                              isSameCalendarDay(calendarDraftDate, getTomorrowDate()) &&
                                styles.calendarQuickPillActive,
                            ]}
                            onPress={() => setCalendarDraftDate(getTomorrowDate())}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.calendarQuickPillText,
                                isSameCalendarDay(calendarDraftDate, getTomorrowDate()) &&
                                  styles.calendarQuickPillTextActive,
                              ]}
                            >
                              Tomorrow
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.calendarSelectedDateRow}>
                          <Ionicons name="calendar-outline" size={17} color={authModalTheme.primary} />
                          <Text style={styles.calendarSelectedDateText} numberOfLines={2}>
                            {formatCalendarDraftLabel(calendarDraftDate)}
                          </Text>
                        </View>

                        <View style={styles.calendarPickerCard}>
                          {calendarMarkersLoading ? (
                            <ActivityIndicator
                              size="small"
                              color="#1a1f2e"
                              style={styles.calendarMarkersLoading}
                            />
                          ) : null}
                          {!calendarModalSchoolDraft ? (
                            <Text style={styles.calendarMarkersHint}>
                              Select a school to highlight days with news on the calendar.
                            </Text>
                          ) : null}
                          <FeedCalendarMonthGrid
                            variant="loggedIn"
                            visibleMonth={calendarVisibleMonth}
                            selectedDate={calendarDraftDate}
                            markedDates={calendarMarkedDates}
                            onSelectDate={(date) => {
                              setCalendarDraftDate(date);
                              setCalendarVisibleMonth(
                                new Date(date.getFullYear(), date.getMonth(), 1),
                              );
                            }}
                            onChangeMonth={(next) => setCalendarVisibleMonth(next)}
                          />
                        </View>
                      </>
                    ) : null}
                  </>
                )}
              </ScrollView>

              {!user && !calendarGuestAppliedMessage && calendarModalPostTypeDraft ? (
                <View style={styles.calendarModalFooter}>
                  <TouchableOpacity
                    style={styles.calendarApplyFilterBtn}
                    onPress={applyGuestCalendarFilter}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.calendarApplyFilterBtnText}>Apply filter</Text>
                  </TouchableOpacity>
                </View>
              ) : user && calendarModalPostTypeDraft && calendarModalSchoolDraft ? (
                <View style={styles.calendarModalFooter}>
                  <TouchableOpacity
                    style={styles.calendarApplyFilterBtn}
                    onPress={applyLoggedInCalendarFilter}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.calendarApplyFilterBtnText}>Apply filter</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Subcategory dropdown — unmount when closed so iOS does not keep a stale touch layer (iPad). */}
      {!!expandedCategory && showCategories ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setExpandedCategoryId(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setExpandedCategoryId(null)}>
            <Pressable style={styles.subCatDropdownBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.subCatDropdownHeader}>{expandedCategory.name}</Text>
              {(expandedCategory.subcategories ?? []).length === 0 ? (
                <Text style={styles.subCatDropdownEmpty}>No subcategories</Text>
              ) : (
                <ScrollView
                  style={styles.subCatDropdownScroll}
                  contentContainerStyle={styles.subCatDropdownScrollContent}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.subCatDropdownPillRow}>
                    {(expandedCategory.subcategories ?? []).map((sub) => {
                      const checked = selectedSubCategoryIds.includes(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[
                            styles.subCatDropdownPill,
                            checked ? styles.subCatDropdownPillOn : styles.subCatDropdownPillOff,
                          ]}
                          onPress={() => toggleSubCategory(sub.id)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.subCatDropdownPillText,
                              checked && styles.subCatDropdownPillTextOn,
                            ]}
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showFirstLoginCategories && !!user?.schoolId && prefsLoaded ? (
        <FirstLoginCategoriesModal
          visible
          categories={categories}
          categoriesLoading={categoriesLoading}
          selectedSubCategoryIds={categoryModalSelectedIds}
          saving={categoryModalSaving}
          onToggleSubCategory={toggleCategoryModalSub}
          onSkip={() => saveCategorySelectionMobile(true)}
          onNext={() => saveCategorySelectionMobile(false)}
        />
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  guestHomeHeader: {
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  guestHomeFilterRow: {
    borderBottomWidth: 0,
    paddingTop: 2,
    paddingBottom: 4,
  },
  guestSchoolSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 1,
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7D9B4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#DDFBE2',
  },
  guestSchoolSelectBtnActive: {
    backgroundColor: '#C6F6D5',
    borderColor: '#86D9A0',
  },
  guestSchoolSelectBtnText: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  guestSchoolSelectBtnTextActive: {
    color: '#14532D',
    fontWeight: '600',
  },
  calendarSchoolHint: {
    fontSize: 13,
    color: '#6c757d',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  calendarBackBtn: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  guestSchoolFilterBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  guestSchoolFilterBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  guestSchoolFilterStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  /** Match web `btn-sm rounded-pill btn-outline-dark` / `btn-dark` guest school pills */
  guestSchoolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#343a40',
    backgroundColor: 'transparent',
    maxWidth: 180,
  },
  guestSchoolPillPlain: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  guestSchoolPillWithLogo: {
    paddingLeft: 7,
    paddingRight: 10,
    paddingVertical: 6,
    gap: 8,
  },
  guestSchoolPillActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  guestSchoolPillText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#212529',
    flexShrink: 1,
  },
  guestSchoolPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  guestSchoolStripLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    flexShrink: 0,
  },
  guestSchoolStripLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(26,31,46,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestSchoolStripLogoFallbackActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  guestSchoolStripLogoLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  guestSchoolStripLogoLetterActive: {
    color: '#fff',
  },
  guestSchoolStripLoadingText: {
    fontSize: 13,
    color: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  homeStickyHeader: {
    flexShrink: 0,
    zIndex: 30,
    backgroundColor: 'transparent',
  },
  loggedInHomeFilterRow: {
    paddingTop: 10,
  },
  homeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingRight: 10,
    paddingLeft: 10,
    paddingVertical: 6,
    zIndex: 20,
  },
  homeFilterRowSpacer: {
    flex: 1,
    minWidth: 8,
  },
  homeFilterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    gap: 2,
  },
  filterFunnelWrap: {
    position: 'relative',
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortDropdownScroll: {
    position: 'absolute',
    top: 42,
    right: 0,
    maxHeight: 420,
    minWidth: 260,
    zIndex: 1050,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  sortDropdownScrollContent: {
    flexGrow: 0,
  },
  activeDateFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  guestDateFilterBlock: {
    paddingBottom: 4,
  },
  guestDateFilterSignInHint: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6c757d',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  feedWithFilterColumn: {
    flex: 1,
    minHeight: 0,
  },
  schoolFilterAboveFeed: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 4,
  },
  schoolFilterAboveFeedGuestHeader: {
    paddingTop: 6,
    paddingBottom: 2,
    marginTop: -2,
  },
  schoolFilterBrowseContext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
  },
  schoolFilterBadgeLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#eef1f6',
  },
  schoolFilterClearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    maxWidth: '100%',
    backgroundColor: '#d1e7dd',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86D9A0',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 10,
  },
  schoolFilterClearBadgeLabel: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#14532D',
  },
  schoolFilterClearBadgeClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 81, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolFilterClearBadgeCloseText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
    color: '#0f5132',
    marginTop: -1,
  },
  schoolFilterAboveFeedHint: {
    fontSize: 12,
    color: '#6c757d',
    paddingLeft: 2,
  },
  activeDateFilterText: {
    flex: 1,
    fontSize: 12,
    color: '#6c757d',
  },
  homeFilterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  homeFilterBtnActive: {
    backgroundColor: 'rgba(13, 202, 240, 0.15)',
  },
  sortDropdown: {
    minWidth: 260,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e9f0',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  sortDropdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dee2e6',
  },
  sortDropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sortDropdownClose: {
    fontSize: 18,
    color: '#6c757d',
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  sortDropdownSubLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  sortDropdownSchoolLabel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dee2e6',
    marginTop: 8,
    paddingTop: 8,
  },
  sortDropdownHint: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 16,
  },
  loggedInDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  postTypeBadgeColumn: {
    gap: 8,
    marginBottom: 8,
  },
  postTypeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  postTypeBadgeActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  postTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
  },
  postTypeBadgeTextActive: {
    color: '#fff',
  },
  loggedInDateQuickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#212529',
  },
  loggedInDateQuickBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212529',
  },
  guestSchoolFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignSelf: 'flex-start',
  },
  guestSchoolFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  guestSchoolChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  guestSchoolChipLabel: {
    fontSize: 13,
    color: '#6c757d',
  },
  guestSchoolBadge: {
    backgroundColor: '#212529',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '46%',
  },
  guestSchoolBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  guestSchoolChipAction: {
    fontSize: 13,
    color: '#087990',
    fontWeight: '500',
  },
  guestSchoolChipDot: {
    fontSize: 13,
    color: '#adb5bd',
  },
  schoolPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  schoolPickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  schoolPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  schoolPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  schoolPickerClose: {
    fontSize: 15,
    color: '#6c757d',
  },
  schoolPickerShowAll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  schoolPickerEmpty: {
    textAlign: 'center',
    color: '#8e8e8e',
    paddingVertical: 24,
  },
  schoolPickerList: {
    padding: 16,
  },
  schoolPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  schoolPickerItemSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  schoolPickerLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  schoolPickerLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(26,31,46,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolPickerLogoLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  schoolPickerName: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
    flex: 1,
  },
  sortPillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortPillSm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: 'transparent',
  },
  sortPillSmActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  sortPillSmText: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '500',
  },
  sortPillSmTextActive: {
    color: '#fff',
  },
  clearCatsBtn: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  clearCatsText: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '600',
  },
  /** Web `btn-sm rounded-pill btn-outline-dark` category chip */
  categoryMainPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#343a40',
    backgroundColor: 'transparent',
    marginRight: 8,
    maxWidth: 260,
  },
  categoryMainPillEmphasis: {
    borderColor: '#212529',
  },
  categoryMainPillText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '400',
  },
  categoryMainPillTextEmphasis: {
    fontWeight: '600',
  },
  inlineSortPillActive: {
    borderColor: '#212529',
    backgroundColor: '#212529',
  },
  inlineSortPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  subCatDropdownBox: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(208,220,243,0.9)',
    width: '100%',
    maxWidth: 340,
    maxHeight: '78%',
    paddingVertical: 12,
    shadowColor: '#1f4da8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 14,
  },
  subCatDropdownHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0b1f3f',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(176,190,215,0.5)',
  },
  subCatDropdownScroll: {
    maxHeight: 360,
  },
  subCatDropdownScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subCatDropdownEmpty: {
    fontSize: 13,
    color: '#0f2b52',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  subCatDropdownPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCatDropdownPill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  subCatDropdownPillOff: {
    borderColor: '#cfe2ff',
    backgroundColor: '#f4f8fc',
  },
  subCatDropdownPillOn: {
    borderColor: '#86D9A0',
    backgroundColor: '#DDFBE2',
  },
  subCatDropdownPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  subCatDropdownPillTextOn: {
    fontWeight: '700',
    color: '#0f5132',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(11,31,63,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  checkboxOn: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  selectedSubCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  selectedSubCatScroll: {
    backgroundColor: '#fff',
    flexGrow: 0,
    flexShrink: 0,
  },
  selectedSubCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: '#212529',
  },
  selectedSubCatPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedSubCatCloseBadge: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSubCatCloseText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 14,
  },
  emptyFeedScroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  emptyFeedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 36,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  emptyFeedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyFeedPrimary: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'left',
    width: '100%',
  },
  emptyFeedSecondary: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 20,
    textAlign: 'left',
    marginTop: 12,
    width: '100%',
  },
  emptyFeedStrong: {
    fontWeight: '700',
    color: '#6c757d',
  },
  emptyFeedLink: {
    fontSize: 13,
    color: '#0d6efd',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emptyFeedViewMsg: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  emptyFeedViewMsgText: {
    fontSize: 14,
    color: '#0d6efd',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignSelf: 'stretch',
  },
  tabPill: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  tabPillOutlineDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  tabPillMySchoolActive: {
    backgroundColor: authModalTheme.successLight,
  },
  tabPillExternalActive: {
    backgroundColor: authModalTheme.primaryLight,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabSchoolLogoWrap: {
    backgroundColor: '#fff',
  },
  tabSchoolLogo: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  tabSchoolLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSchoolLogoFallbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextMySchoolActive: {
    color: authModalTheme.successDark,
    fontWeight: '700',
  },
  tabTextExternalActive: {
    color: authModalTheme.primaryDark,
    fontWeight: '700',
  },
  tabTextOutlineDark: {
    color: '#1a1f2e',
    fontWeight: '600',
    opacity: 0.88,
  },
  tabTextInactive: {
    color: '#8e8e8e',
  },
  tabUnderline: {
    width: '70%',
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 4,
  },
  categoriesStrip: {
    minHeight: 50,
    backgroundColor: 'transparent',
    flex: 1,
    minWidth: 0,
  },
  categoriesStripContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#343a40',
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#1a1f2e',
    borderColor: '#1a1f2e',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  categoryFilterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 10,
    alignItems: 'center',
  },
  calendarIconBtn: {
    padding: 8,
    marginRight: 4,
  },
  calendarIconBtnActive: {
    backgroundColor: 'rgba(13, 202, 240, 0.2)',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarModalSheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    flexDirection: 'column',
    backgroundColor: authModalTheme.loginPanelBg,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  },
  calendarModalScroll: {
    flexShrink: 1,
  },
  calendarModalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  calendarModalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6c757d',
    marginBottom: 14,
  },
  calendarQuickPickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  calendarQuickPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: authModalTheme.pillRadius,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  calendarQuickPillActive: {
    backgroundColor: authModalTheme.primaryLight,
    borderColor: authModalTheme.primary,
  },
  calendarQuickPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  calendarQuickPillTextActive: {
    color: authModalTheme.primaryDark,
    fontWeight: '600',
  },
  calendarSelectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: authModalTheme.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(52, 104, 249, 0.35)',
  },
  calendarSelectedDateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: authModalTheme.primaryDark,
  },
  calendarPickerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
    overflow: 'hidden',
  },
  calendarPickerIosHost: {
    height: 328,
    justifyContent: 'center',
  },
  calendarAndroidDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  calendarAndroidDateBtnLabel: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  calendarAndroidDateBtnValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  calendarModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: authModalTheme.loginPanelBg,
  },
  calendarNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: authModalTheme.primaryLight,
    borderWidth: 1,
    borderColor: authModalTheme.primary,
    borderRadius: authModalTheme.pillRadius,
    paddingVertical: 14,
  },
  calendarNextBtnText: {
    color: authModalTheme.primaryDark,
    fontSize: 15,
    fontWeight: '600',
  },
  calendarGuestPostTypeColumn: {
    gap: 10,
    marginBottom: 14,
  },
  calendarGuestPostTypeBadge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  calendarGuestPostTypeBadgeActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  calendarGuestPostTypeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  calendarGuestPostTypeBadgeTextActive: {
    color: '#fff',
  },
  calendarGuestPostTypeHint: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6c757d',
  },
  calendarGuestPostTypeHintActive: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  calendarApplyFilterBtn: {
    backgroundColor: '#212529',
    borderRadius: authModalTheme.pillRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  calendarApplyFilterBtnDisabled: {
    opacity: 0.45,
  },
  calendarApplyFilterBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  calendarGuestAppliedBlock: {
    gap: 14,
    paddingBottom: 8,
  },
  calendarGuestAppliedLead: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  calendarGuestAppliedHint: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6c757d',
  },
  calendarSchoolStepDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: authModalTheme.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(52, 104, 249, 0.35)',
    marginBottom: 10,
  },
  calendarSchoolStepDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: authModalTheme.primaryDark,
  },
  calendarChangeDateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  calendarChangeDateLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: authModalTheme.primary,
  },
  calendarSchoolLoading: {
    marginVertical: 28,
  },
  calendarSchoolListCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8ecf0',
    overflow: 'hidden',
    marginTop: 4,
  },
  calendarSchoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  calendarSchoolRowSelected: {
    backgroundColor: authModalTheme.successLight,
  },
  calendarModalSchoolLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 6,
    marginTop: 4,
  },
  calendarModalSchoolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  calendarModalSchoolBtnActive: {
    borderColor: authModalTheme.successDark,
    backgroundColor: authModalTheme.successLight,
  },
  calendarModalSchoolBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  calendarMarkersLoading: {
    marginVertical: 12,
  },
  calendarMarkersHint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  categoryFilterModalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  categoryFilterModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  categoryFilterAction: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryFilterActionText: {
    fontSize: 15,
    color: '#1a1f2e',
    fontWeight: '500',
  },
  whatsHappeningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  whatsHappeningBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
  },
  whatsHappeningTitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
  },
  whatsHappeningOption: {
    paddingVertical: 6,
  },
  calendarIconOnlyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cce7ea',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1fbfd',
  },
  dateRangeBox: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  dateFieldBtn: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dateFieldLabel: {
    fontSize: 14,
    color: '#1a1f2e',
  },
  sortButtonsInFilter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    alignItems: 'center',
  },
  clearFilterTextBtn: {
    marginLeft: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#6c757d',
    textDecorationLine: 'underline',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  calendarQuickBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  calendarQuickBtnText: {
    fontSize: 15,
    color: '#1a1f2e',
  },
  calendarOkRow: {
    marginTop: 8,
    marginBottom: 8,
  },
  calendarOkBtn: {
    backgroundColor: '#212529',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  calendarOkBtnDisabled: {
    opacity: 0.5,
  },
  calendarOkBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingList: {
    maxHeight: 240,
    marginTop: 8,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  upcomingItemText: {
    flex: 1,
    minWidth: 0,
  },
  upcomingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  upcomingItemSub: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  addToCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  addToCalBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingEmpty: {
    fontSize: 14,
    color: '#6c757d',
    marginVertical: 16,
    textAlign: 'center',
  },
  upcomingFeedScroll: { flex: 1 },
  upcomingFeedContent: { paddingHorizontal: 16, paddingBottom: 24 },
  calendarPostedHost: { flex: 1 },
  calendarPostedHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  calendarExtrasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(13, 202, 240, 0.12)',
  },
  calendarExtrasBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#087990',
  },
  calendarLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  calendarSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  scheduledBadge: {
    backgroundColor: '#ffc107',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  scheduledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  upcomingHeaderLabel: { flex: 1, fontSize: 13, color: '#6c757d' },
  upcomingBackBtn: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upcomingBackBtnText: { fontSize: 12, color: '#1a1f2e', fontWeight: '600' },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingCalIconBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  upcomingItemLogo: { width: 48, height: 48, borderRadius: 24 },
  upcomingItemLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingItemLogoLetter: { fontSize: 16, fontWeight: '700', color: '#1a1f2e' },
  upcomingDetailScroll: { flex: 1, backgroundColor: '#fff' },
  upcomingDetailContent: { padding: 16, paddingBottom: 32 },
  upcomingDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upcomingDetailSchoolRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upcomingDetailLogo: { width: 36, height: 36, borderRadius: 18 },
  upcomingDetailLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingDetailLogoLetter: { fontWeight: '700', color: '#1a1f2e' },
  upcomingDetailSchoolText: { flex: 1 },
  upcomingDetailSchoolName: { fontSize: 15, fontWeight: '600', color: '#1a1f2e' },
  upcomingDetailSubCat: { fontSize: 12, color: '#8e8e8e', marginTop: 2 },
  upcomingDetailCloseBtn: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upcomingDetailCloseText: { fontSize: 13, color: '#1a1f2e' },
  upcomingBadgeWrap: { alignSelf: 'flex-start', marginBottom: 10 },
  upcomingBadgePill: {
    backgroundColor: '#1a1f2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  upcomingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  upcomingDetailImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 12 },
  upcomingDetailTitle: { fontSize: 20, fontWeight: '700', color: '#1a1f2e', marginBottom: 10 },
  upcomingDetailDesc: { fontSize: 15, color: '#2c3338', lineHeight: 22, marginBottom: 16 },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: 'transparent',
  },
  sortPillActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  sortPillOutlineDark: {
    borderColor: '#212529',
  },
  sortPillText: {
    fontSize: 14,
    color: '#212529',
  },
  sortPillTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  errorBox: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8d7da',
  },
  errorText: {
    color: '#842029',
    fontSize: 13,
  },
  inshortsFeedHost: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6c757d',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  subCategory: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  cardImage: {
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardBody: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#212529',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  sponsoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  sponsoredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#495057',
    textTransform: 'uppercase',
  },
  sponsoredLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0d6efd',
    marginTop: 4,
  },
  feedBannerFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dee2e6',
  },
  feedBannerFooterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bannerInFeedWrap: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bannerInFeedImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e9ecef',
  },
});
