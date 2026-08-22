import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  getUniversityCardTitle,
  listPublicUniversities,
  type PublicUniversity,
} from '../services/publicUniversities';
import type { RootStackParamList } from '../navigation/types';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

function UniversityLogo({ uni }: { uni: PublicUniversity }) {
  const title = getUniversityCardTitle(uni);
  const [failed, setFailed] = useState(false);
  const initial = title.trim().charAt(0).toUpperCase() || '?';

  if (uni.logoUrl && !failed) {
    return (
      <Image
        source={{ uri: uni.logoUrl }}
        style={styles.logo}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.logo, styles.logoPlaceholder]}>
      <Text style={styles.logoLetter}>{initial}</Text>
    </View>
  );
}

export default function UniversitiesScreen() {
  const tabNavigation = useNavigation();
  const navigation = tabNavigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const openAllUniversityEvents = () => {
    navigation?.navigate('AllUniversityEvents');
  };

  const openUniversity = (uni: PublicUniversity) => {
    navigation?.navigate('UniversityEvents', {
      universityId: uni.id,
      universityName: getUniversityCardTitle(uni),
    });
  };
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<PublicUniversity[]>([]);

  const load = useCallback(async () => {
    try {
      const rows = await listPublicUniversities();
      setUniversities(rows);
      setError(null);
    } catch {
      setError('Unable to load universities right now.');
      setUniversities([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => {
      const title = getUniversityCardTitle(u).toLowerCase();
      const isScraped = u.feedKind === 'scraped';
      if (q === 'scraped' || q === 'url' || q === 'feed') return isScraped;
      return (
        title.includes(q) ||
        u.universityName.toLowerCase().includes(q) ||
        u.url.toLowerCase().includes(q)
      );
    });
  }, [universities, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Universities</Text>
          <TouchableOpacity
            style={styles.allEventsBtn}
            onPress={openAllUniversityEvents}
            activeOpacity={0.85}
          >
            <Text style={styles.allEventsBtnText}>All university events</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Browse events synced from university and calendar pages.
        </Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search universities…"
            placeholderTextColor="#9aa3af"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading && filtered.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEXT_DARK} />
        </View>
      ) : error && filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No universities match your search.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const title = getUniversityCardTitle(item);
            const lastSync = item.lastSyncedAt
              ? new Date(item.lastSyncedAt).toLocaleString()
              : 'Not synced yet';
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openUniversity(item)}
              >
                <UniversityLogo uni={item} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.totalEvents} event{item.totalEvents === 1 ? '' : 's'} · Last sync {lastSync}
                  </Text>
                  {item.feedKind === 'scraped' ? (
                    <Text style={styles.scrapedBadge}>Synced feed</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#c5cdd8" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '600', color: TEXT_DARK, flex: 1 },
  allEventsBtn: {
    borderWidth: 1,
    borderColor: '#2D6BFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  allEventsBtnText: { fontSize: 12, fontWeight: '600', color: '#2D6BFF' },
  subtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 12, lineHeight: 20 },
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
  },
  searchInput: { flex: 1, fontSize: 15, color: TEXT_DARK, padding: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  logoPlaceholder: {
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 22, fontWeight: '700', color: '#2D6BFF' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: TEXT_DARK, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: TEXT_MUTED },
  scrapedBadge: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#4338ca',
    textTransform: 'uppercase',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: TEXT_MUTED, textAlign: 'center' },
  errorText: { color: '#b42318', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: TEXT_DARK,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
