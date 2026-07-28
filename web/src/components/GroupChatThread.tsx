import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatComposer,
  ChatMessageBubble,
  HiddenChatFileInputs,
} from './ChatMessageUi';
import {
  type ChatMessageReplyTo,
  type ChatMessageShape,
  type PendingChatAttachment,
  uploadChatAttachment,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type UploadEndpoint =
  | '/user/club-group-chats/upload-attachment'
  | '/user/student-chat-groups/upload-attachment';

interface GroupChatThreadProps {
  groupId: string;
  title: string;
  subtitle?: string;
  currentUserId?: string | null;
  queryKey: readonly unknown[];
  listMessages: (groupId: string) => Promise<ChatMessageShape[]>;
  sendMessage: (
    groupId: string,
    payload: {
      body?: string;
      attachmentUrl?: string;
      attachmentType?: 'image' | 'pdf';
      attachmentName?: string;
      replyToMessageId?: string;
    },
  ) => Promise<unknown>;
  uploadEndpoint: UploadEndpoint;
  readOnly?: boolean;
  onBack?: () => void;
  onLeave?: () => void;
  headerExtra?: React.ReactNode;
}

export function GroupChatThread({
  groupId,
  title,
  subtitle,
  currentUserId,
  queryKey,
  listMessages,
  sendMessage,
  uploadEndpoint,
  readOnly = false,
  onBack,
  onLeave,
  headerExtra,
}: GroupChatThreadProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, groupId, 'messages'],
    queryFn: () => listMessages(groupId),
    enabled: !!groupId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelected = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setSendError('File must be 5 MB or smaller.');
      return;
    }
    setUploading(true);
    setSendError(null);
    try {
      const uploaded = await uploadChatAttachment(uploadEndpoint, file);
      setPendingAttachment(uploaded);
    } catch {
      setSendError('Could not upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (readOnly || sending || uploading) return;
    if (!draft.trim() && !pendingAttachment) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(groupId, {
        body: draft.trim() || undefined,
        attachmentUrl: pendingAttachment?.url,
        attachmentType: pendingAttachment?.attachmentType,
        attachmentName: pendingAttachment?.attachmentName,
        replyToMessageId: replyTo?.id,
      });
      setDraft('');
      setReplyTo(null);
      setPendingAttachment(null);
      await refetch();
      void queryClient.invalidateQueries({ queryKey });
    } catch {
      setSendError('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [
    readOnly,
    sending,
    uploading,
    draft,
    pendingAttachment,
    replyTo,
    groupId,
    sendMessage,
    refetch,
    queryClient,
    queryKey,
  ]);

  return (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: '#efeae2' }}>
      <div
        className="d-flex align-items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ backgroundColor: TEXT_DARK, color: '#fff', minHeight: 60 }}
      >
        {onBack ? (
          <button
            type="button"
            className="btn btn-link p-0 text-white"
            onClick={onBack}
            aria-label="Back"
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem' }} />
          </button>
        ) : null}
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <i className="bi bi-people-fill" />
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-truncate">{title}</div>
          {subtitle ? <div className="small text-white-50 text-truncate">{subtitle}</div> : null}
        </div>
        {headerExtra}
        {onLeave ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={onLeave}
            title="Leave group"
          >
            Leave
          </button>
        ) : null}
      </div>

      <div className="flex-grow-1 overflow-auto px-2 py-3" style={{ minHeight: 0 }}>
        {isLoading ? (
          <p className="small text-muted text-center mt-4">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="small text-muted text-center mt-4">
            No messages yet. Say hello to the group.
          </p>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isMine={
                msg.senderUserId === currentUserId ||
                msg.sender?.id === currentUserId ||
                msg.user?.id === currentUserId
              }
              showSenderName
              onReply={() =>
                setReplyTo({
                  id: msg.id,
                  body: msg.body,
                  attachmentType: msg.attachmentType,
                  attachmentUrl: msg.attachmentUrl,
                  attachmentName: msg.attachmentName,
                  senderUserId: msg.senderUserId,
                  sender: msg.sender ?? msg.user ?? undefined,
                  user: msg.user ?? undefined,
                  categoryAdmin: msg.categoryAdmin ?? undefined,
                })
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {readOnly ? (
        <div className="px-3 py-2 small text-muted text-center border-top bg-white">
          Only admins can send messages in this group.
        </div>
      ) : (
        <>
          {sendError ? (
            <div className="px-3 py-1 small text-danger bg-white border-top">{sendError}</div>
          ) : null}
          <ChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            sending={sending}
            uploading={uploading}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            pendingAttachment={pendingAttachment}
            onRemoveAttachment={() => setPendingAttachment(null)}
            onPickImage={() => imageInputRef.current?.click()}
            onPickPdf={() => pdfInputRef.current?.click()}
          />
          <HiddenChatFileInputs
            imageInputRef={imageInputRef}
            pdfInputRef={pdfInputRef}
            onImageSelected={handleFileSelected}
            onPdfSelected={handleFileSelected}
          />
        </>
      )}
    </div>
  );
}
