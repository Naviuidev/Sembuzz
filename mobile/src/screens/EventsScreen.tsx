import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CalendarEventIcon from 'react-native-bootstrap-icons/icons/calendar-event';
import CalendarPlusIcon from 'react-native-bootstrap-icons/icons/calendar-plus';
import FunnelIcon from 'react-native-bootstrap-icons/icons/funnel';
import {
  getApprovedEvents,
  getCategoriesBySchool,
  getEngagementCounts,
  getUpcomingByDate,
  getUpcomingByRange,
  getActiveBannerAds,
  getActiveSponsoredAds,
  buildGoogleCalendarAddAuthUrl,
  imageSrc,
  ApprovedEventPublic,
  CategoryPublic,
  UpcomingPostPublic,
  SponsoredAdPublic,
  BannerAdPublic,
} from '../services/events';
import { useAuth } from '../contexts/AuthContext';
import { getFrontendBaseUrl } from '../config/env';
import { buildPublicFeedItems, type PublicFeedItem } from '../utils/publicFeed';
import { InshortsPagedFeed } from '../components/InshortsPagedFeed';
import { userEventsService } from '../services/userEvents';

const RETURN_URL = getFrontendBaseUrl();

export default function EventsScreen() {
  const { user } = useAuth();
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [events, setEvents] = useState<ApprovedEventPublic[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [categoryFilterModalOpen, setCategoryFilterModalOpen] = useState(false);
  const [calendarPendingDate, setCalendarPendingDate] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'from' | 'to' | null>(null);
  const [rangeFromDraft, setRangeFromDraft] = useState<string | null>(null);
  const [rangeToDraft, setRangeToDraft] = useState<string | null>(null);
  const [rangeFromApplied, setRangeFromApplied] = useState<string | null>(null);
  const [rangeToApplied, setRangeToApplied] = useState<string | null>(null);
  const [upcomingRangePosts, setUpcomingRangePosts] = useState<UpcomingPostPublic[]>([]);
  const [upcomingByDate, setUpcomingByDate] = useState<UpcomingPostPublic[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [calendarHasFetched, setCalendarHasFetched] = useState(false);
  const [feedListHeight, setFeedListHeight] = useState(0);

  const schoolId = user?.schoolId ?? null;
  const showCategories = !!user && !showAllSchools;

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

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

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
    const inRange = events.filter((e) => {
      if (!rangeFromApplied || !rangeToApplied) return true;
      const d = new Date(e.updatedAt);
      const from = new Date(`${rangeFromApplied}T00:00:00`);
      const to = new Date(`${rangeToApplied}T23:59:59`);
      return d >= from && d <= to;
    });
    if (feedSort === 'latest') {
      return [...inRange].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    const { likes, commentCounts, savedCounts } = engagementCounts;
    return [...inRange].sort((a, b) => {
      const scoreA = (likes[a.id] ?? 0) + (commentCounts[a.id] ?? 0) + (savedCounts[a.id] ?? 0);
      const scoreB = (likes[b.id] ?? 0) + (commentCounts[b.id] ?? 0) + (savedCounts[b.id] ?? 0);
      return scoreB - scoreA;
    });
  }, [events, feedSort, engagementCounts, rangeFromApplied, rangeToApplied]);

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

  useEffect(() => {
    if (calendarModalOpen && user && !calendarPendingDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setCalendarPendingDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      );
    }
    if (!calendarModalOpen) setCalendarHasFetched(false);
  }, [calendarModalOpen, user, calendarPendingDate]);

  const fetchUpcomingForDate = useCallback(async () => {
    if (!calendarPendingDate) return;
    setCalendarHasFetched(true);
    setUpcomingLoading(true);
    try {
      const list = await getUpcomingByDate(calendarPendingDate);
      setUpcomingByDate(list);
    } catch {
      setUpcomingByDate([]);
    } finally {
      setUpcomingLoading(false);
    }
  }, [calendarPendingDate]);

  const fetchUpcomingForRange = useCallback(async (from: string, to: string) => {
    try {
      const list = await getUpcomingByRange(from, to);
      setUpcomingRangePosts(list);
    } catch {
      setUpcomingRangePosts([]);
    }
  }, []);

  const openAddToCalendar = (post: UpcomingPostPublic) => {
    const returnUrl = `${RETURN_URL.replace(/\/$/, '')}/events`;
    const url = buildGoogleCalendarAddAuthUrl(post, returnUrl);
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open calendar link', 'Please try again in a moment.');
    });
  };

  const toISODate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const pendingDateObject = useMemo(() => {
    if (!calendarPendingDate) return new Date();
    const d = new Date(`${calendarPendingDate}T12:00:00`);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [calendarPendingDate]);

  const onPickCustomDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setDatePickerOpen(false);
    if (selectedDate) {
      const value = toISODate(selectedDate);
      if (datePickerField === 'from') setRangeFromDraft(value);
      if (datePickerField === 'to') setRangeToDraft(value);
      if (!datePickerField) setCalendarPendingDate(value);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* My school / All schools tabs - same as web */}
      {user ? (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, showAllSchools ? null : styles.tabActive]}
            onPress={() => setShowAllSchools(false)}
          >
            <Text style={[styles.tabText, showAllSchools ? styles.tabTextInactive : styles.tabTextActive]}>
              My school
            </Text>
            {!showAllSchools && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showAllSchools ? styles.tabActive : null]}
            onPress={() => setShowAllSchools(true)}
          >
            <Text style={[styles.tabText, showAllSchools ? styles.tabTextActive : styles.tabTextInactive]}>
              All schools
            </Text>
            {showAllSchools && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Categories strip (My school only) */}
      {showCategories && categories.length > 0 ? (
        <View style={styles.categoriesRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesStrip}
            contentContainerStyle={styles.categoriesStripContent}
          >
            {categories.flatMap((cat) =>
              cat.subcategories.map((sub) => {
                const isSelected = selectedSubCategoryIds.includes(sub.id);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => toggleSubCategory(sub.id)}
                  >
                    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              }),
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.categoryFilterBtn}
            onPress={() => setCategoryFilterModalOpen(true)}
            accessibilityLabel="Category filters"
          >
            <FunnelIcon width={18} height={18} fill="#1a1f2e" />
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : upcomingRangePosts.length > 0 ? (
        <FlatList
          data={upcomingRangePosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {item.school?.image ? (
                  <Image source={{ uri: imageSrc(item.school.image) }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>{item.school?.name?.charAt(0) ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.cardHeaderText}>
                  <Text style={styles.schoolName}>{item.school?.name ?? 'School'}</Text>
                  <Text style={styles.subCategory}>{item.subCategory?.name ?? item.category?.name ?? ''}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title}>{item.title}</Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                <Text style={styles.date}>{formatDate(item.scheduledTo)}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : rangeFromApplied && rangeToApplied ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No upcoming news for selected date range.</Text>
        </View>
      ) : feedItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No news yet.</Text>
        </View>
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
            />
          ) : (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Calendar / Upcoming by date modal */}
      <Modal
        visible={calendarModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarModalOpen(false)}>
          <Pressable style={styles.calendarModalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>What&apos;s happening</Text>
              <TouchableOpacity onPress={() => setCalendarModalOpen(false)} hitSlop={12}>
                <Text style={styles.calendarModalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.calendarQuickBtn}
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                setCalendarPendingDate(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                );
              }}
            >
              <Text style={styles.calendarQuickBtnText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calendarQuickBtn}
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() + 2);
                setCalendarPendingDate(
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                );
              }}
            >
              <Text style={styles.calendarQuickBtnText}>Day after tomorrow</Text>
            </TouchableOpacity>
            <View style={styles.calendarOkRow}>
              <TouchableOpacity
                style={[styles.calendarOkBtn, !calendarPendingDate && styles.calendarOkBtnDisabled]}
                disabled={!calendarPendingDate}
                onPress={fetchUpcomingForDate}
              >
                <Text style={styles.calendarOkBtnText}>OK — View filtered news</Text>
              </TouchableOpacity>
            </View>
            {upcomingLoading ? (
              <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
            ) : upcomingByDate.length > 0 ? (
              <ScrollView style={styles.upcomingList} nestedScrollEnabled>
                {upcomingByDate.map((post) => (
                  <View key={post.id} style={styles.upcomingItem}>
                    <View style={styles.upcomingItemText}>
                      <Text style={styles.upcomingItemTitle} numberOfLines={1}>{post.title}</Text>
                      <Text style={styles.upcomingItemSub} numberOfLines={1}>{post.school?.name ?? 'School'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addToCalBtn}
                      onPress={() => openAddToCalendar(post)}
                    >
                      <CalendarPlusIcon width={20} height={20} fill="#fff" />
                      <Text style={styles.addToCalBtnText}>Add to Google Calendar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : calendarHasFetched && !upcomingLoading && upcomingByDate.length === 0 ? (
              <Text style={styles.upcomingEmpty}>No upcoming events for this date.</Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={categoryFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryFilterModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryFilterModalOpen(false)}>
          <Pressable style={styles.categoryFilterModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.categoryFilterModalTitle}>Filter options</Text>
            <View style={styles.whatsHappeningRow}>
              <View style={styles.whatsHappeningBox}>
                <Text style={styles.whatsHappeningTitle}>What&apos;s happening</Text>
                <TouchableOpacity
                  style={styles.whatsHappeningOption}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    const value = toISODate(d);
                    setRangeFromDraft(value);
                    setRangeToDraft(value);
                  }}
                >
                  <Text style={styles.categoryFilterActionText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.whatsHappeningOption}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 2);
                    const value = toISODate(d);
                    setRangeFromDraft(value);
                    setRangeToDraft(value);
                  }}
                >
                  <Text style={styles.categoryFilterActionText}>Day after tomorrow</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.calendarIconOnlyBtn}
                onPress={() => setDateRangeOpen((v) => !v)}
                accessibilityLabel="Open date range picker"
              >
                <CalendarEventIcon width={20} height={20} fill="#087990" />
              </TouchableOpacity>
            </View>

            {dateRangeOpen ? (
              <View style={styles.dateRangeBox}>
                <TouchableOpacity
                  style={styles.dateFieldBtn}
                  onPress={() => {
                    setDatePickerField('from');
                    setDatePickerOpen(true);
                  }}
                >
                  <Text style={styles.dateFieldLabel}>From: {rangeFromDraft ?? 'Pick date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateFieldBtn}
                  onPress={() => {
                    setDatePickerField('to');
                    setDatePickerOpen(true);
                  }}
                >
                  <Text style={styles.dateFieldLabel}>To: {rangeToDraft ?? 'Pick date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarOkBtn}
                  onPress={() => {
                    if (rangeFromDraft && rangeToDraft) {
                      setRangeFromApplied(rangeFromDraft);
                      setRangeToApplied(rangeToDraft);
                      fetchUpcomingForRange(rangeFromDraft, rangeToDraft);
                    }
                    setCategoryFilterModalOpen(false);
                  }}
                >
                  <Text style={styles.calendarOkBtnText}>OK — Start search</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.sortButtonsInFilter}>
              <TouchableOpacity
                style={[styles.sortPill, styles.sortPillOutlineDark, feedSort === 'latest' && styles.sortPillActive]}
                onPress={() => {
                  setFeedSort('latest');
                  setDateRangeOpen(false);
                  setDatePickerOpen(false);
                  setRangeFromApplied(null);
                  setRangeToApplied(null);
                  setUpcomingRangePosts([]);
                  setCategoryFilterModalOpen(false);
                }}
              >
                <Text style={[styles.sortPillText, feedSort === 'latest' && styles.sortPillTextActive]}>
                  Latest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortPill, styles.sortPillOutlineDark, feedSort === 'popular' && styles.sortPillActive]}
                onPress={() => {
                  setFeedSort('popular');
                  setDateRangeOpen(false);
                  setDatePickerOpen(false);
                  setRangeFromApplied(null);
                  setRangeToApplied(null);
                  setUpcomingRangePosts([]);
                  setCategoryFilterModalOpen(false);
                }}
              >
                <Text style={[styles.sortPillText, feedSort === 'popular' && styles.sortPillTextActive]}>
                  Popular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setDateRangeOpen(false);
                  setDatePickerOpen(false);
                  setDatePickerField(null);
                  setRangeFromApplied(null);
                  setRangeToApplied(null);
                  setUpcomingRangePosts([]);
                }}
                style={styles.clearFilterTextBtn}
              >
                <Text style={styles.clearFilterText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {datePickerOpen ? (
              <DateTimePicker
                value={pendingDateObject}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onPickCustomDate}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    position: 'relative',
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
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingRight: 10,
  },
  categoriesStrip: {
    maxHeight: 44,
    backgroundColor: '#fff',
    flex: 1,
  },
  categoriesStripContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#1a1f2e',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#495057',
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
    backgroundColor: '#000',
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
