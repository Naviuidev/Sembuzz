import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { imageSrc, isImageIconValue } from '../utils/image';
import {
  listStudentChatGroupInbox,
  type StudentChatGroupInboxItem,
} from '../services/studentChatGroups';
import { listClubGroupChats, type ClubGroupChatPublic } from '../services/clubGroupChat';
import type { RootStackParamList } from '../navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const SURFACE = '#f8f9fb';
const BORDER = '#e8ecf1';

type ChatGroupRow = {
  id: string;
  kind: 'student' | 'club';
  name: string;
  iconUrl?: string;
  iconEmoji?: string;
  typeLabel: 'Public' | 'Private' | 'Club';
  subtitle: string;
  isMember: boolean;
  unreadCount: number;
  sortAt: number;
  studentGroup?: StudentChatGroupInboxItem;
  clubGroup?: ClubGroupChatPublic;
};

function GroupAvatar({
  name,
  iconUrl,
  iconEmoji,
}: {
  name: string;
  iconUrl?: string;
  iconEmoji?: string;
}) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || '?';

  if (iconUrl && !failed) {
    return (
      <Image
        source={{ uri: iconUrl }}
        style={styles.avatar}
        onError={() => setFailed(true)}
      />
    );
  }

  if (iconEmoji && !isImageIconValue(iconEmoji)) {
    return (
      <View style={[styles.avatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarEmoji}>{iconEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarLetter}>{letter}</Text>
    </View>
  );
}

function TypeBadge({ label }: { label: ChatGroupRow['typeLabel'] }) {
  const isPublic = label === 'Public';
  const isPrivate = label === 'Private';
  return (
    <View
      style={[
        styles.typeBadge,
        isPublic && styles.typeBadgePublic,
        isPrivate && styles.typeBadgePrivate,
        label === 'Club' && styles.typeBadgeClub,
      ]}
    >
      <Text
        style={[
          styles.typeBadgeText,
          isPublic && styles.typeBadgeTextPublic,
          isPrivate && styles.typeBadgeTextPrivate,
          label === 'Club' && styles.typeBadgeTextClub,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentInbox, setStudentInbox] = useState<StudentChatGroupInboxItem[]>([]);
  const [clubGroups, setClubGroups] = useState<ClubGroupChatPublic[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setStudentInbox([]);
      setClubGroups([]);
      setError(null);
      return;
    }

    try {
      const [inbox, clubs] = await Promise.all([
        listStudentChatGroupInbox().catch(() => [] as StudentChatGroupInboxItem[]),
        listClubGroupChats().catch(() => [] as ClubGroupChatPublic[]),
      ]);
      setStudentInbox(inbox);
      setClubGroups(clubs);
      setError(null);
    } catch {
      setError('Unable to load chat groups right now.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const rows = useMemo((): ChatGroupRow[] => {
    const q = search.trim().toLowerCase();
    const merged: ChatGroupRow[] = [];

    for (const g of studentInbox) {
      if (q && !g.name.toLowerCase().includes(q)) continue;
      merged.push({
        id: `student-${g.id}`,
        kind: 'student',
        name: g.name,
        iconUrl: g.avatarUrl ? imageSrc(g.avatarUrl) : undefined,
        typeLabel: g.visibility === 'private' ? 'Private' : 'Public',
        subtitle: g.lastMessagePreview
          ? g.lastMessageSenderName
            ? `${g.lastMessageSenderName}: ${g.lastMessagePreview}`
            : g.lastMessagePreview
          : `${g.memberCount} member${g.memberCount === 1 ? '' : 's'}`,
        isMember: true,
        unreadCount: g.unreadCount,
        sortAt: new Date(g.lastMessageAt).getTime() || 0,
        studentGroup: g,
      });
    }

    for (const g of clubGroups) {
      if (q && !g.pageName.toLowerCase().includes(q)) continue;
      const iconUrl =
        g.icon && isImageIconValue(g.icon) ? imageSrc(g.icon) : undefined;
      merged.push({
        id: `club-${g.id}`,
        kind: 'club',
        name: g.pageName,
        iconUrl,
        iconEmoji: !iconUrl ? g.icon : undefined,
        typeLabel: 'Club',
        subtitle: 'Official school club group',
        isMember: true,
        unreadCount: 0,
        sortAt: 0,
        clubGroup: g,
      });
    }

    return merged.sort((a, b) => b.sortAt - a.sortAt);
  }, [search, studentInbox, clubGroups]);

  const openLogin = useCallback(() => {
    tabNavigation.navigate('Settings', {
      screen: 'SettingsMain',
      params: { openLogin: true },
    });
  }, [tabNavigation]);

  const openGroup = useCallback(
    async (row: ChatGroupRow) => {
      if (!user) {
        openLogin();
        return;
      }

      if (row.kind === 'club' && row.clubGroup) {
        rootNavigation.navigate('ClubGroupChat', {
          groupChatId: row.clubGroup.id,
          pageName: row.clubGroup.pageName,
          icon: row.clubGroup.icon,
          messageMode: row.clubGroup.messageMode ?? 'members',
        });
        return;
      }

      const group = row.studentGroup;
      if (!group) return;

      rootNavigation.navigate('StudentGroupChat', {
        groupId: group.id,
        groupName: group.name,
        visibility: group.visibility,
      });
    },
    [user, openLogin, rootNavigation, load],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatGroupRow }) => (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.75}
        onPress={() => void openGroup(item)}
      >
          <GroupAvatar name={item.name} iconUrl={item.iconUrl} iconEmoji={item.iconEmoji} />
          <View style={styles.rowBody}>
            <View style={styles.rowTitleRow}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <TypeBadge label={item.typeLabel} />
            </View>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          {item.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color="#c5cdd8" />
        )}
      </TouchableOpacity>
    ),
    [openGroup],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSubtitle}>Your group conversations</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search group name"
          placeholderTextColor="#9aa3af"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {!user ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={36} color={TEXT_DARK} />
          </View>
          <Text style={styles.emptyTitle}>Sign in to view chats</Text>
          <Text style={styles.emptyText}>
            Join public and private groups when your subcategory admin adds you, or chat in school club groups.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openLogin} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : loading && rows.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={TEXT_DARK} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={rows.length === 0 ? styles.listEmptyContent : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={34} color={TEXT_DARK} />
              </View>
              <Text style={styles.emptyTitle}>No groups found</Text>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Try a different search term.'
                  : 'Groups you are added to will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: TEXT_DARK,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: TEXT_MUTED,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listEmptyContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eef1f6',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  rowSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgePublic: {
    backgroundColor: '#e8f5ee',
  },
  typeBadgePrivate: {
    backgroundColor: '#fff3e6',
  },
  typeBadgeClub: {
    backgroundColor: '#eef2ff',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeBadgeTextPublic: {
    color: '#1f7a4d',
  },
  typeBadgeTextPrivate: {
    color: '#b45309',
  },
  typeBadgeTextClub: {
    color: '#4338ca',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#25d366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: TEXT_DARK,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#fde8e8',
    padding: 12,
    borderRadius: 12,
  },
  errorBannerText: {
    color: '#b42318',
    fontSize: 13,
    textAlign: 'center',
  },
});
