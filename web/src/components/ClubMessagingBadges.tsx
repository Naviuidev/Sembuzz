import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  userClubGroupChatsService,
  type JoinableClubGroupChat,
} from '../services/user-club-group-chats.service';
import {
  userDirectChatsService,
  USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
} from '../services/user-direct-chats.service';
import { useChatPopup } from '../contexts/ChatPopupContext';
import { ChatSidePanelShell } from './ChatSidePanelShell';
import { imageSrc, isImageIconValue } from '../utils/image';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type GroupStep = 'list' | 'detail';

interface ClubMessagingBadgesProps {
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}

export function ClubMessagingBadges({
  isAuthenticated,
  onRequireLogin,
}: ClubMessagingBadgesProps) {
  const queryClient = useQueryClient();
  const { openChat } = useChatPopup();
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupStep, setGroupStep] = useState<GroupStep>('list');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const { data: joinable = [], isLoading } = useQuery({
    queryKey: ['user', 'club-group-chats', 'joinable'],
    queryFn: userClubGroupChatsService.listJoinable,
    enabled: isAuthenticated && groupPanelOpen,
  });

  const { data: directUnread } = useQuery({
    queryKey: USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
    queryFn: userDirectChatsService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 8000 : false,
  });

  const { data: directAvailability } = useQuery({
    queryKey: ['user', 'direct-chats', 'availability'],
    queryFn: userDirectChatsService.getAvailability,
    enabled: isAuthenticated,
  });

  const showDirectMessaging = directAvailability?.available === true;

  const yourChatBadgeCount =
    showDirectMessaging
      ? (directUnread?.unreadCount ?? 0) + (directUnread?.pendingIncomingCount ?? 0)
      : 0;

  const requestMutation = useMutation({
    mutationFn: (groupChatId: string) => userClubGroupChatsService.requestJoin(groupChatId),
    onSuccess: () => {
      setRequestMessage('Join request sent. A subcategory admin will review your request.');
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

  const closeGroupPanel = useCallback(() => {
    setGroupPanelOpen(false);
    setGroupStep('list');
    setSelectedChatId(null);
    setRequestMessage(null);
    setRequestError(null);
  }, []);

  function openGroupPanel() {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    setGroupPanelOpen(true);
    setGroupStep('list');
    setSelectedChatId(null);
    setRequestMessage(null);
    setRequestError(null);
  }

  function openYourChat() {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    openChat();
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
      <div className="events-apps-messaging-actions">
        <button
          type="button"
          className={`events-apps-messaging-btn${groupPanelOpen ? ' is-active' : ''}`}
          onClick={openGroupPanel}
        >
          <i className="bi bi-people-fill" aria-hidden />
          Group chat
        </button>
        {showDirectMessaging ? (
        <button
          type="button"
          className="events-apps-messaging-btn position-relative"
          onClick={openYourChat}
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
        ) : null}
      </div>

      {groupPanelOpen ? (
        <ChatSidePanelShell ariaLabel="Group chats" onClose={closeGroupPanel}>
          <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2 flex-shrink-0">
            <h2 className="h6 mb-0 fw-semibold" style={{ color: TEXT_DARK }}>
              {groupStep === 'list' ? 'Group chats' : selectedChat?.pageName || 'Group chat'}
            </h2>
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: TEXT_MUTED }}
              onClick={closeGroupPanel}
              aria-label="Close"
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0 }}>
            {groupStep === 'list' ? (
              <>
                <p className="small text-muted mb-3">
                  Select a club group chat to request access. Your subcategory admin must approve before
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

                <div
                  className="d-flex align-items-center gap-3 p-3 mb-3 border rounded-3"
                  style={{ borderColor: '#e9ecef' }}
                >
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
                    ? 'You are approved. Use the chat bubble on this screen to open the conversation.'
                    : selectedChat.membershipStatus === 'pending'
                      ? 'Your join request is waiting for subcategory admin approval.'
                      : selectedChat.membershipStatus === 'banned'
                        ? 'You are not allowed to join this group. Contact your subcategory admin.'
                        : 'Send a join request. Once approved, you can read and send messages in this group.'}
                </p>

                {requestError ? (
                  <div className="alert alert-danger border-0 py-2 small mb-2 rounded-3">{requestError}</div>
                ) : null}
                {requestMessage ? (
                  <div className="alert alert-success border-0 py-2 small mb-2 rounded-3">{requestMessage}</div>
                ) : null}

                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-dark rounded-pill px-3"
                    disabled={
                      selectedChat.membershipStatus === 'pending' ||
                      selectedChat.membershipStatus === 'approved' ||
                      selectedChat.membershipStatus === 'banned' ||
                      requestMutation.isPending
                    }
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
          </div>
        </ChatSidePanelShell>
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
        className="w-100 text-start border d-flex align-items-center gap-3 p-3 rounded-3"
        style={{
          cursor: 'pointer',
          borderColor: '#e9ecef',
          backgroundColor: '#f8fafc',
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
