import { useCallback, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  userClubGroupChatsService,
  type JoinableClubGroupChat,
} from '../services/user-club-group-chats.service';
import {
  userDirectChatsService,
  USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
} from '../services/user-direct-chats.service';
import { DirectChatPanel } from './DirectChatPanel';
import { imageSrc, isImageIconValue } from '../utils/image';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type BadgeId = 'group-chat' | 'your-chat';
type GroupStep = 'list' | 'detail';

interface ClubMessagingBadgesProps {
  isAuthenticated: boolean;
  currentUserId?: string | null;
  onRequireLogin: () => void;
}

export function ClubMessagingBadges({
  isAuthenticated,
  currentUserId,
  onRequireLogin,
}: ClubMessagingBadgesProps) {
  const queryClient = useQueryClient();
  const [activeBadge, setActiveBadge] = useState<BadgeId | null>(null);
  const [groupStep, setGroupStep] = useState<GroupStep>('list');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const { data: joinable = [], isLoading } = useQuery({
    queryKey: ['user', 'club-group-chats', 'joinable'],
    queryFn: userClubGroupChatsService.listJoinable,
    enabled: isAuthenticated && activeBadge === 'group-chat',
  });

  const { data: directUnread } = useQuery({
    queryKey: USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
    queryFn: userDirectChatsService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 8000 : false,
  });

  const yourChatBadgeCount =
    (directUnread?.unreadCount ?? 0) + (directUnread?.pendingIncomingCount ?? 0);

  const requestMutation = useMutation({
    mutationFn: (groupChatId: string) => userClubGroupChatsService.requestJoin(groupChatId),
    onSuccess: () => {
      setRequestMessage('Join request sent. A category admin will review your request.');
      setRequestError(null);
      void queryClient.invalidateQueries({ queryKey: ['user', 'club-group-chats', 'joinable'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setRequestError(typeof msg === 'string' ? msg : 'Could not send join request.');
    },
  });

  const closeModal = useCallback(() => {
    setActiveBadge(null);
    setGroupStep('list');
    setSelectedChatId(null);
    setRequestMessage(null);
    setRequestError(null);
  }, []);

  function openBadge(id: BadgeId) {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    setActiveBadge(id);
    setGroupStep('list');
    setSelectedChatId(null);
    setRequestMessage(null);
    setRequestError(null);
  }

  const selectedChat = joinable.find((c) => c.id === selectedChatId) ?? null;

  function selectGroup(chat: JoinableClubGroupChat) {
    setSelectedChatId(chat.id);
    setGroupStep('detail');
    setRequestMessage(null);
    setRequestError(null);
  }

  function backToList() {
    setGroupStep('list');
    setSelectedChatId(null);
    setRequestMessage(null);
    setRequestError(null);
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4 w-100">
        <button
          type="button"
          className="btn d-inline-flex align-items-center gap-2"
          style={{
            borderRadius: 999,
            padding: '0.5rem 1.1rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            backgroundColor: activeBadge === 'group-chat' ? TEXT_DARK : '#f3f4f6',
            color: activeBadge === 'group-chat' ? '#fff' : TEXT_DARK,
            border: 'none',
          }}
          onClick={() => openBadge('group-chat')}
        >
          <i className="bi bi-people-fill" aria-hidden />
          Group chat
        </button>
        <button
          type="button"
          className="btn d-inline-flex align-items-center gap-2 position-relative"
          style={{
            borderRadius: 999,
            padding: '0.5rem 1.1rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            backgroundColor: activeBadge === 'your-chat' ? TEXT_DARK : '#f3f4f6',
            color: activeBadge === 'your-chat' ? '#fff' : TEXT_DARK,
            border: 'none',
          }}
          onClick={() => openBadge('your-chat')}
        >
          <i className="bi bi-chat-heart" aria-hidden />
          Your chat
          {yourChatBadgeCount > 0 ? (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              {yourChatBadgeCount > 99 ? '99+' : yourChatBadgeCount}
            </span>
          ) : null}
        </button>
      </div>

      {activeBadge === 'group-chat' ? (
        <ModalShell
          title={groupStep === 'list' ? 'Group chats' : selectedChat?.pageName || 'Group chat'}
          onClose={closeModal}
        >
          {groupStep === 'list' ? (
            <>
              <p className="small text-muted mb-3">
                Select a club group chat to request access. Your category admin must approve before
                you can message in the group.
              </p>
              {isLoading ? (
                <p className="small text-muted">Loading club groups…</p>
              ) : joinable.length === 0 ? (
                <p className="small text-muted mb-0">
                  No club group chats are available yet. Ask your school admin to enable group chat
                  for a club.
                </p>
              ) : (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {joinable.map((chat) => (
                    <JoinableClubRow
                      key={chat.id}
                      chat={chat}
                      onSelect={() => selectGroup(chat)}
                    />
                  ))}
                </ul>
              )}
            </>
          ) : selectedChat ? (
            <>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 mb-3 text-decoration-none"
                style={{ color: TEXT_MUTED }}
                onClick={backToList}
              >
                ← Back to group chats
              </button>

              <div className="d-flex align-items-center gap-3 p-3 mb-3 border" style={{ borderRadius: 0 }}>
                <ClubIcon icon={selectedChat.icon} name={selectedChat.pageName} />
                <div>
                  <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                    {selectedChat.pageName || 'Club'}
                  </div>
                  <MembershipStatusLabel status={selectedChat.membershipStatus} />
                </div>
              </div>

              <p className="small text-muted mb-3">
                {selectedChat.membershipStatus === 'approved'
                  ? 'You are already approved for this group. Open the chat icon on this screen to message.'
                  : selectedChat.membershipStatus === 'pending'
                    ? 'Your join request is waiting for category admin approval.'
                    : selectedChat.membershipStatus === 'banned'
                      ? 'You are not allowed to join this group. Contact your category admin.'
                      : 'Send a join request. Once approved, you can read and send messages in this group.'}
              </p>

              {requestError ? (
                <div className="alert alert-danger border-0 py-2 small mb-2" style={{ borderRadius: 0 }}>
                  {requestError}
                </div>
              ) : null}
              {requestMessage ? (
                <div className="alert alert-success border-0 py-2 small mb-2" style={{ borderRadius: 0 }}>
                  {requestMessage}
                </div>
              ) : null}

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn"
                  disabled={
                    selectedChat.membershipStatus === 'pending' ||
                    selectedChat.membershipStatus === 'approved' ||
                    selectedChat.membershipStatus === 'banned' ||
                    requestMutation.isPending
                  }
                  style={{
                    backgroundColor: TEXT_DARK,
                    color: '#fff',
                    borderRadius: 0,
                    opacity:
                      selectedChat.membershipStatus === 'pending' ||
                      selectedChat.membershipStatus === 'approved' ||
                      selectedChat.membershipStatus === 'banned'
                        ? 0.55
                        : 1,
                  }}
                  onClick={() => requestMutation.mutate(selectedChat.id)}
                >
                  {requestMutation.isPending
                    ? 'Sending…'
                    : selectedChat.membershipStatus === 'pending'
                      ? 'Request pending'
                      : selectedChat.membershipStatus === 'approved'
                        ? 'Already joined'
                        : selectedChat.membershipStatus === 'banned'
                          ? 'Not allowed'
                          : 'Request to join'}
                </button>
              </div>
            </>
          ) : null}
        </ModalShell>
      ) : null}

      {activeBadge === 'your-chat' ? (
        <ModalShell title="Messages" onClose={closeModal} wide>
          <DirectChatPanel currentUserId={currentUserId} />
        </ModalShell>
      ) : null}
    </>
  );
}

function MembershipStatusLabel({
  status,
}: {
  status: JoinableClubGroupChat['membershipStatus'];
}) {
  if (!status) return null;
  const label =
    status === 'pending'
      ? 'Pending approval'
      : status === 'approved'
        ? 'Approved'
        : status === 'banned'
          ? 'Banned'
          : null;
  if (!label) return null;
  return <div className="small text-muted">{label}</div>;
}

function ModalShell({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1060,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card border-0 shadow-lg"
        style={{ maxWidth: wide ? 520 : 480, width: '100%', borderRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0" style={{ color: TEXT_DARK, fontWeight: 600 }}>
              {title}
            </h2>
            <button type="button" className="btn btn-link p-0 text-muted" onClick={onClose} aria-label="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function JoinableClubRow({
  chat,
  onSelect,
}: {
  chat: JoinableClubGroupChat;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="w-100 text-start border d-flex align-items-center gap-3 p-3"
        style={{
          borderRadius: 0,
          cursor: 'pointer',
          borderColor: '#dee2e6',
          backgroundColor: '#fff',
        }}
        onClick={onSelect}
      >
        <ClubIcon icon={chat.icon} name={chat.pageName} />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK }}>
            {chat.pageName || 'Club'}
          </div>
          <MembershipStatusLabel status={chat.membershipStatus} />
        </div>
        <i className="bi bi-chevron-right text-muted" aria-hidden />
      </button>
    </li>
  );
}

function ClubIcon({ icon, name }: { icon: string; name: string }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 40,
        height: 40,
        backgroundColor: 'rgba(26, 31, 46, 0.08)',
        borderRadius: 8,
      }}
    >
      {isImageIconValue(icon) ? (
        <img src={imageSrc(icon)} alt={name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
      ) : (
        <i className={`bi ${icon || 'bi-people-fill'}`} style={{ color: TEXT_DARK }} aria-hidden />
      )}
    </div>
  );
}
