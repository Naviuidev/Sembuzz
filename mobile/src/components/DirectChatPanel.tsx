import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import {
  acceptDirectChatRequest,
  blockDirectConversation,
  getDirectChatAvailability,
  listDirectChatInbox,
  listDirectChatStudents,
  listDirectMessages,
  sendDirectChatRequest,
  sendDirectMessage,
  unblockDirectConversation,
  type DirectChatInboxItem,
  type DirectChatStudentRow,
  type DirectChatUser,
  type DirectMessageItem,
} from '../services/directChat';
import { imageSrc, isImageIconValue } from '../utils/image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ChatBubble,
  PendingAttachmentBar,
  ReplyComposerBar,
  ChatComposer,
} from './ChatMessageParts';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  uploadChatAttachmentMobile,
  applyDirectChatBlockState,
  blockedConversationNotice,
  blockedConversationSubtitle,
  type DirectChatBlockFields,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const ACCENT = '#0d6efd';

type DirectStep = 'inbox' | 'new-chat' | 'chat';

interface Props {
  currentUserId?: string | null;
  onMessagingActivity?: () => void;
  initialConversation?: { conversationId: string; peer: DirectChatUser };
  startInChat?: boolean;
}

export function DirectChatPanel({
  currentUserId,
  onMessagingActivity,
  initialConversation,
  startInChat = false,
}: Props) {
  const [step, setStep] = useState<DirectStep>(startInChat && initialConversation ? 'chat' : 'inbox');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [inbox, setInbox] = useState<DirectChatInboxItem[]>([]);
  const [students, setStudents] = useState<DirectChatStudentRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePeer, setActivePeer] = useState<DirectChatUser | null>(
    initialConversation?.peer ?? null,
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversation?.conversationId ?? null,
  );
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
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByPeer, setIsBlockedByPeer] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const notifyActivity = useCallback(() => {
    onMessagingActivity?.();
  }, [onMessagingActivity]);

  const loadInbox = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const availability = await getDirectChatAvailability();
      setAvailable(availability.available);
      if (!availability.available) {
        setInbox([]);
        return;
      }
      const list = await listDirectChatInbox();
      setInbox(list);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not load conversations.'));
      setAvailable(null);
      setInbox([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async (q?: string) => {
    setListLoading(true);
    setError(null);
    try {
      const list = await listDirectChatStudents(q);
      setStudents(list);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not load students.'));
      setStudents([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'inbox' || step === 'chat') {
      void loadInbox();
      const timer = setInterval(() => {
        void loadInbox();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [step, loadInbox]);

  useEffect(() => {
    if (step === 'new-chat') {
      const timer = setTimeout(() => {
        void loadStudents(searchQuery.trim() || undefined);
      }, searchQuery ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [step, searchQuery, loadStudents]);

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
      try {
        const result = await listDirectMessages(conversationId);
        setMessages(result.messages);
        applyBlockState(result);
        notifyActivity();
      } catch (e: unknown) {
        if (!silent) {
          setError(getErrorMessage(e, 'Could not load messages.'));
          setMessages([]);
        }
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [notifyActivity, applyBlockState],
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
    if (step === 'chat' && messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, step]);

  const openChat = (
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
    setIsBlockedByMe(false);
    setIsBlockedByPeer(false);
    if (blockFields) {
      applyBlockState(blockFields);
    }
  };

  const handleAcceptInbox = async (item: DirectChatInboxItem) => {
    setActingOnUserId(item.otherUser.id);
    setError(null);
    try {
      await acceptDirectChatRequest(item.id);
      await loadInbox();
      notifyActivity();
      openChat(item.otherUser, item.id, {
        blockedByUserId: item.blockedByUserId ?? null,
        isBlockedByMe: item.isBlockedByMe,
        isBlockedByPeer: item.isBlockedByPeer,
      });
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not accept request.'));
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleSendRequest = async (row: DirectChatStudentRow) => {
    setActingOnUserId(row.user.id);
    setError(null);
    try {
      const result = await sendDirectChatRequest(row.user.id);
      setActionMessage(result.message);
      await loadStudents(searchQuery.trim() || undefined);
      await loadInbox();
      notifyActivity();
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not send request.'));
    } finally {
      setActingOnUserId(null);
    }
  };

  const handleAcceptStudent = async (row: DirectChatStudentRow) => {
    if (!row.conversationId) return;
    setActingOnUserId(row.user.id);
    setError(null);
    try {
      await acceptDirectChatRequest(row.conversationId);
      await loadStudents(searchQuery.trim() || undefined);
      await loadInbox();
      notifyActivity();
      openChat(row.user, row.conversationId);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not accept request.'));
    } finally {
      setActingOnUserId(null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/direct-chats/upload-attachment', {
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      setPendingAttachment(uploaded);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/direct-chats/upload-attachment', {
        uri: asset.uri,
        name: asset.name || `file-${Date.now()}.pdf`,
        mimeType: asset.mimeType || 'application/pdf',
        size: asset.size,
      });
      setPendingAttachment(uploaded);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not upload PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!activeConversationId || sending || uploading || isBlockedByMe || isBlockedByPeer) return;
    if (!draft.trim() && !pendingAttachment) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendDirectMessage(activeConversationId, {
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
      notifyActivity();
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not send message.'));
    } finally {
      setSending(false);
    }
  };

  const runBlockToggle = async () => {
    if (!activeConversationId || blocking || isBlockedByPeer) return;
    setBlocking(true);
    setError(null);
    setActionMessage(null);
    try {
      const result = isBlockedByMe
        ? await unblockDirectConversation(activeConversationId)
        : await blockDirectConversation(activeConversationId);
      applyBlockState({
        blockedByUserId: result.isBlockedByMe ? currentUserId ?? null : null,
        isBlockedByMe: result.isBlockedByMe,
        isBlockedByPeer: result.isBlockedByPeer,
      });
      setActionMessage(result.message ?? null);
      await loadInbox();
      notifyActivity();
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not update block status.'));
    } finally {
      setBlocking(false);
    }
  };

  const showHeaderMenu = () => {
    if (!activePeer) return;
    if (isBlockedByPeer) {
      Alert.alert(activePeer.name, 'This student blocked you. You cannot send messages.');
      return;
    }
    if (isBlockedByMe) {
      Alert.alert(activePeer.name, undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock conversation', onPress: () => void runBlockToggle() },
      ]);
      return;
    }
    Alert.alert(activePeer.name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block conversation',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Block conversation?',
            `You will not be able to send or receive new messages from ${activePeer.name}.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', style: 'destructive', onPress: () => void runBlockToggle() },
            ],
          );
        },
      },
    ]);
  };

  if (available === false && !initialConversation) {
    return null;
  }

  if (listLoading && available === null && step === 'inbox') {
    return <ActivityIndicator color={TEXT_DARK} style={{ marginVertical: 16 }} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {step === 'inbox' ? (
        <>
          <View style={styles.inboxHeader}>
            <Text style={styles.inboxTitle}>Your conversations</Text>
            <TouchableOpacity
              style={styles.newChatBtn}
              onPress={() => {
                setStep('new-chat');
                setSearchQuery('');
                setError(null);
                setActionMessage(null);
              }}
            >
              <Text style={styles.newChatBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>
          {actionMessage ? <Text style={styles.successText}>{actionMessage}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {listLoading && inbox.length === 0 ? (
            <ActivityIndicator color={TEXT_DARK} style={{ marginVertical: 16 }} />
          ) : inbox.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.body}>No conversations yet.</Text>
              <TouchableOpacity style={styles.newChatBtn} onPress={() => setStep('new-chat')}>
                <Text style={styles.newChatBtnText}>Start a new chat</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 380 }}>
              {inbox.map((item) => (
                <InboxRow
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  acting={actingOnUserId === item.otherUser.id}
                  onOpen={() => {
                    if (item.peerStatus !== 'pending_incoming') {
                      openChat(item.otherUser, item.id, {
                        blockedByUserId: item.blockedByUserId ?? null,
                        isBlockedByMe: item.isBlockedByMe,
                        isBlockedByPeer: item.isBlockedByPeer,
                      });
                    }
                  }}
                  onAccept={() => void handleAcceptInbox(item)}
                />
              ))}
            </ScrollView>
          )}
        </>
      ) : null}

      {step === 'new-chat' ? (
        <>
          <TouchableOpacity onPress={() => setStep('inbox')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to messages</Text>
          </TouchableOpacity>
          <Text style={styles.body}>Find a student and send a chat request.</Text>
          <TextInput
            style={styles.input}
            placeholder="Search students by name or email…"
            placeholderTextColor="#adb5bd"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {listLoading ? (
            <ActivityIndicator color={TEXT_DARK} style={{ marginVertical: 16 }} />
          ) : students.length === 0 ? (
            <Text style={styles.body}>No students found at your school.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 320 }}>
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
            </ScrollView>
          )}
        </>
      ) : null}

      {step === 'chat' && activePeer && activeConversationId ? (
        <>
          <TouchableOpacity
            onPress={() => {
              setStep('inbox');
              setActivePeer(null);
              setActiveConversationId(null);
              setMessages([]);
              setReplyTo(null);
              setPendingAttachment(null);
              void loadInbox();
            }}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>← Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatHeader} onPress={showHeaderMenu} activeOpacity={0.8}>
            <StudentAvatar user={activePeer} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{activePeer.name}</Text>
              <Text style={styles.rowSub}>{activePeer.email}</Text>
              <Text style={styles.rowSub}>
                {blockedConversationSubtitle(isBlockedByMe, isBlockedByPeer) ?? 'Tap for options'}
              </Text>
            </View>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
          {(() => {
            const notice = blockedConversationNotice(isBlockedByMe, isBlockedByPeer);
            return notice ? (
              <Text style={[styles.body, { textAlign: 'center', marginBottom: 8 }]}>{notice}</Text>
            ) : null;
          })()}
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messagesLoading && messages.length === 0 ? (
              <ActivityIndicator color={TEXT_DARK} />
            ) : messages.length === 0 ? (
              <Text style={styles.body}>No messages yet. Say hello!</Text>
            ) : (
              messages.map((msg) => {
                const isMine = !!currentUserId && msg.senderUserId === currentUserId;
                return (
                  <ChatBubble
                    key={msg.id}
                    isMine={isMine}
                    body={msg.body}
                    replyTo={msg.replyTo}
                    attachmentType={msg.attachmentType}
                    attachmentUrl={msg.attachmentUrl}
                    attachmentName={msg.attachmentName}
                    createdAt={msg.createdAt}
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
                );
              })
            )}
          </ScrollView>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {replyTo ? <ReplyComposerBar replyTo={replyTo} onCancel={() => setReplyTo(null)} /> : null}
          {pendingAttachment ? (
            <PendingAttachmentBar
              attachment={pendingAttachment}
              onRemove={() => setPendingAttachment(null)}
            />
          ) : null}
          {uploading ? <Text style={styles.body}>Uploading… (max 5 MB)</Text> : null}
          <ChatComposer
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            sending={sending}
            uploading={uploading}
            disabled={isBlockedByMe || isBlockedByPeer}
            onPickImage={() => void pickImage()}
            onPickPdf={() => void pickPdf()}
            attachmentsDisabled={!!pendingAttachment}
            hasPendingAttachment={!!pendingAttachment}
          />
        </>
      ) : null}
    </KeyboardAvoidingView>
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
    <TouchableOpacity
      style={[styles.inboxRow, hasUnread && styles.inboxRowUnread]}
      onPress={onOpen}
      disabled={isIncoming}
      activeOpacity={isIncoming ? 1 : 0.7}
    >
      <View style={styles.avatarWrap}>
        <StudentAvatar user={item.otherUser} />
        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.inboxRowTop}>
          <Text style={[styles.rowTitle, hasUnread && styles.rowTitleUnread]} numberOfLines={1}>
            {item.otherUser.name}
          </Text>
          <Text style={styles.inboxTime}>{formatRelativeTime(item.lastMessageAt)}</Text>
        </View>
        <Text style={[styles.rowSub, hasUnread && styles.previewUnread]} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {isIncoming ? (
        <TouchableOpacity
          style={styles.rowBtn}
          onPress={onAccept}
          disabled={acting}
        >
          <Text style={styles.rowBtnText}>{acting ? '…' : 'Accept'}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
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
  let label = 'Send request';
  let onPress = onSendRequest;
  let disabled = acting;

  if (peerStatus === 'accepted') {
    label = 'Message';
    onPress = onOpenChat;
    disabled = false;
  } else if (peerStatus === 'pending_incoming') {
    label = acting ? '…' : 'Accept';
    onPress = onAccept;
    disabled = acting;
  } else if (peerStatus === 'pending_outgoing') {
    label = 'Pending';
    onPress = () => {};
    disabled = true;
  }

  return (
    <View style={styles.row}>
      <StudentAvatar user={user} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{user.name}</Text>
        <Text style={styles.rowSub}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.rowBtn, disabled && styles.rowBtnDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.rowBtnText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

function StudentAvatar({ user }: { user: DirectChatUser }) {
  const pic = user.profilePicUrl;
  if (pic && (isImageIconValue(pic) || pic.startsWith('http'))) {
    return (
      <Image
        source={{ uri: isImageIconValue(pic) ? imageSrc(pic) : pic }}
        style={styles.avatarImage}
      />
    );
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function getErrorMessage(e: unknown, fallback: string) {
  const msg =
    e && typeof e === 'object' && 'response' in e
      ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;
  return typeof msg === 'string' ? msg : fallback;
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  if (now.toDateString() === date.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  body: { fontSize: 14, color: TEXT_MUTED, lineHeight: 20, marginBottom: 12 },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inboxTitle: { fontSize: 14, color: TEXT_MUTED },
  newChatBtn: {
    backgroundColor: TEXT_DARK,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newChatBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  backLink: { marginBottom: 8 },
  backLinkText: { color: TEXT_MUTED, fontSize: 13 },
  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inboxRowUnread: { backgroundColor: '#f0f7ff' },
  inboxRowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  inboxTime: { fontSize: 11, color: TEXT_MUTED },
  rowTitleUnread: { fontWeight: '700' },
  previewUnread: { color: TEXT_DARK, fontWeight: '600' },
  avatarWrap: { position: 'relative' },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc3545',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 22, color: TEXT_MUTED },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26,31,46,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontWeight: '700', color: TEXT_DARK },
  rowTitle: { fontWeight: '600', color: TEXT_DARK },
  rowSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  rowBtn: {
    backgroundColor: TEXT_DARK,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  rowBtnDisabled: { opacity: 0.55 },
  rowBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 12,
  },
  composerInput: { flex: 1, marginBottom: 0, borderRadius: 20, backgroundColor: '#f0f2f5' },
  messageList: { maxHeight: 280, backgroundColor: '#f0f2f5', marginBottom: 8 },
  messageListContent: { padding: 12 },
  bubbleRow: { marginBottom: 8, maxWidth: '82%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: TEXT_DARK },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
  errorText: { color: '#dc3545', fontSize: 13, marginTop: 8 },
  successText: { color: '#198754', fontSize: 13, marginBottom: 8 },
});
