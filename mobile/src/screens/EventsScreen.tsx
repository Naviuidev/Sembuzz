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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import FunnelIcon from 'react-native-bootstrap-icons/icons/funnel';
import NewspaperIcon from 'react-native-bootstrap-icons/icons/newspaper';
import BuildingIcon from 'react-native-bootstrap-icons/icons/building';
import {
  getApprovedEvents,
  getCategoriesBySchool,
  getEngagementCounts,
  getActiveBannerAds,
  getActiveSponsoredAds,
  recordBannerAdClick,
  getUpcomingByDate,
  buildGoogleCalendarAddAuthUrl,
  imageSrc,
  ApprovedEventPublic,
  CategoryPublic,
  SponsoredAdPublic,
  BannerAdPublic,
  UpcomingPostPublic,
} from '../services/events';
import { parseImageUrls } from '../services/publicBlogs';
import { getFrontendBaseUrl } from '../config/env';
import type { MainTabParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { buildPublicFeedItems, type PublicFeedItem } from '../utils/publicFeed';
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

type EventsRoute = RouteProp<MainTabParamList, 'Events'>;

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

export default function EventsScreen() {
  const navigation = useNavigation();
  const route = useRoute<EventsRoute>();
  const focusEventId = route.params?.focusEventId;
  const { user } = useAuth();
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [events, setEvents] = useState<ApprovedEventPublic[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedListHeight, setFeedListHeight] = useState(0);
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

  const schoolId = user?.schoolId ?? null;
  const showCategories = !!user && !showAllSchools;
  /** Logged-in All schools tab: Latest/Popular pills in the strip (guest uses funnel dropdown only). */
  const showSortPillsInline = !!user && showAllSchools;
  const isMySchoolFeed = !!user && !showAllSchools && !!schoolId;

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

  const openGuestLogin = useCallback(() => {
    (navigation as { navigate: (name: string, params?: object) => void }).navigate('Settings', {
      screen: 'SettingsMain',
      params: { openLogin: true },
    });
  }, [navigation]);

  useEffect(() => {
    if (user?.id) setGuestSchoolId(null);
  }, [user?.id]);

  const clearGuestSchoolFilter = useCallback(() => {
    setGuestSchoolId(null);
    setGuestSchoolModalVisible(false);
  }, []);

  const selectGuestSchool = useCallback((id: string) => {
    setGuestSchoolId(id);
    setGuestSchoolModalVisible(false);
    setHomeFilterMenuOpen(false);
  }, []);

  const guestSchoolName = useMemo(() => {
    if (!guestSchoolId) return null;
    const fromList = guestSchools.find((s) => s.id === guestSchoolId)?.name;
    if (fromList) return fromList;
    return events.find((e) => e.schoolId === guestSchoolId)?.school?.name ?? null;
  }, [guestSchoolId, guestSchools, events]);

  const isGuestSchoolFeed = !user && !!guestSchoolId;

  const fetchEvents = useCallback(async () => {
    const school = !user ? guestSchoolId : showAllSchools ? null : schoolId ?? null;
    const subIds = showCategories && selectedSubCategoryIds.length > 0 ? selectedSubCategoryIds : undefined;
    try {
      const list = await getApprovedEvents(school, subIds);
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
  }, [showAllSchools, schoolId, showCategories, selectedSubCategoryIds, user, guestSchoolId]);

  useEffect(() => {
    if (showCategories && schoolId) {
      getCategoriesBySchool(schoolId).then(setCategories).catch(() => setCategories([]));
    } else {
      setCategories([]);
    }
  }, [showCategories, schoolId]);

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
    if (!upcomingDateFilter) {
      setUpcomingPosts([]);
      return;
    }
    setUpcomingLoading(true);
    getUpcomingByDate(upcomingDateFilter)
      .then(setUpcomingPosts)
      .catch(() => setUpcomingPosts([]))
      .finally(() => setUpcomingLoading(false));
  }, [upcomingDateFilter]);

  const clearUpcomingView = useCallback(() => {
    setUpcomingDateFilter(null);
    setSelectedUpcomingPost(null);
    setUpcomingPosts([]);
  }, []);

  const applyCalendarDate = useCallback(() => {
    setUpcomingDateFilter(toYmd(calendarDraftDate));
    setShowCalendarModal(false);
    setSelectedUpcomingPost(null);
  }, [calendarDraftDate]);

  const addUpcomingToGoogleCalendar = useCallback((post: UpcomingPostPublic) => {
    const returnUrl = `${getFrontendBaseUrl().replace(/\/$/, '')}/events`;
    const url = buildGoogleCalendarAddAuthUrl(post, returnUrl);
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open calendar', 'Try again in a browser.');
    });
  }, []);

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
      return scoreB - scoreA;
    });
  }, [events, feedSort, engagementCounts]);

  const [activeBannerAds, setActiveBannerAds] = useState<BannerAdPublic[]>([]);
  const [activeSponsoredAds, setActiveSponsoredAds] = useState<SponsoredAdPublic[]>([]);

  /** Match web: logged-in + all schools → no school filter; else user’s school. Guests → optional school filter. */
  const effectiveSchoolId = useMemo(() => {
    if (!user) return guestSchoolId;
    return showAllSchools ? null : schoolId;
  }, [user, showAllSchools, schoolId, guestSchoolId]);

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
    setShowAllSchools(false);
    clearUpcomingView();
  }, [clearUpcomingView]);

  const switchToAllSchools = useCallback(() => {
    setExpandedCategoryId(null);
    setHomeFilterMenuOpen(false);
    setShowAllSchools(true);
    clearUpcomingView();
  }, [clearUpcomingView]);

  const mySchoolLogo = useMemo(() => {
    if (user?.schoolImage?.trim()) return imageSrc(user.schoolImage);
    if (!schoolId) return '';
    const hit = events.find((e) => e.schoolId === schoolId && e.school?.image?.trim());
    return hit?.school?.image ? imageSrc(hit.school.image) : '';
  }, [events, schoolId, user?.schoolImage]);

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

  const homeFilterRow = (
    <View style={[styles.homeFilterRow, !user ? styles.guestHomeFilterRow : null]}>
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
        {(!user || !showSortPillsInline) ? (
          <>
            <TouchableOpacity
              style={[
                styles.calendarIconOnlyBtn,
                (showCalendarModal || upcomingDateFilter) && styles.calendarIconBtnActive,
              ]}
              onPress={() => {
                setHomeFilterMenuOpen(false);
                setShowCalendarModal(true);
                if (upcomingDateFilter) {
                  setCalendarDraftDate(new Date(`${upcomingDateFilter}T12:00:00`));
                }
              }}
              accessibilityLabel="Upcoming news by date"
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={upcomingDateFilter ? '#087990' : '#6c757d'}
              />
            </TouchableOpacity>
            <View style={styles.filterFunnelWrap}>
            <TouchableOpacity
              style={[
                styles.homeFilterBtn,
                (homeFilterMenuOpen || feedSort !== 'latest' || isGuestSchoolFeed) && styles.homeFilterBtnActive,
              ]}
              onPress={() => setHomeFilterMenuOpen((o) => !o)}
              accessibilityLabel="Filter"
            >
              <FunnelIcon
                width={22}
                height={22}
                fill={homeFilterMenuOpen || isGuestSchoolFeed || feedSort !== 'latest' ? '#087990' : '#6c757d'}
              />
            </TouchableOpacity>
            {homeFilterMenuOpen ? (
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
                {!user ? (
                  <>
                    <Text style={[styles.sortDropdownSubLabel, styles.sortDropdownSchoolLabel]}>School</Text>
                    <TouchableOpacity
                      style={styles.guestSchoolFilterBtn}
                      onPress={() => {
                        setHomeFilterMenuOpen(false);
                        setGuestSchoolModalVisible(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <BuildingIcon width={16} height={16} fill="#1a1f2e" />
                      <Text style={styles.guestSchoolFilterBtnText}>Filter by school</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
          </>
        ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {!user ? (
        <View style={styles.guestHomeHeader}>
          <View style={styles.guestLoginBanner}>
            <Ionicons name="information-circle" size={16} color="#997404" style={styles.guestLoginBannerIcon} />
            <Text style={styles.guestLoginBannerText}>
              Sign in to customize your school feed and join school chat groups.
            </Text>
            <TouchableOpacity onPress={openGuestLogin} hitSlop={8}>
              <Text style={styles.guestLoginBannerAction}>Sign in</Text>
            </TouchableOpacity>
          </View>
          {homeFilterRow}
          {!user && guestSchoolId ? (
            <View style={styles.guestSchoolChipRow}>
              <Text style={styles.guestSchoolChipLabel}>Showing:</Text>
              <View style={styles.guestSchoolBadge}>
                <Text style={styles.guestSchoolBadgeText} numberOfLines={1}>
                  {guestSchoolName ?? 'Selected school'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGuestSchoolModalVisible(true)} hitSlop={8}>
                <Text style={styles.guestSchoolChipAction}>Change school</Text>
              </TouchableOpacity>
              <Text style={styles.guestSchoolChipDot}>·</Text>
              <TouchableOpacity onPress={clearGuestSchoolFilter} hitSlop={8}>
                <Text style={styles.guestSchoolChipAction}>Clear filter</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, showAllSchools ? null : styles.tabActive]}
              onPress={switchToMySchool}
            >
              <View style={styles.tabContent}>
                {mySchoolLogo ? (
                  <Image source={{ uri: mySchoolLogo }} style={styles.tabSchoolLogo} />
                ) : (
                  <View style={styles.tabSchoolLogoFallback}>
                    <Text style={styles.tabSchoolLogoFallbackText}>
                      {(user?.schoolName?.trim()?.charAt(0) || user?.name?.trim()?.charAt(0) || 'S').toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={[styles.tabText, showAllSchools ? styles.tabTextInactive : styles.tabTextActive]}>
                  My school
                </Text>
              </View>
              {!showAllSchools && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, showAllSchools ? styles.tabActive : null]}
              onPress={switchToAllSchools}
            >
              <View style={styles.tabContent}>
                <View style={styles.tabSchoolLogoFallback}>
                  <BuildingIcon width={14} height={14} fill="#4b5563" />
                </View>
                <Text style={[styles.tabText, showAllSchools ? styles.tabTextActive : styles.tabTextInactive]}>
                  All schools
                </Text>
              </View>
              {showAllSchools && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>
          {homeFilterRow}
        </>
      )}

      {isMySchoolFeed && selectedSubCategoryMeta.length > 0 ? (
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
        <ScrollView
          style={styles.upcomingFeedScroll}
          contentContainerStyle={styles.upcomingFeedContent}
          refreshControl={<RefreshControl refreshing={upcomingLoading} onRefresh={() => {
            if (upcomingDateFilter) {
              setUpcomingLoading(true);
              getUpcomingByDate(upcomingDateFilter)
                .then(setUpcomingPosts)
                .finally(() => setUpcomingLoading(false));
            }
          }} />}
        >
          <View style={styles.upcomingHeaderRow}>
            <Text style={styles.upcomingHeaderLabel}>
              Upcoming for {formatUpcomingHeader(upcomingDateFilter)}
            </Text>
            <TouchableOpacity onPress={clearUpcomingView} style={styles.upcomingBackBtn}>
              <Text style={styles.upcomingBackBtnText}>Show regular feed</Text>
            </TouchableOpacity>
          </View>
          {upcomingLoading ? (
            <ActivityIndicator size="large" color="#1a1f2e" style={{ marginVertical: 24 }} />
          ) : upcomingPosts.length === 0 ? (
            <Text style={styles.upcomingEmpty}>No upcoming news for this date.</Text>
          ) : (
            upcomingPosts.map((post) => (
              <View key={post.id} style={styles.upcomingCard}>
                <TouchableOpacity
                  style={styles.upcomingItem}
                  onPress={() => setSelectedUpcomingPost(post)}
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
            ))
          )}
        </ScrollView>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
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
              {isMySchoolFeed || isGuestSchoolFeed
                ? 'No approved news for this school yet.'
                : 'No approved news yet.'}
            </Text>
            {isMySchoolFeed || isGuestSchoolFeed ? (
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
          {feedListHeight > 0 ? (
            <InshortsPagedFeed
              key={showAllSchools ? 'inshorts-all' : 'inshorts-my'}
              feedItems={feedItems}
              pageHeight={feedListHeight}
              alignTop={isMySchoolFeed && selectedSubCategoryMeta.length > 0}
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
              {guestSchoolId ? (
                <TouchableOpacity style={styles.schoolPickerShowAll} onPress={clearGuestSchoolFilter}>
                  <Text style={styles.guestSchoolChipAction}>Clear filter</Text>
                </TouchableOpacity>
              ) : null}
              {guestSchoolsLoading ? (
                <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 24 }} />
              ) : guestSchools.length === 0 ? (
                <Text style={styles.schoolPickerEmpty}>No schools found.</Text>
              ) : (
                <ScrollView style={styles.schoolPickerList}>
                  {guestSchools.map((s) => {
                    const isSelected = guestSchoolId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.schoolPickerItem, isSelected && styles.schoolPickerItemSelected]}
                        onPress={() => selectGuestSchool(s.id)}
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
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCalendarModal(false)}>
            <Pressable style={styles.calendarModalBox} onPress={(e) => e.stopPropagation()}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.calendarModalTitle}>Upcoming news</Text>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <Text style={styles.calendarModalClose}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.whatsHappeningRow}>
                <View style={styles.whatsHappeningBox}>
                  <Text style={styles.whatsHappeningTitle}>Quick pick</Text>
                  <TouchableOpacity
                    style={styles.calendarQuickBtn}
                    onPress={() => setCalendarDraftDate(new Date())}
                  >
                    <Text style={styles.calendarQuickBtnText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calendarQuickBtn}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setCalendarDraftDate(d);
                    }}
                  >
                    <Text style={styles.calendarQuickBtnText}>Tomorrow</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {Platform.OS === 'android' && !showNativeDatePicker ? (
                <TouchableOpacity
                  style={styles.dateFieldBtn}
                  onPress={() => setShowNativeDatePicker(true)}
                >
                  <Text style={styles.dateFieldLabel}>{toYmd(calendarDraftDate)}</Text>
                </TouchableOpacity>
              ) : null}
              {(Platform.OS === 'ios' || showNativeDatePicker) ? (
                <DateTimePicker
                  value={calendarDraftDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_event, date) => {
                    if (date) setCalendarDraftDate(date);
                    if (Platform.OS === 'android') setShowNativeDatePicker(false);
                  }}
                />
              ) : null}
              <View style={styles.calendarOkRow}>
                <TouchableOpacity style={styles.calendarOkBtn} onPress={applyCalendarDate}>
                  <Text style={styles.calendarOkBtnText}>Show upcoming</Text>
                </TouchableOpacity>
              </View>
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
                <ScrollView style={styles.subCatDropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {(expandedCategory.subcategories ?? []).map((sub) => {
                    const checked = selectedSubCategoryIds.includes(sub.id);
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.subCatDropdownRow}
                        onPress={() => toggleSubCategory(sub.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                          {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
                        </View>
                        <Text style={styles.subCatDropdownRowText}>{sub.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* First login — unmount Modal when dismissed (visible={false} alone can leave a ghost window on iPad that blocks the tab bar until cold start). */}
      {showFirstLoginCategories && !!user?.schoolId && prefsLoaded ? (
        <Modal
          visible
          animationType="fade"
          transparent
          presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
          onRequestClose={() => {
            if (!categoryModalSaving) saveCategorySelectionMobile(true);
          }}
        >
          <Pressable
            style={styles.categorySelectOverlay}
            onPress={() => {
              if (!categoryModalSaving) saveCategorySelectionMobile(true);
            }}
          >
            <Pressable style={styles.categorySelectCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.categorySelectTitle} accessibilityRole="header">
                Select your categories
              </Text>
              <Text style={styles.categorySelectDesc}>
                Choose the categories and subcategories for your school. Your home feed will show news from your selections. You can skip and see all school news, or change this later in Settings.
              </Text>

              <ScrollView
                style={styles.categorySelectList}
                contentContainerStyle={styles.categorySelectListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {categories.length === 0 ? (
                  <ActivityIndicator color="#1a1f2e" style={{ marginVertical: 18 }} />
                ) : (
                  categories.map((cat) => (
                    <View key={cat.id} style={styles.categorySelectBlock}>
                      <Text style={styles.categorySelectCatTitle}>{cat.name}</Text>
                      <View style={styles.categorySelectSubRow}>
                        {(cat.subcategories ?? []).map((sub) => {
                          const isSelected = categoryModalSelectedIds.includes(sub.id);
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[styles.subCatBtn, isSelected ? styles.subCatBtnDark : styles.subCatBtnOutline]}
                              onPress={() => !categoryModalSaving && toggleCategoryModalSub(sub.id)}
                              activeOpacity={0.85}
                              disabled={categoryModalSaving}
                            >
                              <Text style={[styles.subCatBtnText, isSelected && styles.subCatBtnTextOnDark]}>
                                {sub.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.categorySelectActions}>
                <TouchableOpacity
                  style={[styles.catModalBtnOutline, categoryModalSaving && styles.catModalBtnDisabled]}
                  onPress={() => saveCategorySelectionMobile(true)}
                  activeOpacity={0.85}
                  disabled={categoryModalSaving}
                >
                  <Text style={styles.catModalBtnOutlineText}>
                    {categoryModalSaving ? 'Please wait…' : 'Skip'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.catModalBtnDark, categoryModalSaving && styles.catModalBtnDisabled]}
                  onPress={() => saveCategorySelectionMobile(false)}
                  activeOpacity={0.85}
                  disabled={categoryModalSaving}
                >
                  <Text style={styles.catModalBtnDarkText}>
                    {categoryModalSaving ? 'Saving…' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    position: 'relative',
  },
  guestHomeHeader: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  guestHomeFilterRow: {
    borderBottomWidth: 0,
  },
  guestLoginBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff8e6',
    borderWidth: 1,
    borderColor: '#ffe8a3',
  },
  guestLoginBannerIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  guestLoginBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#664d03',
  },
  guestLoginBannerAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#664d03',
    flexShrink: 0,
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
  homeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingRight: 8,
    paddingLeft: 4,
    zIndex: 20,
  },
  filterFunnelWrap: {
    position: 'relative',
    zIndex: 30,
  },
  homeFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  homeFilterBtnActive: {
    backgroundColor: 'rgba(13, 202, 240, 0.15)',
  },
  sortDropdown: {
    position: 'absolute',
    top: 42,
    right: 0,
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
  subCatDropdownEmpty: {
    fontSize: 13,
    color: '#0f2b52',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  subCatDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(176,190,215,0.42)',
  },
  subCatDropdownRowText: {
    fontSize: 15,
    color: '#0b1f3f',
    flex: 1,
    fontWeight: '600',
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
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {},
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 0,
  },
  categoriesStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  calendarModalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
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
    marginBottom: 12,
  },
  calendarModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  calendarModalClose: {
    fontSize: 28,
    color: '#6c757d',
    padding: 4,
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
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
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
    backgroundColor: '#f5f7fb',
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
  categorySelectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  categorySelectCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  categorySelectList: {
    marginTop: 4,
    flexGrow: 0,
    maxHeight: 420,
  },
  categorySelectListContent: {
    paddingBottom: 6,
  },
  categorySelectTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  categorySelectDesc: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 20,
  },
  categorySelectBlock: {
    marginBottom: 14,
  },
  categorySelectCatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  categorySelectSubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCatBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  subCatBtnOutline: {
    borderColor: '#212529',
    backgroundColor: 'transparent',
  },
  subCatBtnDark: {
    borderColor: '#212529',
    backgroundColor: '#212529',
  },
  subCatBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212529',
  },
  subCatBtnTextOnDark: {
    color: '#fff',
  },
  categorySelectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  catModalBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  catModalBtnOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  catModalBtnDark: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#212529',
  },
  catModalBtnDarkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  catModalBtnDisabled: {
    opacity: 0.7,
  },
});
