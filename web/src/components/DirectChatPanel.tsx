import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  userDirectChatsService,
  USER_DIRECT_CHATS_UNREAD_QUERY_KEY,
  type DirectChatInboxItem,
  type DirectChatStudentRow,
  type DirectChatUser,
  type DirectMessageItem,
} from '../services/user-direct-chats.service';
import { imageSrc } from '../utils/image';
import {
  ChatComposer,
  ChatMessageBubble,
  HiddenChatFileInputs,
} from './ChatMessageUi';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  uploadChatAttachment,
  applyDirectChatBlockState,
  blockedConversationNotice,
  blockedConversationSubtitle,
  type DirectChatBlockFields,
} from '../utils/chatMessage';
const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type DirectStep = 'inbox' | 'new-chat' | 'chat';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface DirectChatPanelProps {
  currentUserId?: string | null;
  /** When set, only render the chat thread (parent supplies conversation list). */
  embeddedConversation?: {
    conversationId: string;
    peer: DirectChatUser;
  } | null;
  onEmbeddedBack?: () => void;
  headerExtra?: React.ReactNode;
}

export function DirectChatPanel({
  currentUserId,
  embeddedConversation = null,
  onEmbeddedBack,
  headerExtra,
}: DirectChatPanelProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<DirectStep>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePeer, setActivePeer] = useState<DirectChatUser | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [actingOnUserId, setActingOnUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByPeer, setIsBlockedByPeer] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const embeddedMode = onEmbeddedBack != null;

  const { data: availability, isLoading: availabilityLoading, isError: availabilityError } = useQuery({
    queryKey: ['user', 'direct-chats', 'availability'],
    queryFn: userDirectChatsService.getAvailability,
  });

  const {
    data: inbox = [],
    isLoading: inboxLoading,
    isFetching: inboxFetching,
    isError: inboxError,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ['user', 'direct-chats', 'inbox'],
    queryFn: userDirectChatsService.listInbox,
    enabled: availability?.available === true && !embeddedMode && (step === 'inbox' || step === 'chat'),
    refetchInterval: step === 'inbox' || step === 'chat' ? 3000 : false,
  });

  const {
    data: students = [],
    isLoading: studentsLoading,
    isFetching: studentsFetching,
    isError: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ['user', 'direct-chats', 'students', searchQuery],
    queryFn: () => userDirectChatsService.listStudents(searchQuery.trim() || undefined),
    enabled: availability?.available === true && step === 'new-chat',
    refetchInterval: step === 'new-chat' ? 8000 : false,
  });

  const invalidateMessaging = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['user', 'direct-chats'] });
    void queryClient.invalidateQueries({ queryKey: USER_DIRECT_CHATS_UNREAD_QUERY_KEY });
  }, [queryClient]);

  const applyBlockState = useCallback(
    (fields: DirectChatBlockFields) => {
      const resolved = applyDirectChatBlockState(fields, currentUserId);
      if (resolved) {
        setIsBlockedByMe(resolved.isBlockedByMe);
        setIsBlockedByPeer(resolved.isBlockedByPeer);
      }
    },
    [currentUserId],
  );

  const loadMessages = useCallback(
    async (conversationId: string, silent = false) => {
      if (!silent) setMessagesLoading(true);
      setError(null);
      try {
        const result = await userDirectChatsService.listMessages(conversationId);
        setMessages(result.messages);
        applyBlockState(result);
        if (!silent) {
          await userDirectChatsService.markRead(conversationId);
        }
        invalidateMessaging();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not load messages.';
        if (!silent) {
          setError(msg);
          setMessages([]);
        }
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [invalidateMessaging, applyBlockState],
  );

  useEffect(() => {
    if (step !== 'chat' || !activeConversationId) return;
    void loadMessages(activeConversationId);
    const timer = setInterval(() => {
      void loadMessages(activeConversationId, true);
    }, 2500);
    return () => clearInterval(timer);
  }, [step, activeConversationId, loadMessages]);

  useEffect(() => {
    if (step === 'chat' && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, step]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [headerMenuOpen]);

  const openChat = useCallback((
    peer: DirectChatUser,
    conversationId: string,
    blockFields?: DirectChatBlockFields,
  ) => {
    setActivePeer(peer);
    setActiveConversationId(conversationId);
    setStep('chat');
    setDraft('');
    setError(null);
    setActionMessage(null);
    setReplyTo(null);
    setPendingAttachment(null);
    setHeaderMenuOpen(false);
    setIsBlockedByMe(false);
    setIsBlockedByPeer(false);
    if (blockFields) {
      applyBlockState(blockFields);
    }
    prevMessageCountRef.current = 0;
  }, [applyBlockState]);

  const handleChatBack = useCallback(() => {
    if (embeddedMode && onEmbeddedBack) {
      onEmbeddedBack();
      setActivePeer(null);
      setActiveConversationId(null);
      setMessages([]);
      setReplyTo(null);
      setPendingAttachment(null);
      setHeaderMenuOpen(false);
      return;
    }
    setStep('inbox');
    setActivePeer(null);
    setActiveConversationId(null);
    setMessages([]);
    setReplyTo(null);
    setPendingAttachment(null);
    void refetchInbox();
  }, [embeddedMode, onEmbeddedBack, refetchInbox]);

  useEffect(() => {
    if (!embeddedConversation) return;
    openChat(embeddedConversation.peer, embeddedConversation.conversationId);
  }, [embeddedConversation, openChat]);

  const handleOpenInboxItem = (item: DirectChatInboxItem) => {
    if (item.peerStatus === 'pending_incoming') return;
    openChat(item.otherUser, item.id, {
      blockedByUserId: item.blockedByUserId ?? null,
      isBlockedByMe: item.isBlockedByMe,
      isBlockedByPeer: item.isBlockedByPeer,
    });
  };

  const handleAcceptInbox = async (item: DirectChatInboxItem) => {
    setActingOnUserId(item.otherUser.id);
    setError(null);
    setActionMessage(null);
    try {
      const result = await userDirectChatsService.acceptRequest(item.id);
      setActionMessage(result.message ?? 'Request accepted.');
      await refetchInbox();
      invalidateMessaging();
      openChat(item.otherUser, item.id);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not accept request.';
      setError(msg);
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleSendRequest = async (row: DirectChatStudentRow) => {
    setActingOnUserId(row.user.id);
    setError(null);
    setActionMessage(null);
    try {
      const result = await userDirectChatsService.sendRequest(row.user.id);
      setActionMessage(result.message);
      await refetchStudents();
      await refetchInbox();
      invalidateMessaging();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send request.';
      setError(msg);
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleAcceptStudent = async (row: DirectChatStudentRow) => {
    if (!row.conversationId) return;
    setActingOnUserId(row.user.id);
    setError(null);
    setActionMessage(null);
    try {
      const result = await userDirectChatsService.acceptRequest(row.conversationId);
      setActionMessage(result.message ?? 'Request accepted.');
      await refetchStudents();
      await refetchInbox();
      invalidateMessaging();
      openChat(row.user, row.conversationId);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not accept request.';
      setError(msg);
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleFileSelected = async (file: File, kind: 'image' | 'pdf') => {
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be 5 MB or smaller.');
      return;
    }
    if (kind === 'pdf' && file.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadChatAttachment('/user/direct-chats/upload-attachment', file);
      setPendingAttachment(uploaded);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not upload file.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!activeConversationId || sending || uploading || isBlockedByMe || isBlockedByPeer) return;
    if (!draft.trim() && !pendingAttachment) return;
    setSending(true);
    setError(null);
    try {
      const msg = await userDirectChatsService.sendMessage(activeConversationId, {
        body: draft.trim() || undefined,
        attachmentUrl: pendingAttachment?.url,
        attachmentType: pendingAttachment?.attachmentType,
        attachmentName: pendingAttachment?.attachmentName,
        replyToMessageId: replyTo?.id,
      });
      setDraft('');
      setReplyTo(null);
      setPendingAttachment(null);
      setMessages((prev) => [...prev, msg]);
      invalidateMessaging();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send message.';
      setError(message);
    } finally {
      setSending(false);
    }
  }, [
    activeConversationId,
    draft,
    sending,
    uploading,
    pendingAttachment,
    replyTo,
    invalidateMessaging,
    isBlockedByMe,
    isBlockedByPeer,
  ]);

  const handleBlockToggle = async () => {
    if (!activeConversationId || blocking || isBlockedByPeer) return;
    setHeaderMenuOpen(false);
    if (
      !isBlockedByMe &&
      !window.confirm(
        `Block ${activePeer?.name ?? 'this student'}? You will not be able to send or receive new messages.`,
      )
    ) {
      return;
    }
    setBlocking(true);
    setError(null);
    setActionMessage(null);
    try {
      const result = isBlockedByMe
        ? await userDirectChatsService.unblockConversation(activeConversationId)
        : await userDirectChatsService.blockConversation(activeConversationId);
      applyBlockState({
        blockedByUserId: result.isBlockedByMe ? currentUserId ?? null : null,
        isBlockedByMe: result.isBlockedByMe,
        isBlockedByPeer: result.isBlockedByPeer,
      });
      setActionMessage(result.message ?? null);
      await refetchInbox();
      invalidateMessaging();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not update block status.';
      setError(msg);
    } finally {
      setBlocking(false);
    }
  };

  if (!embeddedConversation) {
    if (availabilityLoading) {
      return <p className="small text-muted mb-0">Loading…</p>;
    }

    if (availabilityError) {
      return (
        <p className="small text-danger mb-0">
          Could not load direct messaging. Make sure the app is connected to an updated server and try again.
        </p>
      );
    }

    if (availability && !availability.available) {
      return (
        <p className="small text-muted mb-0">
          Direct messaging is not available for your school right now.
        </p>
      );
    }
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: embeddedMode ? '100%' : 420, height: embeddedMode ? '100%' : undefined }}>
      {!embeddedMode && step === 'inbox' ? (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p className="small text-muted mb-0">Your conversations</p>
            <button
              type="button"
              className="btn btn-sm btn-dark"
              style={{ borderRadius: 0 }}
              onClick={() => {
                setStep('new-chat');
                setSearchQuery('');
                setError(null);
                setActionMessage(null);
              }}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden />
              New chat
            </button>
          </div>

          {actionMessage ? (
            <div className="alert alert-success border-0 py-2 small mb-2" style={{ borderRadius: 0 }}>
              {actionMessage}
            </div>
          ) : null}
          {error ? (
            <div className="alert alert-danger border-0 py-2 small mb-2" style={{ borderRadius: 0 }}>
              {error}
            </div>
          ) : null}

          {inboxLoading || (inboxFetching && inbox.length === 0) ? (
            <p className="small text-muted">Loading conversations…</p>
          ) : inboxError ? (
            <p className="small text-danger mb-0">Could not load conversations.</p>
          ) : inbox.length === 0 ? (
            <div className="text-center py-4">
              <p className="small text-muted mb-3">No conversations yet.</p>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                style={{ borderRadius: 0 }}
                onClick={() => setStep('new-chat')}
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <ul className="list-unstyled mb-0 flex-grow-1" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {inbox.map((item) => (
                <InboxRow
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  acting={actingOnUserId === item.otherUser.id}
                  onOpen={() => handleOpenInboxItem(item)}
                  onAccept={() => void handleAcceptInbox(item)}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}

      {!embeddedMode && step === 'new-chat' ? (
        <>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 mb-3 text-decoration-none"
            style={{ color: TEXT_MUTED }}
            onClick={() => {
              setStep('inbox');
              setError(null);
              setActionMessage(null);
            }}
          >
            ← Back to messages
          </button>
          <p className="small text-muted mb-3">
            Find a student at your school and send a chat request.
          </p>
          <input
            type="search"
            className="form-control mb-3"
            placeholder="Search students by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderRadius: 0 }}
            autoFocus
          />
          {studentsLoading || studentsFetching ? (
            <p className="small text-muted">Loading students…</p>
          ) : studentsError ? (
            <p className="small text-danger mb-0">Could not load students.</p>
          ) : students.length === 0 ? (
            <p className="small text-muted mb-0">No students found at your school.</p>
          ) : (
            <ul className="list-unstyled mb-0" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {students.map((row) => (
                <StudentRow
                  key={row.user.id}
                  row={row}
                  acting={actingOnUserId === row.user.id}
                  onSendRequest={() => void handleSendRequest(row)}
                  onAccept={() => void handleAcceptStudent(row)}
                  onOpenChat={() => {
                    if (row.conversationId) openChat(row.user, row.conversationId);
                  }}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}

      {step === 'chat' && activePeer && activeConversationId ? (
        embeddedMode ? (
          <div className="d-flex flex-column h-100" style={{ backgroundColor: '#efeae2' }}>
            <div
              ref={headerMenuRef}
              className="d-flex align-items-center gap-2 px-3 py-2 flex-shrink-0 position-relative"
              style={{ backgroundColor: TEXT_DARK, color: '#fff', minHeight: 60 }}
            >
              <button
                type="button"
                className="btn btn-link p-0 text-white"
                onClick={handleChatBack}
                aria-label="Back"
              >
                <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem' }} />
              </button>
              <StudentAvatar user={activePeer} size={40} />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold text-truncate">{activePeer.name}</div>
                <div className="small text-white-50 text-truncate">
                  {blockedConversationSubtitle(isBlockedByMe, isBlockedByPeer) ?? 'Tap to chat'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-white flex-shrink-0"
                onClick={() => setHeaderMenuOpen((open) => !open)}
                aria-label="Chat options"
                aria-haspopup="menu"
                aria-expanded={headerMenuOpen}
              >
                <i className="bi bi-three-dots-vertical" style={{ fontSize: '1.15rem' }} />
              </button>
              {headerMenuOpen ? (
                <div
                  className="position-absolute bg-white border shadow-sm rounded overflow-hidden"
                  style={{ zIndex: 20, minWidth: 200, top: '100%', right: 12 }}
                  role="menu"
                >
                  {isBlockedByPeer ? (
                    <div className="px-3 py-2 small text-muted">
                      This student blocked you. You cannot send messages.
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-100 text-start px-3 py-2 border-0 bg-white"
                      style={{ color: isBlockedByMe ? TEXT_DARK : '#dc3545' }}
                      onClick={() => void handleBlockToggle()}
                      disabled={blocking}
                      role="menuitem"
                    >
                      {blocking ? '…' : isBlockedByMe ? 'Unblock conversation' : 'Block conversation'}
                    </button>
                  )}
                </div>
              ) : null}
              {headerExtra}
            </div>

            {(() => {
              const notice = blockedConversationNotice(isBlockedByMe, isBlockedByPeer);
              return notice ? (
                <div className="small text-muted text-center py-2 px-3 flex-shrink-0 bg-white border-bottom">
                  {notice}
                </div>
              ) : null;
            })()}

            <div className="flex-grow-1 overflow-auto px-3 py-3" style={{ minHeight: 0 }}>
              {messagesLoading && messages.length === 0 ? (
                <p className="small text-muted mb-0 text-center">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="small text-muted mb-0 text-center py-4">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg, index) => {
                  const isMine = !!currentUserId && msg.senderUserId === currentUserId;
                  const prev = messages[index - 1];
                  const showDate =
                    !prev ||
                    new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate ? (
                        <div className="text-center small text-muted my-2">
                          {formatMessageDate(msg.createdAt)}
                        </div>
                      ) : null}
                      <ChatMessageBubble
                        message={msg}
                        isMine={isMine}
                        onReply={() =>
                          setReplyTo({
                            id: msg.id,
                            body: msg.body,
                            attachmentType: msg.attachmentType,
                            attachmentUrl: msg.attachmentUrl,
                            attachmentName: msg.attachmentName,
                            senderUserId: msg.senderUserId,
                            sender: msg.sender,
                          })
                        }
                      />
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {error ? <div className="small text-danger px-3 pb-1 flex-shrink-0">{error}</div> : null}

            <div className="flex-shrink-0 bg-white border-top">
              <HiddenChatFileInputs
                imageInputRef={imageInputRef}
                pdfInputRef={pdfInputRef}
                onImageSelected={(file) => void handleFileSelected(file, 'image')}
                onPdfSelected={(file) => void handleFileSelected(file, 'pdf')}
              />
              <ChatComposer
                draft={draft}
                onDraftChange={setDraft}
                onSend={() => void handleSend()}
                sending={sending}
                uploading={uploading}
                disabled={isBlockedByMe || isBlockedByPeer}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                pendingAttachment={pendingAttachment}
                onRemoveAttachment={() => setPendingAttachment(null)}
                onPickImage={() => imageInputRef.current?.click()}
                onPickPdf={() => pdfInputRef.current?.click()}
              />
            </div>
          </div>
        ) : (
        <>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 mb-2 text-decoration-none"
            style={{ color: TEXT_MUTED }}
            onClick={handleChatBack}
          >
            ← Messages
          </button>

          <div
            ref={headerMenuRef}
            className="d-flex align-items-center gap-3 px-3 py-2 mb-2 border-bottom position-relative"
            style={{ backgroundColor: '#f8f9fa' }}
          >
            <button
              type="button"
              className="btn btn-link p-0 border-0 d-flex align-items-center gap-3 flex-grow-1 text-decoration-none text-start"
              onClick={() => setHeaderMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={headerMenuOpen}
            >
              <StudentAvatar user={activePeer} size={44} />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK }}>
                  {activePeer.name}
                </div>
                <div className="small text-muted text-truncate">{activePeer.email}</div>
                <div className="small text-muted text-truncate">
                  {blockedConversationSubtitle(isBlockedByMe, isBlockedByPeer) ?? 'Active now'}
                </div>
              </div>
              <i className="bi bi-chevron-down text-muted flex-shrink-0" aria-hidden />
            </button>
            {headerMenuOpen ? (
              <div
                className="position-absolute top-100 end-0 mt-1 bg-white border shadow-sm rounded overflow-hidden"
                style={{ zIndex: 20, minWidth: 200 }}
                role="menu"
              >
                {isBlockedByPeer ? (
                  <div className="px-3 py-2 small text-muted">
                    This student blocked you. You cannot send messages.
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-100 text-start px-3 py-2 border-0 bg-white"
                    style={{ color: isBlockedByMe ? TEXT_DARK : '#dc3545' }}
                    onClick={() => void handleBlockToggle()}
                    disabled={blocking}
                    role="menuitem"
                  >
                    {blocking ? '…' : isBlockedByMe ? 'Unblock conversation' : 'Block conversation'}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {(() => {
            const notice = blockedConversationNotice(isBlockedByMe, isBlockedByPeer);
            return notice ? (
              <div className="small text-muted text-center mb-2 px-3">{notice}</div>
            ) : null;
          })()}

          <div
            className="flex-grow-1 overflow-auto px-3 py-3 mb-2"
            style={{ minHeight: 260, maxHeight: 300, backgroundColor: '#f0f2f5' }}
          >
            {messagesLoading && messages.length === 0 ? (
              <p className="small text-muted mb-0 text-center">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="small text-muted mb-0 text-center py-4">
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((msg, index) => {
                const isMine = !!currentUserId && msg.senderUserId === currentUserId;
                const prev = messages[index - 1];
                const showDate =
                  !prev ||
                  new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate ? (
                      <div className="text-center small text-muted my-2">
                        {formatMessageDate(msg.createdAt)}
                      </div>
                    ) : null}
                    <ChatMessageBubble
                      message={msg}
                      isMine={isMine}
                      onReply={() =>
                        setReplyTo({
                          id: msg.id,
                          body: msg.body,
                          attachmentType: msg.attachmentType,
                          attachmentUrl: msg.attachmentUrl,
                          attachmentName: msg.attachmentName,
                          senderUserId: msg.senderUserId,
                          sender: msg.sender,
                        })
                      }
                    />
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {error ? <div className="small text-danger mb-2">{error}</div> : null}

          <HiddenChatFileInputs
            imageInputRef={imageInputRef}
            pdfInputRef={pdfInputRef}
            onImageSelected={(file) => void handleFileSelected(file, 'image')}
            onPdfSelected={(file) => void handleFileSelected(file, 'pdf')}
          />
          <ChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            sending={sending}
            uploading={uploading}
            disabled={isBlockedByMe || isBlockedByPeer}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            pendingAttachment={pendingAttachment}
            onRemoveAttachment={() => setPendingAttachment(null)}
            onPickImage={() => imageInputRef.current?.click()}
            onPickPdf={() => pdfInputRef.current?.click()}
          />
        </>
        )
      ) : null}
    </div>
  );
}

function InboxRow({
  item,
  currentUserId,
  acting,
  onOpen,
  onAccept,
}: {
  item: DirectChatInboxItem;
  currentUserId?: string | null;
  acting: boolean;
  onOpen: () => void;
  onAccept: () => void;
}) {
  const hasUnread = item.unreadCount > 0;
  const isIncoming = item.peerStatus === 'pending_incoming';
  const preview =
    isIncoming
      ? 'Wants to chat with you'
      : item.lastMessagePreview
        ? `${item.lastMessageSenderUserId === currentUserId ? 'You: ' : ''}${item.lastMessagePreview}`
        : 'No messages yet';

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        className="d-flex align-items-center gap-3 px-2 py-3 border-bottom"
        style={{
          cursor: isIncoming ? 'default' : 'pointer',
          backgroundColor: hasUnread ? '#f0f7ff' : '#fff',
        }}
        onClick={() => {
          if (!isIncoming) onOpen();
        }}
        onKeyDown={(e) => {
          if (!isIncoming && (e.key === 'Enter' || e.key === ' ')) onOpen();
        }}
      >
        <div className="position-relative flex-shrink-0">
          <StudentAvatar user={item.otherUser} size={48} />
          {hasUnread ? (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          ) : null}
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div
              className={`text-truncate ${hasUnread ? 'fw-bold' : 'fw-semibold'}`}
              style={{ color: TEXT_DARK }}
            >
              {item.otherUser.name}
            </div>
            <div className="small text-muted flex-shrink-0">
              {formatRelativeTime(item.lastMessageAt)}
            </div>
          </div>
          <div
            className={`small text-truncate ${hasUnread ? 'fw-semibold text-dark' : 'text-muted'}`}
          >
            {preview}
          </div>
        </div>
        {isIncoming ? (
          <button
            type="button"
            className="btn btn-sm btn-dark flex-shrink-0"
            style={{ borderRadius: 0 }}
            disabled={acting}
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
          >
            {acting ? '…' : 'Accept'}
          </button>
        ) : (
          <i className="bi bi-chevron-right text-muted flex-shrink-0" aria-hidden />
        )}
      </div>
    </li>
  );
}

function StudentRow({
  row,
  acting,
  onSendRequest,
  onAccept,
  onOpenChat,
}: {
  row: DirectChatStudentRow;
  acting: boolean;
  onSendRequest: () => void;
  onAccept: () => void;
  onOpenChat: () => void;
}) {
  const { user, peerStatus } = row;

  let action: React.ReactNode;
  if (peerStatus === 'accepted') {
    action = (
      <button
        type="button"
        className="btn btn-sm btn-dark"
        style={{ borderRadius: 0, minWidth: 88 }}
        onClick={onOpenChat}
      >
        Message
      </button>
    );
  } else if (peerStatus === 'pending_incoming') {
    action = (
      <button
        type="button"
        className="btn btn-sm btn-dark"
        style={{ borderRadius: 0, minWidth: 88 }}
        disabled={acting}
        onClick={onAccept}
      >
        {acting ? '…' : 'Accept'}
      </button>
    );
  } else if (peerStatus === 'pending_outgoing') {
    action = (
      <button type="button" className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 0, minWidth: 88 }} disabled>
        Pending
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        className="btn btn-sm btn-dark"
        style={{ borderRadius: 0, minWidth: 88 }}
        disabled={acting}
        onClick={onSendRequest}
      >
        {acting ? '…' : 'Send request'}
      </button>
    );
  }

  return (
    <li>
      <div
        className="d-flex align-items-center gap-3 p-3 border-bottom"
        style={{ backgroundColor: '#fff' }}
      >
        <StudentAvatar user={user} size={40} />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-truncate" style={{ color: TEXT_DARK }}>
            {user.name}
          </div>
          <div className="small text-muted text-truncate">{user.email}</div>
        </div>
        {action}
      </div>
    </li>
  );
}

export function StudentAvatar({ user, size = 40 }: { user: DirectChatUser; size?: number }) {
  const [failed, setFailed] = useState(false);
  const pic = user.profilePicUrl;
  const url = pic && !failed ? imageSrc(pic) : '';

  if (url) {
    return (
      <img
        src={url}
        alt={user.name}
        className="flex-shrink-0"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'rgba(26, 31, 46, 0.1)',
        color: TEXT_DARK,
        fontSize: size * 0.35,
      }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && now.toDateString() === date.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHr < 48) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
