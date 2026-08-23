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
import { Ionicons } from '@expo/vector-icons';
import { imageSrc, isImageIconValue } from '../utils/image';
import {
  joinStudentChatGroup,
  listDiscoverableStudentChatGroups,
  type StudentChatGroupInboxItem,
} from '../services/studentChatGroups';
import {
  listJoinableClubGroupChats,
  requestJoinClubGroup,
  type ClubGroupChatPublic,
} from '../services/clubGroupChat';
import {
  acceptDirectChatRequest,
  getDirectChatAvailability,
  getDirectChatUnreadCount,
  listDirectChatInbox,
  listDirectChatStudents,
  sendDirectChatRequest,
  type DirectChatInboxItem,
  type DirectChatStudentRow,
  type DirectChatUser,
} from '../services/directChat';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const SURFACE = '#f8f9fb';
const BORDER = '#e8ecf1';

type FilterTab = 'all' | 'joined' | 'my-chats';

export type ChatGroupListItem = {
  id: string;
  kind: 'student' | 'club';
  name: string;
  subtitle: string;
  visibility: 'public' | 'private' | 'club';
  avatarUrl?: string | null;
  clubIcon?: string;
  isMember: boolean;
  membershipStatus?: 'pending' | 'approved' | 'banned' | null;
  studentGroup?: StudentChatGroupInboxItem;
  clubGroup?: ClubGroupChatPublic & {
    membershipStatus: 'pending' | 'approved' | 'banned' | null;
  };
};

function GroupAvatar({
  name,
  avatarUrl,
  clubIcon,
}: {
  name: string;
  avatarUrl?: string | null;
  clubIcon?: string;
}) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const url = avatarUrl ? imageSrc(avatarUrl) : '';

  if (url && !failed) {
    return (
      <Image source={{ uri: url }} style={styles.avatar} onError={() => setFailed(true)} />
    );
  }

  if (clubIcon && !isImageIconValue(clubIcon)) {
    return (
      <View style={[styles.avatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarEmoji}>{clubIcon}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarLetter}>{letter}</Text>
    </View>
  );
}

function StudentAvatar({ user, size = 44 }: { user: DirectChatUser; size?: number }) {
  const [failed, setFailed] = useState(false);
  const url = user.profilePicUrl ? imageSrc(user.profilePicUrl) : '';
  const letter = user.name.trim().charAt(0).toUpperCase() || '?';

  if (url && !failed) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eef1f6' }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#eef1f6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontWeight: '700', color: TEXT_DARK, fontSize: size * 0.38 }}>{letter}</Text>
    </View>
  );
}

interface ChatGroupsViewProps {
  onOpenGroup: (item: ChatGroupListItem) => void;
  onOpenDirectChat: (conversation: { conversationId: string; peer: DirectChatUser }) => void;
  onSignIn?: () => void;
  isLoggedIn: boolean;
}

export function ChatGroupsView({
  onOpenGroup,
  onOpenDirectChat,
  onSignIn,
  isLoggedIn,
}: ChatGroupsViewProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [actingOnUserId, setActingOnUserId] = useState<string | null>(null);

  const [studentGroups, setStudentGroups] = useState<StudentChatGroupInboxItem[]>([]);
  const [clubGroups, setClubGroups] = useState<
    Array<
      ClubGroupChatPublic & {
        membershipStatus: 'pending' | 'approved' | 'banned' | null;
      }
    >
  >([]);
  const [students, setStudents] = useState<DirectChatStudentRow[]>([]);
  const [directAvailable, setDirectAvailable] = useState<boolean | null>(null);
  const [myChatsUnread, setMyChatsUnread] = useState(0);
  const [pendingIncoming, setPendingIncoming] = useState<DirectChatInboxItem[]>([]);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setStudentGroups([]);
      setClubGroups([]);
      setStudents([]);
      return;
    }

    try {
      const availability = await getDirectChatAvailability().catch(() => ({ available: false }));
      setDirectAvailable(availability.available);

      if (filterTab === 'my-chats') {
        if (!availability.available) {
          setStudents([]);
          setPendingIncoming([]);
          return;
        }
        const [studentRows, unread, inbox] = await Promise.all([
          listDirectChatStudents(search.trim() || undefined).catch(() => []),
          getDirectChatUnreadCount().catch(() => ({ unreadCount: 0, pendingIncomingCount: 0 })),
          listDirectChatInbox().catch(() => [] as DirectChatInboxItem[]),
        ]);
        setStudents(studentRows);
        setMyChatsUnread(unread.unreadCount);
        setPendingIncoming(
          inbox.filter((item) => item.peerStatus === 'pending_incoming'),
        );
        return;
      }

      const [discover, clubs, unread] = await Promise.all([
        listDiscoverableStudentChatGroups().catch(() => []),
        listJoinableClubGroupChats().catch(() => []),
        availability.available
          ? getDirectChatUnreadCount().catch(() => ({ unreadCount: 0, pendingIncomingCount: 0 }))
          : Promise.resolve({ unreadCount: 0, pendingIncomingCount: 0 }),
      ]);
      setStudentGroups(discover);
      setClubGroups(clubs);
      setMyChatsUnread(unread.unreadCount);
      setActionError(null);
    } catch {
      setActionError('Unable to load chat groups right now.');
    }
  }, [filterTab, isLoggedIn, search]);

  React.useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const allItems = useMemo((): ChatGroupListItem[] => {
    const studentRows: ChatGroupListItem[] = studentGroups.map((g) => {
      const typeLabel = g.visibility === 'private' ? 'Private' : 'Public';
      return {
        id: `student-${g.id}`,
        kind: 'student',
        name: g.name,
        subtitle: `${typeLabel} · ${g.memberCount} member${g.memberCount === 1 ? '' : 's'}`,
        visibility: g.visibility,
        avatarUrl: g.avatarUrl,
        isMember: g.isMember === true,
        studentGroup: g,
      };
    });

    const clubRows: ChatGroupListItem[] = clubGroups.map((c) => ({
      id: `club-${c.id}`,
      kind: 'club',
      name: c.pageName || 'Club',
      subtitle: 'Club · Official school group',
      visibility: 'club',
      avatarUrl: c.icon && isImageIconValue(c.icon) ? c.icon : null,
      clubIcon: c.icon && !isImageIconValue(c.icon) ? c.icon : undefined,
      isMember: c.membershipStatus === 'approved',
      membershipStatus: c.membershipStatus,
      clubGroup: c,
    }));

    return [...studentRows, ...clubRows];
  }, [studentGroups, clubGroups]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (filterTab === 'joined' && !g.isMember) return false;
      return true;
    });
  }, [allItems, search, filterTab]);

  const filteredStudents = useMemo(() => {
    if (filterTab !== 'my-chats') return [];
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (row) =>
        row.user.name.toLowerCase().includes(q) ||
        row.user.email.toLowerCase().includes(q),
    );
  }, [students, search, filterTab]);

  const handleJoinGroup = async (item: ChatGroupListItem) => {
    setSuccessMessage(null);
    setActionError(null);
    if (item.kind === 'student' && item.studentGroup) {
      setJoiningId(item.studentGroup.id);
      try {
        const updated = await joinStudentChatGroup(item.studentGroup.id);
        setSuccessMessage(`Joined ${updated.name ?? item.name}.`);
        await load();
        onOpenGroup({
          ...item,
          isMember: true,
          studentGroup: { ...item.studentGroup, ...updated, isMember: true },
        });
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not join group.';
        setActionError(typeof msg === 'string' ? msg : 'Could not join group.');
      } finally {
        setJoiningId(null);
      }
      return;
    }

    if (item.kind === 'club' && item.clubGroup) {
      setJoiningId(`club-${item.clubGroup.id}`);
      try {
        await requestJoinClubGroup(item.clubGroup.id);
        setSuccessMessage('Join request sent. A subcategory admin will review your request.');
        await load();
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not send join request.';
        setActionError(typeof msg === 'string' ? msg : 'Could not send join request.');
      } finally {
        setJoiningId(null);
      }
    }
  };

  const handleSendRequest = async (row: DirectChatStudentRow) => {
    setActingOnUserId(row.user.id);
    setActionError(null);
    try {
      await sendDirectChatRequest(row.user.id);
      setSuccessMessage('Chat request sent.');
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send request.';
      setActionError(typeof msg === 'string' ? msg : 'Could not send request.');
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleAcceptRequest = async (conversationId: string, peer: DirectChatUser) => {
    setActingOnUserId(peer.id);
    setActionError(null);
    try {
      await acceptDirectChatRequest(conversationId);
      setSuccessMessage('Request accepted.');
      onOpenDirectChat({ conversationId, peer });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not accept request.';
      setActionError(typeof msg === 'string' ? msg : 'Could not accept request.');
    } finally {
      setActingOnUserId(null);
    }
  };

  React.useEffect(() => {
    if (directAvailable === false && filterTab === 'my-chats') {
      setFilterTab('all');
    }
  }, [directAvailable, filterTab]);

  const tabs = useMemo((): { id: FilterTab; label: string; badge?: number }[] => {
    const base: { id: FilterTab; label: string; badge?: number }[] = [
      { id: 'all', label: 'All' },
      { id: 'joined', label: 'Joined' },
    ];
    if (directAvailable === true) {
      base.push({
        id: 'my-chats',
        label: 'My Chats',
        badge: myChatsUnread > 0 ? myChatsUnread : undefined,
      });
    }
    return base;
  }, [directAvailable, myChatsUnread]);

  const renderGroupRow = (item: ChatGroupListItem) => {
    const joining =
      item.kind === 'student'
        ? joiningId === item.studentGroup?.id
        : joiningId === `club-${item.clubGroup?.id}`;
    const isPending = item.membershipStatus === 'pending';

    return (
      <View key={item.id} style={styles.row}>
        <GroupAvatar name={item.name} avatarUrl={item.avatarUrl} clubIcon={item.clubIcon} />
        <TouchableOpacity
          style={styles.rowBody}
          disabled={!item.isMember}
          activeOpacity={item.isMember ? 0.75 : 1}
          onPress={() => item.isMember && onOpenGroup(item)}
        >
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </TouchableOpacity>
        {item.isMember ? (
          <TouchableOpacity onPress={() => onOpenGroup(item)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color="#c5cdd8" />
          </TouchableOpacity>
        ) : item.visibility === 'private' ? (
          <Ionicons name="lock-closed" size={16} color="#9aa3af" />
        ) : isPending ? (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
            disabled={joining}
            onPress={() => void handleJoinGroup(item)}
          >
            <Text style={styles.joinBtnText}>{joining ? '…' : 'Join'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderStudentRow = (row: DirectChatStudentRow) => {
    const { user, peerStatus, conversationId } = row;
    const isConnected = peerStatus === 'accepted';
    const acting = actingOnUserId === user.id;

    return (
      <View key={user.id} style={styles.row}>
        <StudentAvatar user={user} />
        <TouchableOpacity
          style={styles.rowBody}
          disabled={!isConnected}
          onPress={() => {
            if (isConnected && conversationId) {
              onOpenDirectChat({ conversationId, peer: user });
            }
          }}
        >
          <Text style={styles.rowTitle} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {isConnected ? 'Connected' : user.email}
          </Text>
        </TouchableOpacity>
        {isConnected && conversationId ? (
          <TouchableOpacity
            onPress={() => onOpenDirectChat({ conversationId, peer: user })}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={18} color="#c5cdd8" />
          </TouchableOpacity>
        ) : peerStatus === 'pending_incoming' && conversationId ? (
          <TouchableOpacity
            style={[styles.joinBtn, acting && styles.joinBtnDisabled]}
            disabled={acting}
            onPress={() => void handleAcceptRequest(conversationId, user)}
          >
            <Text style={styles.joinBtnText}>{acting ? '…' : 'Accept'}</Text>
          </TouchableOpacity>
        ) : peerStatus === 'pending_outgoing' ? (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, acting && styles.joinBtnDisabled]}
            disabled={acting}
            onPress={() => void handleSendRequest(row)}
          >
            <Text style={styles.joinBtnText}>{acting ? '…' : 'Request'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="chatbubbles-outline" size={36} color={TEXT_DARK} />
        </View>
        <Text style={styles.emptyTitle}>Sign in to view chats</Text>
        <Text style={styles.emptyText}>
          Browse and join public groups, chat with classmates, and message in club groups.
        </Text>
        {onSignIn ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={onSignIn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const searchPlaceholder =
    filterTab === 'my-chats' ? 'Search students…' : 'Search groups…';

  type ListRow =
    | { type: 'group'; row: ChatGroupListItem }
    | { type: 'student'; row: DirectChatStudentRow };

  const listData: ListRow[] =
    filterTab === 'my-chats'
      ? filteredStudents.map((s) => ({ type: 'student' as const, row: s }))
      : filteredGroups.map((g) => ({ type: 'group' as const, row: g }));

  return (
    <View style={styles.wrap}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = filterTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => {
                setFilterTab(tab.id);
                setActionError(null);
                setSuccessMessage(null);
              }}
            >
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {tab.label}
                {tab.badge ? ` (${tab.badge > 99 ? '99+' : tab.badge})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9aa3af"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {successMessage ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}
      {actionError ? (
        <View style={styles.errorBannerInline}>
          <Text style={styles.errorBannerInlineText}>{actionError}</Text>
        </View>
      ) : null}

      {loading && listData.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={TEXT_DARK} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) =>
            item.type === 'group' ? item.row.id : `student-${item.row.user.id}`
          }
          renderItem={({ item }) =>
            item.type === 'group' ? renderGroupRow(item.row) : renderStudentRow(item.row)
          }
          contentContainerStyle={listData.length === 0 ? styles.listEmptyContent : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListHeaderComponent={
            filterTab === 'my-chats' && pendingIncoming.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Chat requests</Text>
                {pendingIncoming.map((req) => (
                  <View key={req.id} style={styles.row}>
                    <StudentAvatar user={req.otherUser} />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{req.otherUser.name}</Text>
                      <Text style={styles.rowSubtitle}>Wants to chat with you</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinBtn}
                      disabled={actingOnUserId === req.otherUser.id}
                      onPress={() => void handleAcceptRequest(req.id, req.otherUser)}
                    >
                      <Text style={styles.joinBtnText}>
                        {actingOnUserId === req.otherUser.id ? '…' : 'Accept'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>
                {filterTab === 'my-chats' ? 'No students found' : 'No groups found'}
              </Text>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Try a different search term.'
                  : filterTab === 'joined'
                    ? 'Groups you join will appear here.'
                    : filterTab === 'my-chats'
                      ? 'Search for classmates to start a chat request.'
                      : 'Public groups from your school will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: TEXT_DARK,
    borderColor: TEXT_DARK,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabBtnTextActive: {
    color: '#fff',
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  listEmptyContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  sectionBlock: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
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
  avatarLetter: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  avatarEmoji: { fontSize: 22 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: TEXT_DARK, marginBottom: 4 },
  rowSubtitle: { fontSize: 13, color: TEXT_MUTED },
  joinBtn: {
    backgroundColor: TEXT_DARK,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  joinBtnDisabled: { opacity: 0.6 },
  joinBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pendingPill: {
    backgroundColor: '#eef1f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingPillText: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
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
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  successBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#e8f5ee',
    padding: 10,
    borderRadius: 10,
  },
  successBannerText: { color: '#1f7a4d', fontSize: 13, textAlign: 'center' },
  errorBannerInline: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fde8e8',
    padding: 10,
    borderRadius: 10,
  },
  errorBannerInlineText: { color: '#b42318', fontSize: 13, textAlign: 'center' },
});
