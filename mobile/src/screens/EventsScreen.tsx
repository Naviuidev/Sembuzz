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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  imageSrc,
  ApprovedEventPublic,
  CategoryPublic,
  SponsoredAdPublic,
  BannerAdPublic,
} from '../services/events';
import { useAuth } from '../contexts/AuthContext';
import { buildPublicFeedItems, type PublicFeedItem } from '../utils/publicFeed';
import { InshortsPagedFeed } from '../components/InshortsPagedFeed';
import { userEventsService } from '../services/userEvents';
import {
  getUserCategoryDone,
  getUserSubCategoryIds,
  setUserCategoryDone,
  setUserSubCategoryIds,
} from '../utils/userCategoryPrefs';
import { userNotificationsService } from '../services/userNotifications';
import { CATEGORY_PREFS_CHANGED } from '../constants/appEvents';

export default function EventsScreen() {
  const navigation = useNavigation();
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
  /** Subcategory ids saved at first-login / Settings — used only to decide which category pills appear (matches web). */
  const [persistedPrefSubIds, setPersistedPrefSubIds] = useState<string[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const schoolId = user?.schoolId ?? null;
  const showCategories = !!user && !showAllSchools;
  /** Logged-in All schools tab: show Latest/Popular as category-style pills, not the funnel menu. */
  const allSchoolsSortInline = !!user && showAllSchools;
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

  const fetchEvents = useCallback(async () => {
    const school = showAllSchools ? null : schoolId ?? null;
    const subIds = showCategories && selectedSubCategoryIds.length > 0 ? selectedSubCategoryIds : undefined;
    try {
      const list = await getApprovedEvents(school, subIds);
      setEvents(list);
      setError(null);
    } catch {
      setError('Unable to load events right now. Pull to refresh and try again.');
    }
  }, [showAllSchools, schoolId, showCategories, selectedSubCategoryIds]);

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
          setSelectedSubCategoryIds(ids);
          setPersistedPrefSubIds(ids);
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

  /** When Settings saves category prefs, refresh strip + filter without resetting first-login flow. */
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CATEGORY_PREFS_CHANGED, async () => {
      if (!user?.id) return;
      const done = await getUserCategoryDone(user.id);
      if (done === 'true' || done === 'skip') {
        const ids = await getUserSubCategoryIds(user.id);
        setPersistedPrefSubIds(ids);
        setSelectedSubCategoryIds(ids);
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
      if (!user?.id) return;
      if (skip) {
        await setUserCategoryDone(user.id, 'skip');
        await setUserSubCategoryIds(user.id, []);
        try {
          await userNotificationsService.setSubcategories([]);
        } catch {
          /* ignore */
        }
        setSelectedSubCategoryIds([]);
        setPersistedPrefSubIds([]);
      } else {
        await setUserCategoryDone(user.id, 'true');
        await setUserSubCategoryIds(user.id, categoryModalSelectedIds);
        try {
          await userNotificationsService.setSubcategories(categoryModalSelectedIds);
        } catch {
          /* ignore */
        }
        setSelectedSubCategoryIds(categoryModalSelectedIds);
        setPersistedPrefSubIds(categoryModalSelectedIds);
      }
      setShowFirstLoginCategories(false);
      setCategoryModalSelectedIds([]);
    },
    [user?.id, categoryModalSelectedIds],
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
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

  useEffect(() => {
    if (!showCategories) setExpandedCategoryId(null);
  }, [showCategories]);

  useEffect(() => {
    if (user && showAllSchools) setHomeFilterMenuOpen(false);
  }, [user, showAllSchools]);

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

  const refetchInshortsEngagement = useCallback(async () => {
    if (eventIds.length === 0) {
      setInshortsEngagement({ likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] });
      return;
    }
    try {
      const rPublic = await getEngagementCounts(eventIds);
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
        const rUser = await userEventsService.getEngagement(eventIds);
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
  }, [eventIds, user]);

  useEffect(() => {
    refetchInshortsEngagement();
  }, [refetchInshortsEngagement]);

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

  /** Match web: logged-in + all schools → no school filter; else user’s school. Guests → all schools. */
  const effectiveSchoolId = useMemo(() => {
    if (!user) return null;
    return showAllSchools ? null : schoolId;
  }, [user, showAllSchools, schoolId]);

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
    Promise.all([fetchEvents(), loadAds(), refetchInshortsEngagement()]).finally(() =>
      setRefreshing(false),
    );
  }, [fetchEvents, loadAds, refetchInshortsEngagement]);

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

  const mySchoolLogo = useMemo(() => {
    if (!schoolId) return '';
    const hit = events.find((e) => e.schoolId === schoolId && e.school?.image);
    return hit?.school?.image ? imageSrc(hit.school.image) : '';
  }, [events, schoolId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* My school / All schools tabs — same order as web (above category + filter row) */}
      {user ? (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, showAllSchools ? null : styles.tabActive]}
            onPress={() => setShowAllSchools(false)}
          >
            <View style={styles.tabContent}>
              {mySchoolLogo ? (
                <Image source={{ uri: mySchoolLogo }} style={styles.tabSchoolLogo} />
              ) : (
                <View style={styles.tabSchoolLogoFallback}>
                  <Text style={styles.tabSchoolLogoFallbackText}>
                    {(user?.name?.trim()?.charAt(0) || 'S').toUpperCase()}
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
            onPress={() => setShowAllSchools(true)}
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
      ) : null}

      {/* My school: category pills + funnel (Latest/Popular). All schools (logged in): Latest/Popular pills only, no funnel. */}
      <View style={styles.homeFilterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesStrip}
          contentContainerStyle={styles.categoriesStripContent}
        >
          {allSchoolsSortInline ? (
            <>
              <TouchableOpacity
                style={[
                  styles.categoryMainPill,
                  feedSort === 'latest' && styles.categoryMainPillEmphasis,
                ]}
                onPress={() => setFeedSort('latest')}
                accessibilityLabel="Sort by latest"
              >
                <Text
                  style={[
                    styles.categoryMainPillText,
                    feedSort === 'latest' && styles.categoryMainPillTextEmphasis,
                  ]}
                >
                  Latest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryMainPill,
                  feedSort === 'popular' && styles.categoryMainPillEmphasis,
                ]}
                onPress={() => setFeedSort('popular')}
                accessibilityLabel="Sort by popular"
              >
                <Text
                  style={[
                    styles.categoryMainPillText,
                    feedSort === 'popular' && styles.categoryMainPillTextEmphasis,
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
                  <Text style={styles.clearCatsText}>All</Text>
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
        {!allSchoolsSortInline ? (
          <View style={styles.filterFunnelWrap}>
            <TouchableOpacity
              style={[
                styles.homeFilterBtn,
                (homeFilterMenuOpen || feedSort !== 'latest') && styles.homeFilterBtnActive,
              ]}
              onPress={() => setHomeFilterMenuOpen((o) => !o)}
              accessibilityLabel="Filter: Latest, Popular"
            >
              <FunnelIcon
                width={22}
                height={22}
                fill={homeFilterMenuOpen ? '#087990' : '#6c757d'}
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
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {error ? (
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
              {isMySchoolFeed ? 'No approved news for this school yet.' : 'No approved news yet.'}
            </Text>
            {isMySchoolFeed ? (
              <TouchableOpacity onPress={openSchoolEmptyMessage} style={styles.emptyFeedViewMsg}>
                <Text style={styles.emptyFeedViewMsgText}>View message</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.emptyFeedSecondary}>
                  <Text style={styles.emptyFeedStrong}>Approved</Text>
                  {' '}
                  news from schools appears here after category admin approval. Use{' '}
                  <Text
                    style={styles.emptyFeedLink}
                    onPress={() => {
                      (navigation as { navigate: (name: string) => void }).navigate('Blogs');
                    }}
                  >
                    Blogs
                  </Text>
                  {' '}
                  in the nav for blog posts.
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
          style={styles.inshortsFeedHost}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - feedListHeight) > 1) setFeedListHeight(h);
          }}
        >
          {feedListHeight > 0 ? (
            <InshortsPagedFeed
              feedItems={feedItems}
              pageHeight={feedListHeight}
              onRefresh={onRefresh}
              refreshing={refreshing}
              userId={user?.id ?? null}
              getEventEngagement={getEventEngagement}
              onLike={onInshortsLike}
              onSave={onInshortsSave}
              onCommentAdded={onInshortsCommentAdded}
              onBannerClick={onBannerAdPress}
            />
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#1a1f2e" />
            </View>
          )}
        </View>
      )}

      {/* Subcategory dropdown (same behavior as web portal under category pill) */}
      <Modal
        visible={!!expandedCategory && showCategories}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedCategoryId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setExpandedCategoryId(null)}>
          <Pressable style={styles.subCatDropdownBox} onPress={(e) => e.stopPropagation()}>
            {expandedCategory ? (
              <>
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
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* First login — same structure as web PublicEvents (glass overlay + white card) */}
      <Modal
        visible={showFirstLoginCategories && !!user?.schoolId && prefsLoaded}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.categorySelectOverlay}>
          <ScrollView
            style={styles.categorySelectScroll}
            contentContainerStyle={styles.categorySelectScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.categorySelectTitle} accessibilityRole="header">
              Select your categories
            </Text>
            <Text style={styles.categorySelectDesc}>
              Choose the categories and subcategories for your school. Your home feed will show news from your selections. You can skip and see all school news, or change this later in Settings.
            </Text>
            {categories.length === 0 ? (
              <ActivityIndicator color="#1a1f2e" style={{ marginVertical: 24 }} />
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
                          onPress={() => toggleCategoryModalSub(sub.id)}
                          activeOpacity={0.85}
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
            <View style={styles.categorySelectActions}>
              <TouchableOpacity
                style={styles.catModalBtnOutline}
                onPress={() => saveCategorySelectionMobile(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.catModalBtnOutlineText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.catModalBtnDark}
                onPress={() => saveCategorySelectionMobile(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.catModalBtnDarkText}>Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    position: 'relative',
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
    marginRight: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  clearCatsText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
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
  subCatDropdownBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  subCatDropdownHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dee2e6',
  },
  subCatDropdownScroll: {
    maxHeight: 360,
  },
  subCatDropdownEmpty: {
    fontSize: 13,
    color: '#6c757d',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subCatDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  subCatDropdownRowText: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6c757d',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  categoriesStrip: {
    minHeight: 50,
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 0,
  },
  categoriesStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
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
    padding: 16,
    paddingBottom: 88,
  },
  categorySelectScroll: {
    maxHeight: '100%',
  },
  categorySelectScrollContent: {
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
});
