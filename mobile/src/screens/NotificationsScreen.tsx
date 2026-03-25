import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { userNotificationsService, type UserNotificationInboxItem } from '../services/userNotifications';
import { imageSrc } from '../utils/image';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

function NotificationInboxRow({
  item,
  onPress,
}: {
  item: UserNotificationInboxItem;
  onPress: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const schoolName = item.schoolName?.trim() || 'School';
  const showLogo = Boolean(item.schoolLogoUrl?.trim()) && !logoFailed;
  const logoUri = showLogo ? imageSrc(item.schoolLogoUrl!) : '';
  const unread = !item.readAt;

  useEffect(() => {
    setLogoFailed(false);
  }, [item.id, item.schoolLogoUrl]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.row, unread && styles.rowUnread]}
    >
      {showLogo && logoUri ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.logo}
          resizeMode="cover"
          onError={(e) => {
            if (__DEV__) {
              console.warn('[NotificationInboxRow] logo load failed', logoUri, e.nativeEvent);
            }
            setLogoFailed(true);
          }}
        />
      ) : (
        <View style={styles.logoPh}>
          <Text style={styles.logoLetter}>{schoolName.charAt(0)?.toUpperCase() ?? '?'}</Text>
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={[styles.rowTop, unread && styles.rowTopUnread]} numberOfLines={1}>
          From {schoolName}
        </Text>
        <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={2}>
          {item.body || item.title}
        </Text>
        <Text style={styles.rowTime}>{new Date(item.deliveredAt).toLocaleString()}</Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<UserNotificationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await userNotificationsService.getInbox();
      setItems(Array.isArray(list) ? list : []);
      setError(null);
    } catch (e) {
      if (__DEV__) {
        console.warn('[NotificationsScreen] inbox load failed', e);
      }
      setItems([]);
      setError('Could not load notifications. Pull down to try again.');
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

  const unreadCount = useMemo(
    () => items.reduce((acc, item) => acc + (item.readAt ? 0 : 1), 0),
    [items],
  );

  const markAllAsRead = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await userNotificationsService.markAllRead();
      setItems((prev) => prev.map((it) => ({ ...it, readAt: it.readAt || new Date().toISOString() })));
    } catch {
      Alert.alert('Could not update', 'Please try again.');
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, unreadCount]);

  const markOneRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, readAt: it.readAt || new Date().toISOString() } : it)));
    void userNotificationsService.markRead(id);
  }, []);

  const renderItem = ({ item }: { item: UserNotificationInboxItem }) => (
    <NotificationInboxRow
      item={item}
      onPress={() => {
        if (!item.readAt) markOneRead(item.id);
        navigation.navigate('MainTabs', { screen: 'Events' });
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.topBar}>
        <Text style={styles.countText}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          style={[styles.markAllBtn, (markingAll || unreadCount === 0) && styles.markAllBtnDisabled]}
        >
          <Text style={styles.markAllBtnText}>{markingAll ? 'Updating…' : 'Mark all as read'}</Text>
        </TouchableOpacity>
      </View>
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              void load();
            }}
          >
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
              No notifications yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  markAllBtn: {
    borderWidth: 1,
    borderColor: '#dbe4ff',
    backgroundColor: '#f3f6ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllBtnDisabled: {
    opacity: 0.5,
  },
  markAllBtnText: {
    color: '#2f56b0',
    fontSize: 12,
    fontWeight: '700',
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
  rowUnread: {
    borderColor: '#dbe4ff',
    backgroundColor: '#f8faff',
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
  rowTop: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  rowTopUnread: {
    color: '#0f172a',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  rowTitleUnread: {
    color: '#111827',
    fontWeight: '700',
  },
  rowTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0d6efd',
    marginLeft: 4,
  },
});
