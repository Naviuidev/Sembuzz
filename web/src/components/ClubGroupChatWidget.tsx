import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  userClubGroupChatsService,
  type ClubGroupChatPublic,
  type ClubGroupMessageItem,
} from '../services/user-club-group-chats.service';
import { imageSrc, isImageIconValue } from '../utils/image';
import {
  ChatComposer,
  ChatMessageBubble,
  HiddenChatFileInputs,
} from './ChatMessageUi';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  uploadChatAttachment,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const FAB_BOTTOM = '88px';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type PanelView = 'closed' | 'picker' | 'chat';

interface ClubGroupChatWidgetProps {
  /** Show FAB on the events home surface (logged-in or guest). */
  visible: boolean;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  /** Guest tapped the message icon — open existing login UI (sign-up link is on that screen). */
  onRequireLogin?: () => void;
}

export function ClubGroupChatWidget({
  visible,
  isAuthenticated,
  currentUserId,
  onRequireLogin,
}: ClubGroupChatWidgetProps) {
  const queryClient = useQueryClient();
  const [panelView, setPanelView] = useState<PanelView>('closed');
  const [activeChat, setActiveChat] = useState<ClubGroupChatPublic | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const { data: groupChats = [] } = useQuery({
    queryKey: ['user', 'club-group-chats'],
    queryFn: userClubGroupChatsService.list,
    enabled: visible && isAuthenticated,
    staleTime: 30_000,
  });

  const showFab =
    visible && (isAuthenticated ? groupChats.length > 0 : true);

  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['user', 'club-group-chats', activeChat?.id, 'messages'],
    queryFn: () => userClubGroupChatsService.listMessages(activeChat!.id),
    enabled: panelView === 'chat' && !!activeChat?.id,
    refetchInterval: panelView === 'chat' ? 4000 : false,
  });

  useEffect(() => {
    if (panelView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, panelView]);

  const openPickerOrChat = useCallback(() => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    if (groupChats.length === 1) {
      setActiveChat(groupChats[0]);
      setPanelView('chat');
      return;
    }
    setPanelView('picker');
  }, [groupChats, isAuthenticated, onRequireLogin]);

  const closePanel = useCallback(() => {
    setPanelView('closed');
    setActiveChat(null);
    setDraft('');
    setSendError(null);
    setReplyTo(null);
    setPendingAttachment(null);
  }, []);

  const selectChat = useCallback((chat: ClubGroupChatPublic) => {
    setActiveChat(chat);
    setPanelView('chat');
    setDraft('');
    setSendError(null);
    setReplyTo(null);
    setPendingAttachment(null);
  }, []);

  const handleFileSelected = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setSendError('File must be 5 MB or smaller.');
      return;
    }
    setUploading(true);
    setSendError(null);
    try {
      const uploaded = await uploadChatAttachment('/user/club-group-chats/upload-attachment', file);
      setPendingAttachment(uploaded);
    } catch {
      setSendError('Could not upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!activeChat || sending || uploading) return;
    if (!draft.trim() && !pendingAttachment) return;
    if (activeChat.messageMode === 'admin_only') return;
    setSending(true);
    setSendError(null);
    try {
      await userClubGroupChatsService.sendMessage(activeChat.id, {
        body: draft.trim() || undefined,
        attachmentUrl: pendingAttachment?.url,
        attachmentType: pendingAttachment?.attachmentType,
        attachmentName: pendingAttachment?.attachmentName,
        replyToMessageId: replyTo?.id,
      });
      setDraft('');
      setReplyTo(null);
      setPendingAttachment(null);
      await refetchMessages();
      void queryClient.invalidateQueries({ queryKey: ['user', 'club-group-chats'] });
    } catch {
      setSendError('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [activeChat, draft, sending, uploading, pendingAttachment, replyTo, refetchMessages, queryClient]);

  if (!showFab) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open club group chats"
        title="Club group chats"
        onClick={openPickerOrChat}
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: FAB_BOTTOM,
          zIndex: 1040,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: TEXT_DARK,
          color: '#fff',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <i className="bi bi-chat-dots-fill" style={{ fontSize: '1.35rem' }} aria-hidden />
      </button>

      {panelView !== 'closed' ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1055,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: `0 1rem calc(${FAB_BOTTOM} + 4.5rem) 1rem`,
          }}
          onClick={closePanel}
        >
          <div
            className="card border-0 shadow-lg d-flex flex-column"
            style={{
              width: '100%',
              maxWidth: 400,
              height: 'min(70vh, 520px)',
              borderRadius: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {panelView === 'picker' ? (
              <PickerPanel
                groupChats={groupChats}
                onSelect={selectChat}
                onClose={closePanel}
              />
            ) : activeChat ? (
              <ChatPanel
                chat={activeChat}
                messages={messages}
                messagesLoading={messagesLoading}
                currentUserId={currentUserId}
                draft={draft}
                sending={sending}
                uploading={uploading}
                sendError={sendError}
                replyTo={replyTo}
                pendingAttachment={pendingAttachment}
                onDraftChange={setDraft}
                onSend={() => void handleSend()}
                onCancelReply={() => setReplyTo(null)}
                onRemoveAttachment={() => setPendingAttachment(null)}
                onPickImage={() => imageInputRef.current?.click()}
                onPickPdf={() => pdfInputRef.current?.click()}
                onReply={(msg) =>
                  setReplyTo({
                    id: msg.id,
                    body: msg.body,
                    attachmentType: msg.attachmentType,
                    attachmentUrl: msg.attachmentUrl,
                    attachmentName: msg.attachmentName,
                    user: msg.user,
                    categoryAdmin: msg.categoryAdmin,
                  })
                }
                onBack={() => {
                  if (groupChats.length > 1) {
                    setPanelView('picker');
                    setActiveChat(null);
                  } else {
                    closePanel();
                  }
                }}
                onClose={closePanel}
                messagesEndRef={messagesEndRef}
                imageInputRef={imageInputRef}
                pdfInputRef={pdfInputRef}
                onImageSelected={(file) => void handleFileSelected(file)}
                onPdfSelected={(file) => void handleFileSelected(file)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PickerPanel({
  groupChats,
  onSelect,
  onClose,
}: {
  groupChats: ClubGroupChatPublic[];
  onSelect: (chat: ClubGroupChatPublic) => void;
  onClose: () => void;
}) {
  return (
    <>
      <PanelHeader title="Club group chats" onClose={onClose} />
      <div className="flex-grow-1 overflow-auto p-3">
        <p className="small text-muted mb-3">Select a group to start chatting.</p>
        <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
          {groupChats.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                className="w-100 text-start border-0 d-flex align-items-center gap-3 p-3"
                style={{ backgroundColor: '#f8f9fa', borderRadius: 0, cursor: 'pointer' }}
                onClick={() => onSelect(chat)}
              >
                <ClubIcon icon={chat.icon} name={chat.pageName} />
                <span className="fw-semibold" style={{ color: TEXT_DARK }}>
                  {chat.pageName || 'Club'}
                </span>
                <i className="bi bi-chevron-right ms-auto text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function ChatPanel({
  chat,
  messages,
  messagesLoading,
  currentUserId,
  draft,
  sending,
  uploading,
  sendError,
  replyTo,
  pendingAttachment,
  onDraftChange,
  onSend,
  onCancelReply,
  onRemoveAttachment,
  onPickImage,
  onPickPdf,
  onReply,
  onBack,
  onClose,
  messagesEndRef,
  imageInputRef,
  pdfInputRef,
  onImageSelected,
  onPdfSelected,
}: {
  chat: ClubGroupChatPublic;
  messages: ClubGroupMessageItem[];
  messagesLoading: boolean;
  currentUserId?: string | null;
  draft: string;
  sending: boolean;
  uploading: boolean;
  sendError: string | null;
  replyTo: ChatMessageReplyTo | null;
  pendingAttachment: PendingChatAttachment | null;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onCancelReply: () => void;
  onRemoveAttachment: () => void;
  onPickImage: () => void;
  onPickPdf: () => void;
  onReply: (msg: ClubGroupMessageItem) => void;
  onBack: () => void;
  onClose: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelected: (file: File) => void;
  onPdfSelected: (file: File) => void;
}) {
  return (
    <>
      <div
        className="d-flex align-items-center gap-2 px-3 py-2 border-bottom"
        style={{ backgroundColor: '#fff' }}
      >
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          style={{ color: TEXT_MUTED }}
          onClick={onBack}
          aria-label="Back"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <ClubIcon icon={chat.icon} name={chat.pageName} size={36} />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK, fontSize: '0.95rem' }}>
            {chat.pageName || 'Club'}
          </div>
          <div className="small text-muted">Group chat</div>
        </div>
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none"
          style={{ color: TEXT_MUTED }}
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="flex-grow-1 overflow-auto px-3 py-3" style={{ backgroundColor: '#fafafa' }}>
        {messagesLoading && messages.length === 0 ? (
          <div className="text-muted small py-3">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-muted small py-3 text-center">
            No messages yet. Say hello to your club!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isMine={!!currentUserId && !!msg.user && msg.user.id === currentUserId}
              showSenderName
              onReply={() => onReply(msg)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-top bg-white">
        {sendError ? (
          <div className="small text-danger px-3 pt-2">{sendError}</div>
        ) : null}
        {chat.messageMode === 'admin_only' ? (
          <div className="small text-muted text-center py-3 px-3">
            Only your category admin can send messages here. You can read updates from them.
          </div>
        ) : (
          <>
            <HiddenChatFileInputs
              imageInputRef={imageInputRef}
              pdfInputRef={pdfInputRef}
              onImageSelected={onImageSelected}
              onPdfSelected={onPdfSelected}
            />
            <ChatComposer
              draft={draft}
              onDraftChange={onDraftChange}
              onSend={onSend}
              sending={sending}
              uploading={uploading}
              replyTo={replyTo}
              onCancelReply={onCancelReply}
              pendingAttachment={pendingAttachment}
              onRemoveAttachment={onRemoveAttachment}
              onPickImage={onPickImage}
              onPickPdf={onPickPdf}
            />
          </>
        )}
      </div>
    </>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
      <h2 className="h6 mb-0" style={{ color: TEXT_DARK, fontWeight: 600 }}>
        {title}
      </h2>
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none"
        style={{ color: TEXT_MUTED }}
        onClick={onClose}
        aria-label="Close"
      >
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}

function ClubIcon({
  icon,
  name,
  size = 40,
}: {
  icon: string;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'rgba(26, 31, 46, 0.08)',
        borderRadius: 8,
      }}
    >
      {isImageIconValue(icon) ? (
        <img
          src={imageSrc(icon)}
          alt={name}
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
        />
      ) : (
        <i
          className={`bi ${icon || 'bi-people-fill'}`}
          style={{ fontSize: `${size * 0.45}px`, color: TEXT_DARK }}
          aria-hidden
        />
      )}
    </div>
  );
}
