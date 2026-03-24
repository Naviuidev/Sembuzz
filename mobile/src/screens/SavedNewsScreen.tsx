import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { userEventsService, type SavedEventItem } from '../services/userEvents';
import { imageSrc } from '../utils/image';
import { UserBookmarkedEventDetailModal } from '../components/UserBookmarkedEventDetail';

export default function SavedNewsScreen() {
  const [items, setItems] = useState<SavedEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedEventItem | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await userEventsService.getSavedEvents();
      setItems(Array.isArray(list) ? list : []);
      setError(null);
    } catch {
      setItems([]);
      setError('Could not load saved news. Pull to try again.');
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

  const renderItem = ({ item }: { item: SavedEventItem }) => {
    const schoolName = item.school?.name ?? 'School';
    const schoolLogo = item.school?.image ?? null;
    const sub = item.school?.city ?? item.school?.name ?? item.subCategory?.name ?? '—';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => setSelected(item)}
        activeOpacity={0.7}
      >
        {schoolLogo ? (
          <Image source={{ uri: imageSrc(schoolLogo) }} style={styles.logo} />
        ) : (
          <View style={styles.logoPh}>
            <Text style={styles.logoLetter}>{schoolName.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No saved news yet. Save posts from your home feed to see them here.
            </Text>
          }
        />
      )}
      <UserBookmarkedEventDetailModal visible={!!selected} event={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
    padding: 16,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoPh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c757d',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
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
});
