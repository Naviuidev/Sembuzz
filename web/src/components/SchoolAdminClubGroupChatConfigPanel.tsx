import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  schoolAdminClubGroupChatsService,
  type ClubGroupChatItem,
  type ClubGroupMessageMode,
} from '../services/school-admin-club-group-chats.service';

const TEXT_DARK = '#1a1f2e';

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

export function SchoolAdminClubGroupChatConfigPanel() {
  const queryClient = useQueryClient();
  const [configModalChat, setConfigModalChat] = useState<ClubGroupChatItem | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: chats = [], isLoading, error } = useQuery({
    queryKey: ['school-admin', 'club-group-chats'],
    queryFn: schoolAdminClubGroupChatsService.list,
  });

  const updateModeMutation = useMutation({
    mutationFn: ({ id, messageMode }: { id: string; messageMode: ClubGroupMessageMode }) =>
      schoolAdminClubGroupChatsService.updateMessageMode(id, messageMode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'club-group-chats'] });
      setConfigModalChat(null);
      setMessage({ type: 'success', text: 'Chat settings saved.' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save chat settings.';
      setMessage({ type: 'error', text: typeof msg === 'string' ? msg : 'Failed to save chat settings.' });
    },
  });

  return (
    <>
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
        <div className="card-body p-0">
          <div className="px-4 pt-4 pb-2">
            <h2 className="h6 mb-1" style={{ color: TEXT_DARK }}>
              Club group chats
            </h2>
            <p className="small text-muted mb-0">
              Configure who can send messages in each club group. Subcategory admins manage join
              requests and group chat from their dashboard.
            </p>
          </div>
          {message ? (
            <div className="px-4 pb-2">
              <div
                className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 mb-0`}
                style={{ borderRadius: 0 }}
                role="alert"
              >
                {message.text}
              </div>
            </div>
          ) : null}
          {isLoading ? (
            <div className="p-4 text-muted">Loading club groups…</div>
          ) : error ? (
            <div className="p-4 text-danger">
              {getQueryErrorMessage(error, 'Failed to load club groups.')}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-muted">
              No club group chats yet. Approve a group chat request below to enable a club.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="small text-muted">Club group</th>
                    <th className="small text-muted">Approved members</th>
                    <th className="small text-muted">Who can send messages</th>
                    <th className="small text-muted text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chats.map((chat) => (
                    <tr key={chat.id}>
                      <td className="fw-medium" style={{ color: TEXT_DARK }}>
                        {chat.pageName || 'Club'}
                      </td>
                      <td className="small">{chat.approvedMemberCount ?? 0}</td>
                      <td className="small">
                        {MESSAGE_MODE_LABELS[chat.messageMode ?? 'members']}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-dark"
                          style={{ borderRadius: 0 }}
                          onClick={() => setConfigModalChat(chat)}
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {configModalChat ? (
        <ChatConfigModal
          chat={configModalChat}
          saving={updateModeMutation.isPending}
          onClose={() => setConfigModalChat(null)}
          onSave={(messageMode) =>
            updateModeMutation.mutate({ id: configModalChat.id, messageMode })
          }
        />
      ) : null}
    </>
  );
}

function ChatConfigModal({
  chat,
  saving,
  onClose,
  onSave,
}: {
  chat: ClubGroupChatItem;
  saving: boolean;
  onClose: () => void;
  onSave: (mode: ClubGroupMessageMode) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<ClubGroupMessageMode>(
    chat.messageMode ?? 'members',
  );

  return (
    <>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 0 }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title" style={{ color: TEXT_DARK }}>
                Chat settings — {chat.pageName || 'Club'}
              </h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body pt-3">
              <p className="text-muted small mb-3">Choose who can send messages in this club group chat.</p>
              <div className="d-flex flex-column gap-3">
                {(
                  [
                    {
                      mode: 'admin_only' as const,
                      title: 'Only admin can send messages',
                      description:
                        'Approved students can read messages. Subcategory admins send updates from the Group chat tab.',
                    },
                    {
                      mode: 'members' as const,
                      title: 'Allow students to send messages',
                      description:
                        'Approved students can read and send messages in the group chat.',
                    },
                  ] as const
                ).map((option) => {
                  const active = selectedMode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      className="text-start border p-3"
                      style={{
                        borderRadius: 0,
                        borderColor: active ? TEXT_DARK : '#dee2e6',
                        backgroundColor: active ? '#f8f9fa' : '#fff',
                        boxShadow: active ? `inset 0 0 0 1px ${TEXT_DARK}` : 'none',
                      }}
                      onClick={() => setSelectedMode(option.mode)}
                    >
                      <div className="fw-semibold mb-1" style={{ color: TEXT_DARK }}>
                        {option.title}
                      </div>
                      <div className="small text-muted mb-0">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 0 }} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-dark"
                style={{ borderRadius: 0 }}
                disabled={saving}
                onClick={() => onSave(selectedMode)}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
