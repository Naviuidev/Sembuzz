import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoryAdminClubGroupMembershipsService,
  type CategoryAdminClubGroupMembershipRow,
  type ClubGroupMembershipStatus,
} from '../services/category-admin-club-group-memberships.service';
import {
  subCategoryAdminClubGroupMembershipsService,
  type SubCategoryAdminClubGroupMembershipRow,
} from '../services/subcategory-admin-club-group-memberships.service';
import {
  categoryAdminClubGroupChatsService,
  type CategoryAdminClubGroupChatRow,
  type CategoryAdminClubGroupMessageItem,
  type ClubGroupMessageMode,
} from '../services/category-admin-club-group-chats.service';
import {
  subCategoryAdminClubGroupChatsService,
  type SubCategoryAdminClubGroupChatRow,
  type SubCategoryAdminClubGroupMessageItem,
} from '../services/subcategory-admin-club-group-chats.service';
import {
  categoryAdminDirectChatsService,
  type CategoryAdminDirectConversationRow,
} from '../services/category-admin-direct-chats.service';
import {
  subCategoryAdminDirectChatsService,
  type SubCategoryAdminDirectConversationRow,
} from '../services/subcategory-admin-direct-chats.service';
import type { DirectMessageItem } from '../services/user-direct-chats.service';
import {
  subCategoryAdminStudentChatGroupsService,
  type SubCategoryAdminStudentChatGroupRow,
  type SubCategoryAdminStudentRow,
} from '../services/subcategory-admin-student-chat-groups.service';
import { subCategoryAdminStudentChatGroupRequestsService } from '../services/subcategory-admin-student-chat-group-requests.service';
import { subCategoryAdminClubGroupChatDeleteRequestsService } from '../services/club-group-chat-delete-requests.service';
import { subCategoryAdminStudentChatGroupDeleteRequestsService } from '../services/student-chat-group-delete-requests.service';
import { MessagingDeleteRequestConfirmModal } from './MessagingDeleteRequestConfirmModal';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type MessagesTab = ClubGroupMembershipStatus | 'chat' | 'direct-chats' | 'student-groups';

const BASE_TABS: { id: MessagesTab; label: string }[] = [
  { id: 'pending', label: 'Pending approvals' },
  { id: 'approved', label: 'Approved' },
  { id: 'banned', label: 'Banned users' },
  { id: 'chat', label: 'Group chat' },
  { id: 'direct-chats', label: '1:1 chats' },
];

const MESSAGE_MODE_LABELS: Record<ClubGroupMessageMode, string> = {
  admin_only: 'Only admin can send messages',
  members: 'Allow students to send messages',
};

function getQueryErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function CategoryAdminMessagesPanel({
  variant = 'category',
}: {
  /** Operational messaging is owned by subcategory admins; category view is deprecated. */
  variant?: 'category' | 'subcategory';
}) {
  const queryPrefix = variant === 'subcategory' ? 'subcategory-admin' : 'category-admin';
  const membershipsService =
    variant === 'subcategory'
      ? subCategoryAdminClubGroupMembershipsService
      : categoryAdminClubGroupMembershipsService;
  const clubChatsService =
    variant === 'subcategory'
      ? subCategoryAdminClubGroupChatsService
      : categoryAdminClubGroupChatsService;
  const directChatsService =
    variant === 'subcategory' ? subCategoryAdminDirectChatsService : categoryAdminDirectChatsService;
  const adminLabel = variant === 'subcategory' ? 'subcategory admin' : 'category admin';
  const visibleTabs = useMemo(
    () =>
      variant === 'subcategory'
        ? [...BASE_TABS, { id: 'student-groups' as const, label: 'Student groups' }]
        : BASE_TABS,
    [variant],
  );

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MessagesTab>('pending');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [selectedDirectChatId, setSelectedDirectChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const directMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const membershipTab = activeTab === 'pending' || activeTab === 'approved' || activeTab === 'banned'
    ? activeTab
    : null;

  const { data: membershipRows = [], isLoading: membershipsLoading, error: membershipsError } = useQuery({
    queryKey: [queryPrefix, 'club-group-memberships', membershipTab],
    queryFn: () => membershipsService.list(membershipTab!),
    enabled: !!membershipTab,
  });

  const { data: configChats = [], isLoading: configLoading, error: configError } = useQuery({
    queryKey: [queryPrefix, 'club-group-chats'],
    queryFn: clubChatsService.list,
    enabled: activeTab === 'chat',
  });

  const { data: approvedMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: [queryPrefix, 'club-group-chats', selectedChatId, 'approved-members'],
    queryFn: () => clubChatsService.listApprovedMembers(selectedChatId!),
    enabled: activeTab === 'chat' && !!selectedChatId,
  });

  const {
    data: chatMessages = [],
    isLoading: chatMessagesLoading,
    refetch: refetchChatMessages,
  } = useQuery({
    queryKey: [queryPrefix, 'club-group-chats', selectedChatId, 'messages'],
    queryFn: () => clubChatsService.listMessages(selectedChatId!),
    enabled: activeTab === 'chat' && !!selectedChatId,
    refetchInterval: activeTab === 'chat' && selectedChatId ? 4000 : false,
  });

  const { data: directConversations = [], isLoading: directListLoading, error: directListError } = useQuery({
    queryKey: [queryPrefix, 'direct-chats'],
    queryFn: directChatsService.list,
    enabled: activeTab === 'direct-chats',
    refetchInterval: activeTab === 'direct-chats' ? 8000 : false,
  });

  const {
    data: directThread,
    isLoading: directThreadLoading,
  } = useQuery({
    queryKey: [queryPrefix, 'direct-chats', selectedDirectChatId, 'messages'],
    queryFn: () => directChatsService.listMessages(selectedDirectChatId!),
    enabled: activeTab === 'direct-chats' && !!selectedDirectChatId,
    refetchInterval: activeTab === 'direct-chats' && selectedDirectChatId ? 4000 : false,
  });

  useEffect(() => {
    if (activeTab === 'chat' && configChats.length > 0 && !selectedChatId) {
      setSelectedChatId(configChats[0].id);
    }
  }, [activeTab, configChats, selectedChatId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  useEffect(() => {
    if (activeTab === 'direct-chats' && directConversations.length > 0 && !selectedDirectChatId) {
      setSelectedDirectChatId(directConversations[0].id);
    }
  }, [activeTab, directConversations, selectedDirectChatId]);

  useEffect(() => {
    if (activeTab === 'direct-chats') {
      directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directThread?.messages, activeTab]);

  const invalidateMemberships = () => {
    void queryClient.invalidateQueries({ queryKey: [queryPrefix, 'club-group-memberships'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => membershipsService.approve(id),
    onMutate: (id) => {
      setActingOnId(id);
      setActionMessage(null);
    },
    onSuccess: () => {
      invalidateMemberships();
      void queryClient.invalidateQueries({ queryKey: [queryPrefix, 'club-group-chats'] });
      setActionMessage({
        type: 'success',
        text: 'User approved. They will receive an email notification to join the group.',
      });
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to approve user. Please try again.';
      setActionMessage({ type: 'error', text: message });
    },
    onSettled: () => setActingOnId(null),
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => membershipsService.ban(id),
    onMutate: (id) => {
      setActingOnId(id);
      setActionMessage(null);
    },
    onSuccess: () => {
      invalidateMemberships();
      void queryClient.invalidateQueries({ queryKey: [queryPrefix, 'club-group-chats'] });
      setActionMessage({ type: 'success', text: 'User has been banned from the group.' });
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to ban user. Please try again.';
      setActionMessage({ type: 'error', text: message });
    },
    onSettled: () => setActingOnId(null),
  });

  const selectedChat = useMemo(
    () => configChats.find((c) => c.id === selectedChatId) ?? null,
    [configChats, selectedChatId],
  );

  const handleSendChat = useCallback(async () => {
    if (!selectedChatId || !chatDraft.trim() || chatSending) return;
    setChatSending(true);
    setActionMessage(null);
    try {
      await clubChatsService.sendMessage(selectedChatId, chatDraft.trim());
      setChatDraft('');
      await refetchChatMessages();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send message.';
      setActionMessage({ type: 'error', text: message });
    } finally {
      setChatSending(false);
    }
  }, [selectedChatId, chatDraft, chatSending, refetchChatMessages]);

  return (
    <>
      <p className="text-muted mb-4">
        Review student join requests, message approved members, and audit 1:1 chats. Chat permissions
        are configured by your school admin. You are the primary group moderator as {adminLabel}.
      </p>

      <ul className="nav nav-tabs mb-4" style={{ borderBottom: '1px solid #dee2e6' }}>
            {visibleTabs.map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  style={{
                    borderRadius: 0,
                    color: activeTab === tab.id ? TEXT_DARK : TEXT_MUTED,
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${TEXT_DARK}` : '2px solid transparent',
                  }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActionMessage(null);
                  }}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          {actionMessage ? (
            <div
              className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-danger'} py-2`}
              style={{ borderRadius: 0 }}
              role="alert"
            >
              {actionMessage.text}
            </div>
          ) : null}

          {activeTab === 'chat' ? (
            <AdminChatPanel
              chats={configChats}
              selectedChatId={selectedChatId}
              selectedChat={selectedChat}
              onSelectChat={(id) => {
                setSelectedChatId(id);
                setChatDraft('');
              }}
              approvedMembers={approvedMembers}
              membersLoading={membersLoading}
              messages={chatMessages}
              messagesLoading={chatMessagesLoading}
              draft={chatDraft}
              sending={chatSending}
              onDraftChange={setChatDraft}
              onSend={handleSendChat}
              messagesEndRef={messagesEndRef}
              isLoading={configLoading}
              error={configError}
              onDeleteRequested={() => {
                void queryClient.invalidateQueries({ queryKey: [queryPrefix, 'club-group-chats'] });
              }}
            />
          ) : activeTab === 'direct-chats' ? (
            <DirectChatsAuditPanel
              conversations={directConversations}
              selectedId={selectedDirectChatId}
              onSelect={(id) => setSelectedDirectChatId(id)}
              thread={directThread}
              isLoading={directListLoading}
              threadLoading={directThreadLoading}
              error={directListError}
              messagesEndRef={directMessagesEndRef}
            />
          ) : activeTab === 'student-groups' ? (
            <StudentGroupsAdminPanel />
          ) : membershipTab ? (
            <MembershipTable
              rows={membershipRows}
              activeTab={membershipTab}
              isLoading={membershipsLoading}
              error={membershipsError}
              actingOnId={actingOnId}
              onApprove={(id) => approveMutation.mutate(id)}
              onBan={(id) => banMutation.mutate(id)}
            />
          ) : null}
    </>
  );
}

function AdminChatPanel({
  chats,
  selectedChatId,
  selectedChat,
  onSelectChat,
  approvedMembers,
  membersLoading,
  messages,
  messagesLoading,
  draft,
  sending,
  onDraftChange,
  onSend,
  messagesEndRef,
  isLoading,
  error,
  onDeleteRequested,
}: {
  chats: (CategoryAdminClubGroupChatRow | SubCategoryAdminClubGroupChatRow)[];
  selectedChatId: string | null;
  selectedChat: CategoryAdminClubGroupChatRow | SubCategoryAdminClubGroupChatRow | null;
  onSelectChat: (id: string) => void;
  approvedMembers: Array<{ id: string; user: { name: string; email: string } }>;
  membersLoading: boolean;
  messages: (CategoryAdminClubGroupMessageItem | SubCategoryAdminClubGroupMessageItem)[];
  messagesLoading: boolean;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: unknown;
  onDeleteRequested?: () => void;
}) {
  const queryClient = useQueryClient();
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: deleteRequests = [] } = useQuery({
    queryKey: ['subcategory-admin', 'club-group-chat-delete-requests'],
    queryFn: subCategoryAdminClubGroupChatDeleteRequestsService.listMine,
  });

  const pendingDeleteIds = useMemo(
    () =>
      new Set(
        deleteRequests.filter((r) => r.status === 'pending').map((r) => r.clubGroupChatId),
      ),
    [deleteRequests],
  );

  const deleteMutation = useMutation({
    mutationFn: (clubGroupChatId: string) =>
      subCategoryAdminClubGroupChatDeleteRequestsService.create(clubGroupChatId),
    onSuccess: () => {
      setDeleteFeedback({
        type: 'success',
        text: 'Delete request sent to category and school admins for approval.',
      });
      setDeleteConfirm(null);
      void queryClient.invalidateQueries({
        queryKey: ['subcategory-admin', 'club-group-chat-delete-requests'],
      });
      onDeleteRequested?.();
    },
    onError: (err) => {
      setDeleteFeedback({
        type: 'error',
        text: getQueryErrorMessage(err, 'Could not send delete request.'),
      });
    },
  });

  const handleDeleteRequest = (chatId: string, chatName: string) => {
    if (pendingDeleteIds.has(chatId)) return;
    setDeleteFeedback(null);
    setDeleteConfirm({ id: chatId, name: chatName });
  };

  const confirmDeleteRequest = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm.id);
  };
  if (isLoading) return <div className="p-4 text-muted">Loading chats…</div>;
  if (error) {
    return (
      <div className="p-4 text-danger">
        {getQueryErrorMessage(error, 'Failed to load chats. Restart the backend after running: npx prisma generate')}
      </div>
    );
  }
  if (chats.length === 0) {
    return (
      <div className="card border-0 shadow-sm p-4 text-muted" style={{ borderRadius: 0 }}>
        No club group chats available yet.
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 0, minHeight: 520 }}>
      {deleteFeedback ? (
        <div className={`alert alert-${deleteFeedback.type === 'success' ? 'success' : 'danger'} py-2 mb-0 rounded-0`}>
          {deleteFeedback.text}
        </div>
      ) : null}
      <div className="row g-0" style={{ minHeight: 520 }}>
        <div className="col-md-3 border-end bg-white">
          <div className="p-3 border-bottom fw-semibold" style={{ color: TEXT_DARK }}>
            Club groups
          </div>
          <div className="list-group list-group-flush">
            {chats.map((chat) => {
              const pendingDelete = pendingDeleteIds.has(chat.id);
              return (
              <div
                key={chat.id}
                className={`list-group-item border-0 d-flex align-items-center gap-2 ${selectedChatId === chat.id ? 'active' : ''}`}
                style={{
                  borderRadius: 0,
                  backgroundColor: selectedChatId === chat.id ? TEXT_DARK : undefined,
                  color: selectedChatId === chat.id ? '#fff' : TEXT_DARK,
                }}
              >
                <button
                  type="button"
                  className="btn btn-link p-0 text-start flex-grow-1 text-decoration-none"
                  style={{
                    color: 'inherit',
                  }}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="fw-medium">{chat.pageName || 'Club'}</div>
                  <div className={`small ${selectedChatId === chat.id ? 'text-white-50' : 'text-muted'}`}>
                    {chat.approvedMemberCount} approved
                    {pendingDelete ? ' · Delete pending' : ''}
                  </div>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 flex-shrink-0"
                  title={pendingDelete ? 'Delete request pending' : 'Request deletion'}
                  disabled={pendingDelete || deleteMutation.isPending}
                  style={{ color: pendingDelete ? '#ffc107' : '#dc3545' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(chat.id, chat.pageName || 'Club');
                  }}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            );
            })}
          </div>
        </div>

        <div className="col-md-3 border-end bg-white">
          <div className="p-3 border-bottom fw-semibold" style={{ color: TEXT_DARK }}>
            Approved users
          </div>
          <div className="overflow-auto" style={{ maxHeight: 460 }}>
            {membersLoading ? (
              <div className="p-3 small text-muted">Loading members…</div>
            ) : approvedMembers.length === 0 ? (
              <div className="p-3 small text-muted">No approved users in this group yet.</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {approvedMembers.map((member) => (
                  <li key={member.id} className="px-3 py-2 border-bottom">
                    <div className="small fw-medium" style={{ color: TEXT_DARK }}>
                      {member.user.name}
                    </div>
                    <div className="small text-muted">{member.user.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-md-6 d-flex flex-column bg-white">
          <div className="p-3 border-bottom">
            <div className="fw-semibold" style={{ color: TEXT_DARK }}>
              {selectedChat?.pageName || 'Club'} chat
            </div>
            <div className="small text-muted">
              {selectedChat
                ? MESSAGE_MODE_LABELS[selectedChat.messageMode]
                : 'Select a club group'}
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto px-3 py-3" style={{ backgroundColor: '#fafafa', minHeight: 320 }}>
            {messagesLoading && messages.length === 0 ? (
              <div className="small text-muted">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="small text-muted text-center py-4">
                No messages yet. Send the first message to your approved students.
              </div>
            ) : (
              messages.map((msg) => <AdminMessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-top p-3">
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message to approved users…"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                style={{ borderRadius: 0 }}
                disabled={sending || !selectedChatId}
              />
              <button
                type="button"
                className="btn btn-dark"
                style={{ borderRadius: 0, minWidth: 72 }}
                disabled={!draft.trim() || sending || !selectedChatId}
                onClick={onSend}
              >
                {sending ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MessagingDeleteRequestConfirmModal
        isOpen={!!deleteConfirm}
        targetKind="group chat"
        targetName={deleteConfirm?.name ?? ''}
        isSubmitting={deleteMutation.isPending}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteRequest}
      />
    </div>
  );
}

function AdminMessageBubble({
  message,
}: {
  message: CategoryAdminClubGroupMessageItem | SubCategoryAdminClubGroupMessageItem;
}) {
  const subCategoryAdmin =
    'subCategoryAdmin' in message ? message.subCategoryAdmin : null;
  const isAdmin = !!(message.categoryAdmin || subCategoryAdmin);
  const senderName =
    message.categoryAdmin?.name ?? subCategoryAdmin?.name ?? message.user?.name ?? 'Unknown';
  const time = useMemo(() => {
    try {
      return new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [message.createdAt]);

  return (
    <div className={`mb-3 d-flex ${isAdmin ? 'justify-content-end' : 'justify-content-start'}`}>
      <div style={{ maxWidth: '85%' }}>
        <div className="small text-muted mb-1">
          {senderName}
          {isAdmin ? ' (You)' : ''}
        </div>
        <div
          className="px-3 py-2"
          style={{
            backgroundColor: isAdmin ? TEXT_DARK : '#fff',
            color: isAdmin ? '#fff' : TEXT_DARK,
            border: isAdmin ? 'none' : '1px solid #e9ecef',
            borderRadius: isAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.body}
        </div>
        {time ? <div className="small text-muted mt-1">{time}</div> : null}
      </div>
    </div>
  );
}

function MembershipTable({
  rows,
  activeTab,
  isLoading,
  error,
  actingOnId,
  onApprove,
  onBan,
}: {
  rows: (CategoryAdminClubGroupMembershipRow | SubCategoryAdminClubGroupMembershipRow)[];
  activeTab: ClubGroupMembershipStatus;
  isLoading: boolean;
  error: unknown;
  actingOnId: string | null;
  onApprove: (id: string) => void;
  onBan: (id: string) => void;
}) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
      <div className="card-body p-0">
        {isLoading ? (
          <div className="p-4 text-muted">Loading…</div>
        ) : error ? (
          <div className="p-4 text-danger">Failed to load requests.</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-muted">No records in this tab.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th className="small text-muted">User name</th>
                  <th className="small text-muted">Email</th>
                  <th className="small text-muted">School</th>
                  <th className="small text-muted">Club group</th>
                  <th className="small text-muted">Requested</th>
                  <th className="small text-muted">Reviewed</th>
                  <th className="small text-muted text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <MembershipRow
                    key={row.id}
                    row={row}
                    activeTab={activeTab}
                    onApprove={() => onApprove(row.id)}
                    onBan={() => onBan(row.id)}
                    actionLoading={actingOnId === row.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MembershipRow({
  row,
  activeTab,
  onApprove,
  onBan,
  actionLoading,
}: {
  row: CategoryAdminClubGroupMembershipRow | SubCategoryAdminClubGroupMembershipRow;
  activeTab: ClubGroupMembershipStatus;
  onApprove: () => void;
  onBan: () => void;
  actionLoading: boolean;
}) {
  return (
    <tr>
      <td className="fw-medium" style={{ color: TEXT_DARK }}>
        {row.user.name}
      </td>
      <td className="small">{row.user.email}</td>
      <td className="small">{row.school.name}</td>
      <td className="small">{row.groupChat.pageName || 'Club'}</td>
      <td className="small text-muted">{formatDate(row.createdAt)}</td>
      <td className="small text-muted">{formatDate(row.reviewedAt)}</td>
      <td className="text-end">
        {activeTab === 'pending' ? (
          <div className="d-inline-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-dark"
              style={{ borderRadius: 0 }}
              disabled={actionLoading}
              onClick={onApprove}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              style={{ borderRadius: 0 }}
              disabled={actionLoading}
              onClick={onBan}
            >
              Ban
            </button>
          </div>
        ) : activeTab === 'approved' ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 0 }}
            disabled={actionLoading}
            onClick={onBan}
          >
            Ban
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-dark"
            style={{ borderRadius: 0 }}
            disabled={actionLoading}
            onClick={onApprove}
          >
            Approve
          </button>
        )}
      </td>
    </tr>
  );
}

function DirectChatsAuditPanel({
  conversations,
  selectedId,
  onSelect,
  thread,
  isLoading,
  threadLoading,
  error,
  messagesEndRef,
}: {
  conversations: (CategoryAdminDirectConversationRow | SubCategoryAdminDirectConversationRow)[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  thread:
    | {
        conversation: {
          id: string;
          userOne: { id: string; name: string; email: string };
          userTwo: { id: string; name: string; email: string };
        };
        messages: DirectMessageItem[];
      }
    | undefined;
  isLoading: boolean;
  threadLoading: boolean;
  error: unknown;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (isLoading) return <div className="p-4 text-muted">Loading 1:1 conversations…</div>;
  if (error) {
    return (
      <div className="p-4 text-danger">
        {getQueryErrorMessage(error, 'Failed to load 1:1 conversations.')}
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 0, minHeight: 520 }}>
      <div className="px-4 py-3 border-bottom bg-white">
        <div className="fw-semibold" style={{ color: TEXT_DARK }}>
          1:1 student chats (read-only)
        </div>
        <div className="small text-muted">
          Review direct messages between students at your school. You cannot send messages here.
        </div>
      </div>
      <div className="row g-0" style={{ minHeight: 460 }}>
        <div className="col-md-4 border-end bg-white">
          {conversations.length === 0 ? (
            <div className="p-4 small text-muted">No 1:1 conversations yet.</div>
          ) : (
            <div className="list-group list-group-flush">
              {conversations.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`list-group-item list-group-item-action border-0 text-start ${selectedId === row.id ? 'active' : ''}`}
                  style={{
                    borderRadius: 0,
                    backgroundColor: selectedId === row.id ? TEXT_DARK : undefined,
                    color: selectedId === row.id ? '#fff' : TEXT_DARK,
                  }}
                  onClick={() => onSelect(row.id)}
                >
                  <div className="small fw-medium">
                    {row.userOne.name} ↔ {row.userTwo.name}
                    {row.status === 'pending' ? (
                      <span className="badge bg-warning text-dark ms-2">Pending</span>
                    ) : row.status === 'declined' ? (
                      <span className="badge bg-secondary ms-2">Declined</span>
                    ) : null}
                  </div>
                  <div
                    className={`small ${selectedId === row.id ? 'text-white-50' : 'text-muted'} text-truncate`}
                  >
                    {row.lastMessagePreview || `${row.messageCount} messages`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-8 d-flex flex-column bg-white">
          {!selectedId || !thread ? (
            <div className="p-4 small text-muted">Select a conversation to review messages.</div>
          ) : (
            <>
              <div className="p-3 border-bottom">
                <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                  {thread.conversation.userOne.name} ↔ {thread.conversation.userTwo.name}
                </div>
                <div className="small text-muted">
                  {thread.conversation.userOne.email} · {thread.conversation.userTwo.email}
                </div>
              </div>
              <div
                className="flex-grow-1 overflow-auto px-3 py-3"
                style={{ backgroundColor: '#fafafa', minHeight: 360 }}
              >
                {threadLoading && thread.messages.length === 0 ? (
                  <div className="small text-muted">Loading messages…</div>
                ) : thread.messages.length === 0 ? (
                  <div className="small text-muted text-center py-4">No messages in this conversation.</div>
                ) : (
                  thread.messages.map((msg) => {
                    const isUserOne = msg.senderUserId === thread.conversation.userOne.id;
                    const senderName = isUserOne
                      ? thread.conversation.userOne.name
                      : thread.conversation.userTwo.name;
                    return (
                      <div key={msg.id} className="mb-3">
                        <div className="small text-muted mb-1">{senderName}</div>
                        <div
                          className="px-3 py-2 d-inline-block"
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e9ecef',
                            borderRadius: '12px 12px 12px 4px',
                            maxWidth: '85%',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentGroupsAdminPanel() {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupVisibility, setGroupVisibility] = useState<'public' | 'private'>('public');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
    visibility: string;
  } | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'student-chat-groups'],
    queryFn: subCategoryAdminStudentChatGroupsService.list,
  });

  const { data: groupRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['subcategory-admin', 'student-chat-group-requests'],
    queryFn: subCategoryAdminStudentChatGroupRequestsService.listMine,
  });

  const { data: deleteRequests = [] } = useQuery({
    queryKey: ['subcategory-admin', 'student-chat-group-delete-requests'],
    queryFn: subCategoryAdminStudentChatGroupDeleteRequestsService.listMine,
  });

  const pendingDeleteGroupIds = useMemo(
    () =>
      new Set(
        deleteRequests.filter((r) => r.status === 'pending').map((r) => r.studentChatGroupId),
      ),
    [deleteRequests],
  );

  const deleteGroupMutation = useMutation({
    mutationFn: (studentChatGroupId: string) =>
      subCategoryAdminStudentChatGroupDeleteRequestsService.create(studentChatGroupId),
    onSuccess: () => {
      setFeedback({
        type: 'success',
        text: 'Delete request sent to category and school admins for approval.',
      });
      setDeleteConfirm(null);
      void queryClient.invalidateQueries({
        queryKey: ['subcategory-admin', 'student-chat-group-delete-requests'],
      });
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: getQueryErrorMessage(err, 'Could not send delete request.'),
      });
    },
  });

  const handleDeleteGroupRequest = (groupId: string, groupName: string, visibility: string) => {
    if (pendingDeleteGroupIds.has(groupId)) return;
    setDeleteConfirm({ id: groupId, name: groupName, visibility });
  };

  const confirmDeleteGroupRequest = () => {
    if (!deleteConfirm) return;
    deleteGroupMutation.mutate(deleteConfirm.id);
  };

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['subcategory-admin', 'student-chat-groups', selectedGroupId, 'members'],
    queryFn: () => subCategoryAdminStudentChatGroupsService.listMembers(selectedGroupId!),
    enabled: !!selectedGroupId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['subcategory-admin', 'student-chat-groups', 'students', studentQuery],
    queryFn: () => subCategoryAdminStudentChatGroupsService.searchStudents(studentQuery),
    enabled: !!selectedGroupId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      subCategoryAdminStudentChatGroupRequestsService.create({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        visibility: groupVisibility,
      }),
    onSuccess: () => {
      setGroupName('');
      setGroupDescription('');
      setGroupVisibility('public');
      setFeedback({
        type: 'success',
        text: 'Request sent to category and school admins for approval.',
      });
      void queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'student-chat-group-requests'] });
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: getQueryErrorMessage(err, 'Could not send request.') });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      subCategoryAdminStudentChatGroupsService.addMember(selectedGroupId!, userId),
    onSuccess: () => {
      setFeedback({ type: 'success', text: 'Student added to the group.' });
      void queryClient.invalidateQueries({
        queryKey: ['subcategory-admin', 'student-chat-groups', selectedGroupId, 'members'],
      });
      void queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'student-chat-groups'] });
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: getQueryErrorMessage(err, 'Could not add student.') });
    },
  });

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const memberIds = new Set(members.map((m) => m.user.id));

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
      <div className="px-4 py-3 border-bottom bg-white">
        <div className="fw-semibold" style={{ color: TEXT_DARK }}>
          Student chat groups
        </div>
        <div className="small text-muted">
          Request new student groups for approval. After approval, add students to approved groups below.
        </div>
      </div>
      <div className="p-4">
        {feedback ? (
          <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} py-2`}>
            {feedback.text}
          </div>
        ) : null}

        <div className="row g-4">
          <div className="col-lg-5">
            <h6 className="fw-semibold mb-3">Request a group</h6>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Group name</label>
              <input
                className="form-control"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={120}
                placeholder="e.g. CS Study Group"
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Description (optional)</label>
              <textarea
                className="form-control"
                rows={2}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Type</label>
              <div className="d-flex gap-2">
                {(['public', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`btn btn-sm ${groupVisibility === v ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setGroupVisibility(v)}
                  >
                    {v === 'public' ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              disabled={createMutation.isPending || groupName.trim().length < 2}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Sending…' : 'Send request'}
            </button>

            <h6 className="fw-semibold mt-4 mb-3">Your requests</h6>
            {requestsLoading ? (
              <p className="small text-muted">Loading requests…</p>
            ) : groupRequests.length === 0 ? (
              <p className="small text-muted">No group requests yet.</p>
            ) : (
              <ul className="list-group list-group-flush border rounded mb-4">
                {groupRequests.map((req) => (
                  <li key={req.id} className="list-group-item py-2">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="min-w-0">
                        <div className="small fw-semibold" style={{ color: TEXT_DARK }}>
                          {req.name}
                        </div>
                        <div className="small text-muted text-uppercase">{req.visibility}</div>
                      </div>
                      <span
                        className={`badge ${
                          req.status === 'approved'
                            ? 'bg-success'
                            : req.status === 'declined'
                              ? 'bg-danger'
                              : 'bg-warning text-dark'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.status === 'declined' && req.declineReason ? (
                      <div className="small text-danger mt-1">{req.declineReason}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <h6 className="fw-semibold mb-3">Approved groups</h6>
            {isLoading ? (
              <p className="small text-muted">Loading groups…</p>
            ) : groups.length === 0 ? (
              <p className="small text-muted">No approved groups yet.</p>
            ) : (
              <ul className="list-group list-group-flush border rounded">
                {groups.map((g: SubCategoryAdminStudentChatGroupRow) => {
                  const pendingDelete = pendingDeleteGroupIds.has(g.id);
                  return (
                  <li key={g.id} className="list-group-item d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className={`btn btn-link text-start p-0 text-decoration-none flex-grow-1 ${selectedGroupId === g.id ? 'fw-semibold' : ''}`}
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setFeedback(null);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <span style={{ color: TEXT_DARK }}>{g.name}</span>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: 10 }}>
                          {g.visibility}
                        </span>
                      </div>
                      <div className="small text-muted">
                        {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
                        {pendingDelete ? ' · Delete pending' : ''}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 flex-shrink-0"
                      title={pendingDelete ? 'Delete request pending' : 'Request deletion'}
                      disabled={pendingDelete || deleteGroupMutation.isPending}
                      style={{ color: pendingDelete ? '#ffc107' : '#dc3545' }}
                      onClick={() => handleDeleteGroupRequest(g.id, g.name, g.visibility)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </li>
                );
                })}
              </ul>
            )}
          </div>

          <div className="col-lg-7">
            {!selectedGroup ? (
              <p className="small text-muted mb-0">Select a group to manage members.</p>
            ) : (
              <>
                <h6 className="fw-semibold mb-2">{selectedGroup.name}</h6>
                <p className="small text-muted">
                  Add students from your school. They will see this group in their Messages inbox.
                </p>

                <div className="mb-3">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Search students by name or email"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                  />
                </div>

                <div className="mb-4" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {students.length === 0 ? (
                    <p className="small text-muted">No students match your search.</p>
                  ) : (
                    <ul className="list-group list-group-flush border rounded">
                      {students.map((s: SubCategoryAdminStudentRow) => (
                        <li
                          key={s.id}
                          className="list-group-item d-flex justify-content-between align-items-center py-2"
                        >
                          <div className="min-w-0">
                            <div className="small fw-semibold text-truncate">{s.name}</div>
                            <div className="small text-muted text-truncate">{s.email}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark flex-shrink-0"
                            disabled={memberIds.has(s.id) || addMemberMutation.isPending}
                            onClick={() => addMemberMutation.mutate(s.id)}
                          >
                            {memberIds.has(s.id) ? 'Added' : 'Add'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <h6 className="fw-semibold mb-2">Members ({members.length})</h6>
                {membersLoading ? (
                  <p className="small text-muted">Loading members…</p>
                ) : members.length === 0 ? (
                  <p className="small text-muted">No members yet.</p>
                ) : (
                  <ul className="list-group list-group-flush border rounded">
                    {members.map((m) => (
                      <li key={m.user.id} className="list-group-item py-2 small">
                        <div className="fw-semibold">{m.user.name}</div>
                        <div className="text-muted">{m.user.email}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MessagingDeleteRequestConfirmModal
        isOpen={!!deleteConfirm}
        targetKind="student group"
        targetName={deleteConfirm?.name ?? ''}
        targetMeta={deleteConfirm?.visibility}
        isSubmitting={deleteGroupMutation.isPending}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteGroupRequest}
      />
    </div>
  );
}
