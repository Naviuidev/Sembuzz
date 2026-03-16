import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useWindowDimensions,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarEventIcon from 'react-native-bootstrap-icons/icons/calendar-event';
import CalendarPlusIcon from 'react-native-bootstrap-icons/icons/calendar-plus';
import {
  getApprovedEvents,
  getCategoriesBySchool,
  getEngagementCounts,
  getUpcomingByDate,
  buildGoogleCalendarAddAuthUrl,
  imageSrc,
  ApprovedEventPublic,
  CategoryPublic,
  UpcomingPostPublic,
} from '../services/events';
import { useAuth } from '../contexts/AuthContext';

const RETURN_URL = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://sembuzz.com';

export default function EventsScreen() {
  const { user } = useAuth();
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [events, setEvents] = useState<ApprovedEventPublic[]>([]);
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarPendingDate, setCalendarPendingDate] = useState<string | null>(null);
  const [upcomingByDate, setUpcomingByDate] = useState<UpcomingPostPublic[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [calendarHasFetched, setCalendarHasFetched] = useState(false);
  const { width } = useWindowDimensions();

  const schoolId = user?.schoolId ?? null;
  const showCategories = !!user && !showAllSchools;

  const fetchEvents = useCallback(async () => {
    const school = showAllSchools ? null : schoolId ?? null;
    const subIds = showCategories && selectedSubCategoryIds.length > 0 ? selectedSubCategoryIds : undefined;
    const list = await getApprovedEvents(school, subIds);
    setEvents(list);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  }, [fetchEvents]);

  const [engagementCounts, setEngagementCounts] = useState<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    savedCounts: Record<string, number>;
  }>({ likes: {}, commentCounts: {}, savedCounts: {} });

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
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
    if (feedSort === 'latest') return events;
    const { likes, commentCounts, savedCounts } = engagementCounts;
    return [...events].sort((a, b) => {
      const scoreA = (likes[a.id] ?? 0) + (commentCounts[a.id] ?? 0) + (savedCounts[a.id] ?? 0);
      const scoreB = (likes[b.id] ?? 0) + (commentCounts[b.id] ?? 0) + (savedCounts[b.id] ?? 0);
      return scoreB - scoreA;
    });
  }, [events, feedSort, engagementCounts]);

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

  const openAddToCalendar = (post: UpcomingPostPublic) => {
    const returnUrl = `${RETURN_URL.replace(/\/$/, '')}/events`;
    const url = buildGoogleCalendarAddAuthUrl(post, returnUrl);
    Linking.openURL(url);
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

  const renderItem = ({ item }: { item: ApprovedEventPublic }) => {
    const images = item.imageUrls
      ? (() => {
          try {
            const parsed = JSON.parse(item.imageUrls);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
    const firstImage = images[0];

    return (
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
            <Text style={styles.subCategory}>{item.subCategory?.name ?? ''}</Text>
          </View>
        </View>
        {firstImage ? (
          <Image source={{ uri: imageSrc(firstImage) }} style={[styles.cardImage, { width: width - 32 }]} resizeMode="cover" />
        ) : null}
        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
          {item.externalLink ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => item.externalLink && Linking.openURL(item.externalLink)}
            >
              <Text style={styles.linkButtonText}>View link</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
      ) : null}

      {/* Calendar icon + Latest / Popular */}
      {(user || events.length > 0) && (
        <View style={styles.sortRow}>
          {user && (
            <TouchableOpacity
              style={[styles.calendarIconBtn, calendarModalOpen && styles.calendarIconBtnActive]}
              onPress={() => setCalendarModalOpen(true)}
              accessibilityLabel="Calendar"
            >
              <CalendarEventIcon width={22} height={22} fill={calendarModalOpen ? '#087990' : '#6c757d'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.sortPill, feedSort === 'latest' && styles.sortPillActive]}
            onPress={() => setFeedSort('latest')}
          >
            <Text style={[styles.sortPillText, feedSort === 'latest' && styles.sortPillTextActive]}>
              Latest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortPill, feedSort === 'popular' && styles.sortPillActive]}
            onPress={() => setFeedSort('popular')}
          >
            <Text style={[styles.sortPillText, feedSort === 'popular' && styles.sortPillTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : sortedEvents.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No news yet.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  categoriesStrip: {
    maxHeight: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: 'transparent',
    borderColor: '#212529',
  },
  sortPillText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  sortPillTextActive: {
    color: '#212529',
    fontWeight: '500',
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
});
