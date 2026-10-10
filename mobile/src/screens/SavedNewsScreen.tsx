import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { userEventsService, type SavedEventItem } from '../services/userEvents';
import {
  getSavedExternalPosts,
  toggleExternalFeedSave,
  type SavedExternalPostRow,
} from '../services/userExternalFeed';
import { UserBookmarkedEventDetailModal } from '../components/UserBookmarkedEventDetail';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  type SavedCollectionTab,
  filterSavedExternalByTab,
  savedExternalSubtitle,
  externalPostContentTypeLabel,
} from '../utils/savedCollections';

const TAB_CONFIG: {
  id: SavedCollectionTab;
  label: string;
  inactiveBg: string;
  inactiveText: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    id: 'news',
    label: 'School news',
    inactiveBg: '#f3f4f6',
    inactiveText: '#374151',
    activeBg: '#1a1f2e',
    activeText: '#ffffff',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    inactiveBg: '#dbeafe',
    inactiveText: '#1d4ed8',
    activeBg: '#1d4ed8',
    activeText: '#ffffff',
  },
  {
    id: 'offers',
    label: 'Offers',
    inactiveBg: '#dcfce7',
    inactiveText: '#166534',
    activeBg: '#166534',
    activeText: '#ffffff',
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    inactiveBg: '#fef3c7',
    inactiveText: '#b45309',
    activeBg: '#b45309',
    activeText: '#ffffff',
  },
];

const EMPTY_COPY: Record<SavedCollectionTab, string> = {
  news: 'No saved school news yet. Save posts from your home feed.',
  jobs: 'No saved jobs yet. Use Save on External job posts.',
  offers: 'No saved offers yet. Bookmark offers from the External feed.',
  campaigns: 'No saved campaigns yet. Bookmark campaigns from the External feed.',
};

function rowTypeBadgeStyle(contentType: string | undefined) {
  const t = (contentType ?? '').toLowerCase();
  if (t === 'job') return { bg: '#dbeafe', text: '#1d4ed8' };
  if (t === 'offer') return { bg: '#dcfce7', text: '#166534' };
  if (t === 'campaign' || t === 'event') return { bg: '#fef3c7', text: '#b45309' };
  return { bg: '#ede9fe', text: '#6d28d9' };
}

export default function SavedNewsScreen() {
  const [tab, setTab] = useState<SavedCollectionTab>('news');
  const [savedEvents, setSavedEvents] = useState<SavedEventItem[]>([]);
  const [savedExternal, setSavedExternal] = useState<SavedExternalPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SavedEventItem | null>(null);
  const [selectedExternal, setSelectedExternal] = useState<SavedExternalPostRow | null>(null);

  const load = useCallback(async () => {
    try {
      const [news, external] = await Promise.all([
        userEventsService.getSavedEvents(),
        getSavedExternalPosts(),
      ]);
      setSavedEvents(Array.isArray(news) ? news : []);
      setSavedExternal(Array.isArray(external) ? external : []);
      setError(null);
    } catch {
      setSavedEvents([]);
      setSavedExternal([]);
      setError('Could not load saved items. Pull to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const savedJobs = useMemo(() => filterSavedExternalByTab(savedExternal, 'jobs'), [savedExternal]);
  const savedOffers = useMemo(() => filterSavedExternalByTab(savedExternal, 'offers'), [savedExternal]);
  const savedCampaigns = useMemo(() => filterSavedExternalByTab(savedExternal, 'campaigns'), [savedExternal]);

  const counts = useMemo(
    () => ({
      news: savedEvents.length,
      jobs: savedJobs.length,
      offers: savedOffers.length,
      campaigns: savedCampaigns.length,
    }),
    [savedEvents.length, savedJobs.length, savedOffers.length, savedCampaigns.length],
  );

  const externalListItems = useMemo(() => {
    if (tab === 'jobs') return savedJobs;
    if (tab === 'offers') return savedOffers;
    return savedCampaigns;
  }, [tab, savedJobs, savedOffers, savedCampaigns]);

  const listItems = tab === 'news' ? savedEvents : externalListItems;

  const handleUnsaveExternal = async () => {
    if (!selectedExternal) return;
    try {
      await toggleExternalFeedSave(selectedExternal.id);
      setSelectedExternal(null);
      void load();
    } catch {
      /* ignore */
    }
  };

  const renderNewsRow = (item: SavedEventItem) => {
    const sub = item.school?.city ?? item.school?.name ?? item.subCategory?.name ?? '—';
    return (
      <TouchableOpacity style={styles.row} onPress={() => setSelectedEvent(item)} activeOpacity={0.7}>
        <SchoolLogo school={item.school} size={40} borderRadius={20} />
        <View style={styles.rowText}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: '#f3f4f6' }]}>
              <Text style={[styles.typeBadgeText, { color: '#374151' }]}>School news</Text>
            </View>
          </View>
          <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderExternalRow = (item: SavedExternalPostRow) => {
    const typeStyle = rowTypeBadgeStyle(item.contentType);
    const sub = savedExternalSubtitle(item);
    return (
      <TouchableOpacity style={styles.row} onPress={() => setSelectedExternal(item)} activeOpacity={0.7}>
        <View style={styles.externalAvatar}>
          <Ionicons name="briefcase-outline" size={20} color="#0b4a99" />
        </View>
        <View style={styles.rowText}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                {externalPostContentTypeLabel(item)}
              </Text>
            </View>
            {item.externalCategory?.name ? (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText} numberOfLines={1}>{item.externalCategory.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TAB_CONFIG.map((t) => {
          const active = tab === t.id;
          const count = counts[t.id];
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tabBadge,
                {
                  backgroundColor: active ? t.activeBg : t.inactiveBg,
                },
              ]}
              onPress={() => {
                setTab(t.id);
                setSelectedEvent(null);
                setSelectedExternal(null);
              }}
              activeOpacity={0.88}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabBadgeLabel, { color: active ? t.activeText : t.inactiveText }]}>
                {t.label}
              </Text>
              {count > 0 ? (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error && listItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'news' ? (
        <FlatList<SavedEventItem>
          data={savedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderNewsRow(item)}
          contentContainerStyle={savedEvents.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{EMPTY_COPY.news}</Text>}
        />
      ) : (
        <FlatList<SavedExternalPostRow>
          data={externalListItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderExternalRow(item)}
          contentContainerStyle={listItems.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{EMPTY_COPY[tab]}</Text>}
        />
      )}

      <UserBookmarkedEventDetailModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <Modal
        visible={!!selectedExternal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExternal(null)}
      >
        <SafeAreaView style={styles.detailSafe} edges={['top', 'bottom']}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedExternal(null)} hitSlop={8}>
              <Text style={styles.detailBack}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void handleUnsaveExternal()}>
              <Text style={styles.detailRemove}>Remove</Text>
            </TouchableOpacity>
          </View>
          {selectedExternal ? (
            <ScrollView contentContainerStyle={styles.detailScroll}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: rowTypeBadgeStyle(selectedExternal.contentType).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: rowTypeBadgeStyle(selectedExternal.contentType).text },
                    ]}
                  >
                    {externalPostContentTypeLabel(selectedExternal)}
                  </Text>
                </View>
              </View>
              <Text style={styles.detailTitle}>{selectedExternal.title}</Text>
              {selectedExternal.description ? (
                <Text style={styles.detailBody}>{selectedExternal.description}</Text>
              ) : null}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabScroll: {
    flexGrow: 0,
    maxHeight: 56,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  tabBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#404040',
  },
  tabCountTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0d6efd',
  },
  retryText: {
    color: '#0d6efd',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  externalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#f5f5f5',
    maxWidth: 120,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#525252',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  rowSub: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  chevron: {
    fontSize: 20,
    color: '#adb5bd',
  },
  detailSafe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  detailBack: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  detailRemove: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b42318',
  },
  detailScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 12,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
});
