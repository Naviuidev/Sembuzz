import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatUniversityEventDate,
  getPublicUniversity,
  listPublicUniversityEvents,
  type PublicUniversity,
  type PublicUniversityEvent,
} from '../services/publicUniversities';
import type { RootStackParamList } from '../navigation/types';

type UniversityEventsRoute = RouteProp<RootStackParamList, 'UniversityEvents'>;

type ViewFilter = 'all' | 'upcoming' | 'latest' | 'trending';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

function EventCard({ event }: { event: PublicUniversityEvent }) {
  const dateLabel =
    formatUniversityEventDate(event.startDate, event.rawDateText) ||
    event.rawDateText ||
    'Date TBD';
  const link = event.detailUrl || event.registrationLink;

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.category}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.eventDate}>{dateLabel}{event.rawTimeText ? ` · ${event.rawTimeText}` : ''}</Text>
      {event.venue ? <Text style={styles.eventMeta}>📍 {event.venue}</Text> : null}
      {(event.summary || event.description) ? (
        <Text style={styles.eventDesc} numberOfLines={4}>
          {event.summary || event.description}
        </Text>
      ) : null}
      {link ? (
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL(link).catch(() => {})}
          activeOpacity={0.85}
        >
          <Text style={styles.linkBtnText}>Open event</Text>
          <Ionicons name="open-outline" size={14} color="#2D6BFF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function UniversityEventsScreen() {
  const route = useRoute<UniversityEventsRoute>();
  const { universityId } = route.params;

  const [university, setUniversity] = useState<PublicUniversity | null>(null);
  const [events, setEvents] = useState<PublicUniversityEvent[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<ViewFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const [uni, result] = await Promise.all([
        getPublicUniversity(universityId),
        listPublicUniversityEvents(universityId, {
          search: debouncedSearch || undefined,
          category: category || undefined,
          upcoming: view === 'upcoming',
          latest: view === 'latest',
          trending: view === 'trending',
          sort: 'startDate',
          order: 'asc',
          pageSize: 48,
        }),
      ]);
      setUniversity(uni);
      setEvents(result.items);
      setCategories(result.categories);
      setError(null);
    } catch {
      setError('Could not load university events.');
    }
  }, [universityId, debouncedSearch, category, view]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const viewTabs: { id: ViewFilter; label: string }[] = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'upcoming', label: 'Upcoming' },
      { id: 'latest', label: 'Latest' },
      { id: 'trending', label: 'Trending' },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        {university ? (
          <Text style={styles.uniMeta}>
            {university.totalEvents} stored event{university.totalEvents === 1 ? '' : 's'}
            {university.lastSyncedAt
              ? ` · Synced ${new Date(university.lastSyncedAt).toLocaleString()}`
              : ''}
          </Text>
        ) : null}

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search events…"
            placeholderTextColor="#9aa3af"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {viewTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, view === tab.id && styles.tabBtnActive]}
              onPress={() => setView(tab.id)}
            >
              <Text style={[styles.tabBtnText, view === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            <TouchableOpacity
              style={[styles.chip, !category && styles.chipActive]}
              onPress={() => setCategory('')}
            >
              <Text style={[styles.chipText, !category && styles.chipTextActive]}>All categories</Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[styles.chip, category === c.name && styles.chipActive]}
                onPress={() => setCategory(c.name)}
              >
                <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>
                  {c.name} ({c.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEXT_DARK} />
        </View>
      ) : error && events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No events match your filters.</Text>
            </View>
          }
          renderItem={({ item }) => <EventCard event={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  uniMeta: { fontSize: 13, color: TEXT_MUTED, marginBottom: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ecf1',
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: TEXT_DARK, padding: 0 },
  tabRow: { gap: 8, paddingBottom: 8 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  tabBtnActive: { backgroundColor: TEXT_DARK, borderColor: TEXT_DARK },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  tabBtnTextActive: { color: '#fff' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  chipActive: { backgroundColor: '#eef3ff', borderColor: '#2D6BFF' },
  chipText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  chipTextActive: { color: '#2D6BFF' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  eventTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: TEXT_DARK },
  categoryBadge: {
    backgroundColor: '#eef3ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', color: '#2D6BFF', textTransform: 'uppercase' },
  eventDate: { fontSize: 13, color: TEXT_MUTED, marginBottom: 4 },
  eventMeta: { fontSize: 13, color: TEXT_MUTED, marginBottom: 6 },
  eventDesc: { fontSize: 14, color: '#2c3338', lineHeight: 20, marginBottom: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  linkBtnText: { color: '#2D6BFF', fontWeight: '600', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: TEXT_MUTED, textAlign: 'center' },
  errorText: { color: '#b42318', textAlign: 'center' },
});
