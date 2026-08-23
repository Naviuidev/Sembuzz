import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userStudentChatGroupsService } from '../services/user-student-chat-groups.service';
import { userClubGroupChatsService } from '../services/user-club-group-chats.service';
import {
  userDirectChatsService,
  USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
  type DirectChatInboxItem,
  type DirectChatStudentRow,
  type DirectChatUser,
} from '../services/user-direct-chats.service';
import { imageSrc, isImageIconValue } from '../utils/image';
import type { ChatGroupListItem } from './chat-groups.types';
import { StudentAvatar } from './DirectChatPanel';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const BORDER = '#e8ecf1';
const ACCENT = '#7c5cfc';

type FilterTab = 'all' | 'joined' | 'my-chats';
type OverlayView = 'none' | 'notifications';

export type ChatGroupsViewProps = {
  onOpenGroup: (item: ChatGroupListItem) => void;
  onOpenDirectChat?: (conversation: { conversationId: string; peer: DirectChatUser }) => void;
  onClose?: () => void;
  embedded?: boolean;
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
      <img
        src={url}
        alt=""
        className="rounded-circle flex-shrink-0"
        style={{ width: 44, height: 44, objectFit: 'cover' }}
        onError={() => setFailed(true)}
      />
    );
  }

  if (clubIcon && !isImageIconValue(clubIcon)) {
    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{
          width: 44,
          height: 44,
          backgroundColor: '#eef1f6',
          color: TEXT_DARK,
        }}
      >
        <i className={`bi ${clubIcon || 'bi-people-fill'}`} style={{ fontSize: '1.1rem' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 44,
        height: 44,
        backgroundColor: '#eef1f6',
        color: TEXT_DARK,
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      {letter}
    </div>
  );
}

function GroupRow({
  group,
  joining,
  onJoin,
  onOpen,
}: {
  group: ChatGroupListItem;
  joining: boolean;
  onJoin: (group: ChatGroupListItem) => void;
  onOpen: (group: ChatGroupListItem) => void;
}) {
  const isMember = group.isMember;
  const isPending = group.membershipStatus === 'pending';

  return (
    <div
      className="d-flex align-items-center gap-3 px-3 py-3 mx-3 mb-2"
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        backgroundColor: '#fff',
      }}
    >
      <GroupAvatar name={group.name} avatarUrl={group.avatarUrl} clubIcon={group.clubIcon} />
      <button
        type="button"
        className="flex-grow-1 min-w-0 border-0 bg-transparent p-0 text-start"
        onClick={() => (isMember ? onOpen(group) : undefined)}
        disabled={!isMember}
        style={{ cursor: isMember ? 'pointer' : 'default' }}
      >
        <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK, fontSize: '0.95rem' }}>
          {group.name}
        </div>
        <div className="small" style={{ color: TEXT_MUTED }}>
          {group.subtitle}
        </div>
      </button>
      {isMember ? (
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          onClick={() => onOpen(group)}
          aria-label={`Open ${group.name}`}
        >
          <i className="bi bi-chevron-right" style={{ color: '#c5cdd8', fontSize: '1.1rem' }} />
        </button>
      ) : group.visibility === 'private' ? (
        <i className="bi bi-lock-fill flex-shrink-0" style={{ color: '#9aa3af', fontSize: '1rem' }} />
      ) : isPending ? (
        <span
          className="btn btn-outline-secondary btn-sm rounded-pill flex-shrink-0 px-3 disabled"
          style={{ pointerEvents: 'none', opacity: 0.85 }}
        >
          Pending
        </span>
      ) : (
        <button
          type="button"
          className="btn btn-dark btn-sm rounded-pill flex-shrink-0 px-3"
          disabled={joining}
          onClick={() => onJoin(group)}
        >
          {joining ? '…' : 'Join'}
        </button>
      )}
    </div>
  );
}

function MyChatStudentRow({
  row,
  acting,
  unreadCount = 0,
  onSendRequest,
  onAccept,
  onOpenChat,
}: {
  row: DirectChatStudentRow;
  acting: boolean;
  unreadCount?: number;
  onSendRequest: () => void;
  onAccept: () => void;
  onOpenChat: () => void;
}) {
  const { user, peerStatus } = row;
  const isConnected = peerStatus === 'accepted';
  const hasUnread = unreadCount > 0;

  let action: React.ReactNode;
  if (isConnected) {
    action = (
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChat();
        }}
        aria-label={`Open chat with ${user.name}`}
      >
        <i className="bi bi-chevron-right" style={{ color: '#c5cdd8', fontSize: '1.1rem' }} />
      </button>
    );
  } else if (peerStatus === 'pending_incoming') {
    action = (
      <button
        type="button"
        className="btn btn-dark btn-sm rounded-pill flex-shrink-0"
        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        disabled={acting}
        onClick={onAccept}
      >
        {acting ? '…' : 'Accept'}
      </button>
    );
  } else if (peerStatus === 'pending_outgoing') {
    action = (
      <span
        className="badge rounded-pill flex-shrink-0"
        style={{
          backgroundColor: '#eef1f6',
          color: TEXT_MUTED,
          fontWeight: 500,
          fontSize: '0.75rem',
          padding: '0.45rem 0.65rem',
          whiteSpace: 'nowrap',
        }}
      >
        Pending
      </span>
    );
  } else {
    action = (
      <button
        type="button"
        className="btn btn-dark btn-sm rounded-pill flex-shrink-0"
        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        disabled={acting}
        onClick={onSendRequest}
      >
        {acting ? '…' : 'Send request'}
      </button>
    );
  }

  return (
    <div
      role={isConnected ? 'button' : undefined}
      tabIndex={isConnected ? 0 : undefined}
      className="d-flex align-items-center gap-2 py-2 px-2 mx-2 mb-2"
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        backgroundColor: '#fff',
        cursor: isConnected ? 'pointer' : 'default',
      }}
      onClick={isConnected ? onOpenChat : undefined}
      onKeyDown={
        isConnected
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onOpenChat();
            }
          : undefined
      }
    >
      <div className="position-relative flex-shrink-0">
        <StudentAvatar user={user} size={44} />
        {hasUnread ? (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem', padding: '0.25em 0.45em' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </div>
      <div className="flex-grow-1 min-w-0" style={{ overflow: 'hidden' }}>
        <div
          className={`text-truncate ${hasUnread ? 'fw-bold' : 'fw-semibold'}`}
          style={{ color: TEXT_DARK, fontSize: '0.95rem' }}
        >
          {user.name}
        </div>
        {isConnected ? (
          <div className="small" style={{ color: hasUnread ? ACCENT : TEXT_MUTED, fontWeight: hasUnread ? 600 : 400 }}>
            {hasUnread ? `${unreadCount} new message${unreadCount === 1 ? '' : 's'}` : 'Connected'}
          </div>
        ) : null}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

function ChatRequestRow({
  item,
  acting,
  onAccept,
}: {
  item: DirectChatInboxItem;
  acting: boolean;
  onAccept: () => void;
}) {
  return (
    <div
      className="d-flex align-items-center gap-3 px-3 py-3 mx-3 mb-2"
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        backgroundColor: '#fff',
      }}
    >
      <StudentAvatar user={item.otherUser} size={44} />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK, fontSize: '0.95rem' }}>
          {item.otherUser.name}
        </div>
        <div className="small" style={{ color: TEXT_MUTED }}>
          Wants to chat with you
        </div>
      </div>
      <button
        type="button"
        className="btn btn-dark btn-sm rounded-pill flex-shrink-0 px-3"
        disabled={acting}
        onClick={onAccept}
      >
        {acting ? '…' : 'Accept'}
      </button>
    </div>
  );
}

export function ChatGroupsView({
  onOpenGroup,
  onOpenDirectChat,
  onClose,
  embedded = false,
}: ChatGroupsViewProps) {
  const queryClient = useQueryClient();
  const acceptingChatRef = useRef<{ conversationId: string; peer: DirectChatUser } | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [overlayView, setOverlayView] = useState<OverlayView>('none');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [actingOnUserId, setActingOnUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: studentGroups = [], isLoading: studentLoading } = useQuery({
    queryKey: ['user', 'student-chat-groups', 'discover'],
    queryFn: userStudentChatGroupsService.listDiscoverable,
    refetchInterval: 8000,
    enabled: filterTab !== 'my-chats' && overlayView === 'none',
  });

  const { data: clubGroups = [], isLoading: clubLoading } = useQuery({
    queryKey: ['user', 'club-group-chats', 'joinable'],
    queryFn: userClubGroupChatsService.listJoinable,
    refetchInterval: 8000,
    enabled: filterTab !== 'my-chats' && overlayView === 'none',
  });

  const { data: directAvailability } = useQuery({
    queryKey: ['user', 'direct-chats', 'availability'],
    queryFn: userDirectChatsService.getAvailability,
  });

  const { data: unreadCounts } = useQuery({
    queryKey: USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
    queryFn: userDirectChatsService.getUnreadCount,
    refetchInterval: 8000,
  });

  const { data: inbox = [], isLoading: inboxLoading } = useQuery({
    queryKey: ['user', 'direct-chats', 'inbox'],
    queryFn: userDirectChatsService.listInbox,
    enabled:
      directAvailability?.available === true &&
      (overlayView === 'none' || overlayView === 'notifications'),
    refetchInterval: 8000,
  });

  const searchQuery = search.trim();
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['user', 'direct-chats', 'students', searchQuery],
    queryFn: () => userDirectChatsService.listStudents(searchQuery || undefined),
    enabled:
      directAvailability?.available === true && filterTab === 'my-chats' && overlayView === 'none',
    refetchInterval: 8000,
  });

  const pendingIncoming = useMemo(
    () => inbox.filter((item) => item.peerStatus === 'pending_incoming'),
    [inbox],
  );

  const pendingCount = unreadCounts?.pendingIncomingCount ?? pendingIncoming.length;
  const myChatsUnreadTotal = unreadCounts?.unreadCount ?? 0;
  const showDirectMessaging = directAvailability?.available === true;

  useEffect(() => {
    if (directAvailability && !directAvailability.available && filterTab === 'my-chats') {
      setFilterTab('all');
    }
  }, [directAvailability, filterTab]);

  const unreadByUserId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inbox) {
      if (item.peerStatus === 'accepted' && item.unreadCount > 0) {
        map.set(item.otherUser.id, item.unreadCount);
      }
    }
    return map;
  }, [inbox]);

  const invalidateDirectChats = () => {
    void queryClient.invalidateQueries({ queryKey: ['user', 'direct-chats'] });
    void queryClient.invalidateQueries({ queryKey: USER_DIRECT_CHATS_UNREAD_QUERY_KEY });
  };

  const isLoading =
    filterTab === 'my-chats'
      ? studentsLoading
      : studentLoading || clubLoading;

  const allItems = useMemo((): ChatGroupListItem[] => {
    const studentRows: ChatGroupListItem[] = studentGroups.map((g) => {
      const typeLabel = g.visibility === 'private' ? 'Private' : 'Public';
      return {
        id: `student-${g.id}`,
        kind: 'student',
        name: g.name,
        subtitle: `${typeLabel} · ${g.memberCount} Member${g.memberCount === 1 ? '' : 's'}`,
        visibility: g.visibility,
        avatarUrl: g.avatarUrl,
        isMember: g.isMember === true,
        isOwner: g.isOwner === true,
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
      clubIcon: c.icon && !isImageIconValue(c.icon) ? c.icon : 'bi-people-fill',
      isMember: c.membershipStatus === 'approved',
      isOwner: false,
      membershipStatus: c.membershipStatus,
      clubGroup: c,
    }));

    return [...studentRows, ...clubRows];
  }, [studentGroups, clubGroups]);

  const joinStudentMutation = useMutation({
    mutationFn: (groupId: string) => userStudentChatGroupsService.join(groupId),
    onMutate: (groupId) => setJoiningId(groupId),
    onSettled: () => setJoiningId(null),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'student-chat-groups'] });
      const item = allItems.find((r) => r.kind === 'student' && r.studentGroup?.id === updated.id);
      if (item) onOpenGroup({ ...item, isMember: true, studentGroup: updated });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setActionError(typeof msg === 'string' ? msg : 'Could not join group.');
    },
  });

  const joinClubMutation = useMutation({
    mutationFn: (groupChatId: string) => userClubGroupChatsService.requestJoin(groupChatId),
    onMutate: (groupChatId) => setJoiningId(`club-${groupChatId}`),
    onSettled: () => setJoiningId(null),
    onSuccess: async () => {
      setActionError(null);
      setSuccessMessage('Join request sent. A subcategory admin will review your request.');
      await queryClient.invalidateQueries({ queryKey: ['user', 'club-group-chats'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setActionError(typeof msg === 'string' ? msg : 'Could not send join request.');
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (otherUserId: string) => userDirectChatsService.sendRequest(otherUserId),
    onMutate: (userId) => setActingOnUserId(userId),
    onSettled: () => setActingOnUserId(null),
    onSuccess: (result) => {
      setActionError(null);
      setSuccessMessage(result.message ?? 'Chat request sent.');
      invalidateDirectChats();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setActionError(typeof msg === 'string' ? msg : 'Could not send request.');
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (conversationId: string) => userDirectChatsService.acceptRequest(conversationId),
    onSettled: () => setActingOnUserId(null),
    onSuccess: (result) => {
      setActionError(null);
      setSuccessMessage(result.message ?? 'Request accepted.');
      invalidateDirectChats();
      const pending = acceptingChatRef.current;
      if (pending && onOpenDirectChat) {
        onOpenDirectChat(pending);
      }
      acceptingChatRef.current = null;
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setActionError(typeof msg === 'string' ? msg : 'Could not accept request.');
    },
  });

  const handleAcceptRequest = (item: DirectChatInboxItem) => {
    acceptingChatRef.current = { conversationId: item.id, peer: item.otherUser };
    setActingOnUserId(item.otherUser.id);
    acceptRequestMutation.mutate(item.id);
  };

  const handleAcceptStudentRequest = (row: DirectChatStudentRow) => {
    if (!row.conversationId) return;
    acceptingChatRef.current = { conversationId: row.conversationId, peer: row.user };
    setActingOnUserId(row.user.id);
    acceptRequestMutation.mutate(row.conversationId);
  };

  const handleOpenDirectChat = (row: DirectChatStudentRow) => {
    if (row.peerStatus !== 'accepted' || !row.conversationId) return;
    onOpenDirectChat?.({ conversationId: row.conversationId, peer: row.user });
  };

  const handleJoin = (item: ChatGroupListItem) => {
    setSuccessMessage(null);
    if (item.kind === 'student' && item.studentGroup) {
      joinStudentMutation.mutate(item.studentGroup.id);
      return;
    }
    if (item.kind === 'club' && item.clubGroup) {
      joinClubMutation.mutate(item.clubGroup.id);
    }
  };

  const filtered = useMemo(() => {
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

  const privateGroups = useMemo(
    () => filtered.filter((g) => g.visibility === 'private'),
    [filtered],
  );
  const publicGroups = useMemo(
    () => filtered.filter((g) => g.visibility === 'public' || g.visibility === 'club'),
    [filtered],
  );

  const tabs: { id: FilterTab; label: string; badge?: number }[] = useMemo(() => {
    const base: { id: FilterTab; label: string; badge?: number }[] = [
      { id: 'all', label: 'All' },
      { id: 'joined', label: 'Joined' },
    ];
    if (showDirectMessaging) {
      base.push({ id: 'my-chats', label: 'My Chats', badge: myChatsUnreadTotal });
    }
    return base;
  }, [showDirectMessaging, myChatsUnreadTotal]);

  const handleBack = () => {
    if (overlayView === 'notifications') {
      setOverlayView('none');
      setActionError(null);
      setSuccessMessage(null);
      return;
    }
    onClose?.();
  };

  const headerTitle =
    overlayView === 'notifications' ? 'Chat requests' : 'Chat Groups';

  const searchPlaceholder =
    filterTab === 'my-chats' ? 'Search students...' : 'Search groups...';

  return (
    <div className="d-flex flex-column h-100 bg-white">
      <div className="px-3 pt-3 pb-0 flex-shrink-0">
        <div className="d-flex align-items-center gap-2 mb-3">
          {onClose ? (
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={handleBack}
              aria-label={overlayView === 'notifications' ? 'Back' : 'Close'}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: TEXT_DARK }} />
            </button>
          ) : null}
          <h1
            className="h5 mb-0 flex-grow-1 text-center"
            style={{ color: TEXT_DARK, fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            {headerTitle}
          </h1>
          <div className="d-flex align-items-center gap-1">
            {overlayView === 'none' && onClose && showDirectMessaging ? (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none position-relative"
                onClick={() => {
                  setOverlayView('notifications');
                  setActionError(null);
                  setSuccessMessage(null);
                }}
                aria-label="Chat requests"
                style={{ color: TEXT_MUTED }}
              >
                <i className="bi bi-bell" style={{ fontSize: '1.1rem' }} />
                {pendingCount > 0 ? (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.55rem', padding: '0.2em 0.4em' }}
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={onClose}
                aria-label="Close"
                style={{ color: TEXT_MUTED }}
              >
                <i className="bi bi-x-lg" />
              </button>
            ) : (
              <span style={{ width: 28 }} />
            )}
          </div>
        </div>

        {overlayView === 'none' ? (
          <>
            <div
              className="d-flex align-items-center gap-2 px-3 py-2 mb-3"
              style={{
                backgroundColor: '#f8f9fb',
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
              }}
            >
              <i className="bi bi-search" style={{ color: TEXT_MUTED }} />
              <input
                type="search"
                className="border-0 bg-transparent flex-grow-1"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ outline: 'none', fontSize: '0.95rem' }}
              />
            </div>

            <div className="d-flex border-bottom" style={{ borderColor: BORDER }}>
              {tabs.map((tab) => {
                const active = filterTab === tab.id;
                const tabBadge = tab.badge ?? 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="btn btn-link flex-fill text-decoration-none py-2 position-relative"
                    onClick={() => {
                      setFilterTab(tab.id);
                      setActionError(null);
                      setSuccessMessage(null);
                    }}
                    style={{
                      color: active ? ACCENT : TEXT_MUTED,
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.95rem',
                    }}
                  >
                    <span className="position-relative d-inline-flex align-items-center gap-1">
                      {tab.label}
                      {tabBadge > 0 ? (
                        <span
                          className="badge rounded-pill bg-danger"
                          style={{ fontSize: '0.6rem', padding: '0.2em 0.45em' }}
                        >
                          {tabBadge > 99 ? '99+' : tabBadge}
                        </span>
                      ) : null}
                    </span>
                    {active ? (
                      <span
                        className="position-absolute start-50 translate-middle-x"
                        style={{
                          bottom: 0,
                          width: '65%',
                          height: 2,
                          backgroundColor: ACCENT,
                          borderRadius: 2,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-grow-1 overflow-auto pt-2" style={{ minHeight: 0 }}>
        {actionError ? (
          <div className="alert alert-danger mx-3 mt-2 py-2 small mb-0">{actionError}</div>
        ) : null}
        {successMessage ? (
          <div className="alert alert-success mx-3 mt-2 py-2 small mb-0">{successMessage}</div>
        ) : null}

        {overlayView === 'notifications' ? (
          inboxLoading ? (
            <p className="text-center text-muted py-5 mb-0">Loading requests…</p>
          ) : pendingIncoming.length === 0 ? (
            <div className="text-center px-4 py-5">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 72, height: 72, backgroundColor: '#f3f0ff' }}
              >
                <i className="bi bi-bell" style={{ fontSize: '1.75rem', color: ACCENT }} />
              </div>
              <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
                No requests
              </h2>
              <p className="small text-muted mb-0">
                When someone sends you a chat request, it will appear here.
              </p>
            </div>
          ) : (
            <section className="pt-2 pb-3">
              {pendingIncoming.map((item) => (
                <ChatRequestRow
                  key={item.id}
                  item={item}
                  acting={actingOnUserId === item.otherUser.id}
                  onAccept={() => handleAcceptRequest(item)}
                />
              ))}
            </section>
          )
        ) : filterTab === 'my-chats' ? (
          isLoading ? (
            <p className="text-center text-muted py-5 mb-0">Loading students…</p>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center px-4 py-5">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 72, height: 72, backgroundColor: '#f3f0ff' }}
              >
                <i className="bi bi-chat-heart" style={{ fontSize: '1.75rem', color: ACCENT }} />
              </div>
              <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
                No students found
              </h2>
              <p className="small text-muted mb-0">
                {search.trim()
                  ? 'Try a different search term.'
                  : 'No students are available at your school yet.'}
              </p>
            </div>
          ) : (
            <section className="pt-2 pb-3">
              {filteredStudents.map((row) => (
                <MyChatStudentRow
                  key={row.user.id}
                  row={row}
                  acting={actingOnUserId === row.user.id}
                  unreadCount={unreadByUserId.get(row.user.id) ?? 0}
                  onSendRequest={() => sendRequestMutation.mutate(row.user.id)}
                  onAccept={() => handleAcceptStudentRequest(row)}
                  onOpenChat={() => handleOpenDirectChat(row)}
                />
              ))}
            </section>
          )
        ) : isLoading ? (
          <p className="text-center text-muted py-5 mb-0">Loading groups…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center px-4 py-5">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 72, height: 72, backgroundColor: '#f3f0ff' }}
            >
              <i className="bi bi-people" style={{ fontSize: '1.75rem', color: ACCENT }} />
            </div>
            <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
              No groups found
            </h2>
            <p className="small text-muted mb-0">
              {search.trim()
                ? 'Try a different search term.'
                : 'Join a public or club group, or ask your admin to add you to a private group.'}
            </p>
          </div>
        ) : (
          <>
            {privateGroups.length > 0 ? (
              <section className="pt-2 pb-1">
                <h2 className="h6 px-3 mb-2" style={{ color: TEXT_DARK, fontWeight: 600 }}>
                  Private Groups
                </h2>
                {privateGroups.map((group) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    joining={joiningId === group.id || joiningId === group.studentGroup?.id}
                    onJoin={handleJoin}
                    onOpen={onOpenGroup}
                  />
                ))}
              </section>
            ) : null}

            {publicGroups.length > 0 ? (
              <section className="pt-2 pb-3">
                <h2 className="h6 px-3 mb-2" style={{ color: TEXT_DARK, fontWeight: 600 }}>
                  Public Groups
                </h2>
                {publicGroups.map((group) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    joining={
                      joiningId === group.id ||
                      joiningId === group.studentGroup?.id ||
                      joiningId === `club-${group.clubGroup?.id}`
                    }
                    onJoin={handleJoin}
                    onOpen={onOpenGroup}
                  />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>

      {!embedded ? <div className="flex-shrink-0" style={{ height: 8 }} /> : null}
    </div>
  );
}
