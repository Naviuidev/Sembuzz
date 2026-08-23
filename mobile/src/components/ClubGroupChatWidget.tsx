import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import ChatDotsFillIcon from 'react-native-bootstrap-icons/icons/chat-dots-fill';
import XIcon from 'react-native-bootstrap-icons/icons/x';
import ChevronRightIcon from 'react-native-bootstrap-icons/icons/chevron-right';
import ArrowLeftIcon from 'react-native-bootstrap-icons/icons/arrow-left';
import {
  listClubGroupChats,
  listClubGroupMessages,
  sendClubGroupMessage,
  type ClubGroupChatPublic,
  type ClubGroupMessageItem,
} from '../services/clubGroupChat';
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
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type PanelView = 'closed' | 'picker' | 'chat';

interface ClubGroupChatWidgetProps {
  visible: boolean;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  onRequireLogin?: () => void;
}

export function ClubGroupChatWidget({
  visible,
  isAuthenticated,
  currentUserId,
  onRequireLogin,
}: ClubGroupChatWidgetProps) {
  const [groupChats, setGroupChats] = useState<ClubGroupChatPublic[]>([]);
  const [panelView, setPanelView] = useState<PanelView>('closed');
  const [activeChat, setActiveChat] = useState<ClubGroupChatPublic | null>(null);
  const [messages, setMessages] = useState<ClubGroupMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<ClubGroupMessageItem> | null>(null);

  useEffect(() => {
    if (!visible || !isAuthenticated) {
      setGroupChats([]);
      return;
    }
    let cancelled = false;
    listClubGroupChats()
      .then((list) => {
        if (!cancelled) setGroupChats(list);
      })
      .catch(() => {
        if (!cancelled) setGroupChats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, isAuthenticated]);

  const loadMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const list = await listClubGroupMessages(chatId);
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (panelView !== 'chat' || !activeChat?.id) return;
    void loadMessages(activeChat.id);
    pollRef.current = setInterval(() => {
      void loadMessages(activeChat.id);
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [panelView, activeChat?.id, loadMessages]);

  useEffect(() => {
    if (panelView === 'chat' && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, panelView]);

  const showFab = visible && (isAuthenticated ? groupChats.length > 0 : true);

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
    setMessages([]);
  }, []);

  const selectChat = useCallback((chat: ClubGroupChatPublic) => {
    setActiveChat(chat);
    setPanelView('chat');
    setDraft('');
    setSendError(null);
    setReplyTo(null);
    setPendingAttachment(null);
  }, []);

  const uploadFile = async (file: { uri: string; name: string; mimeType: string; size?: number }) => {
    setUploading(true);
    setSendError(null);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/club-group-chats/upload-attachment', file);
      setPendingAttachment(uploaded);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Could not upload file.');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadFile({
      uri: asset.uri,
      name: asset.fileName || `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      size: asset.fileSize,
    });
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await uploadFile({
      uri: asset.uri,
      name: asset.name || `file-${Date.now()}.pdf`,
      mimeType: asset.mimeType || 'application/pdf',
      size: asset.size,
    });
  };

  const handleSend = useCallback(async () => {
    if (!activeChat || sending || uploading) return;
    if (!draft.trim() && !pendingAttachment) return;
    if (activeChat.messageMode === 'admin_only') return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await sendClubGroupMessage(activeChat.id, {
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
    } catch {
      setSendError('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [activeChat, draft, sending, uploading, pendingAttachment, replyTo]);

  if (!showFab) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={openPickerOrChat}
        accessibilityLabel="Open club group chats"
        activeOpacity={0.9}
      >
        <ChatDotsFillIcon width={26} height={26} fill="#fff" />
      </TouchableOpacity>

      <Modal
        visible={panelView !== 'closed'}
        animationType="slide"
        transparent
        onRequestClose={closePanel}
      >
        <Pressable style={styles.overlay} onPress={closePanel}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {panelView === 'picker' ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Club group chats</Text>
                  <TouchableOpacity onPress={closePanel} hitSlop={12}>
                    <XIcon width={20} height={20} fill={TEXT_MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pickerHint}>Select a group to start chatting.</Text>
                <FlatList
                  data={groupChats}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.pickerRow} onPress={() => selectChat(item)}>
                      <ClubIcon icon={item.icon} name={item.pageName} />
                      <Text style={styles.pickerName}>{item.pageName || 'Club'}</Text>
                      <ChevronRightIcon width={18} height={18} fill={TEXT_MUTED} />
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : activeChat ? (
              <KeyboardAvoidingView
                style={styles.chatWrap}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
              >
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={() => {
                      if (groupChats.length > 1) {
                        setPanelView('picker');
                        setActiveChat(null);
                        setMessages([]);
                      } else {
                        closePanel();
                      }
                    }}
                    hitSlop={12}
                    style={styles.backBtn}
                  >
                    <ArrowLeftIcon width={20} height={20} fill={TEXT_MUTED} />
                  </TouchableOpacity>
                  <ClubIcon icon={activeChat.icon} name={activeChat.pageName} size={36} />
                  <View style={styles.headerText}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      {activeChat.pageName || 'Club'}
                    </Text>
                    <Text style={styles.headerSub}>Group chat</Text>
                  </View>
                  <TouchableOpacity onPress={closePanel} hitSlop={12}>
                    <XIcon width={20} height={20} fill={TEXT_MUTED} />
                  </TouchableOpacity>
                </View>

                {messagesLoading && messages.length === 0 ? (
                  <ActivityIndicator style={styles.loader} color={TEXT_DARK} />
                ) : (
                  <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No messages yet. Say hello to your club!</Text>
                    }
                    renderItem={({ item }) => (
                      <View>
                        {!item.user || item.user.id !== currentUserId ? (
                          <Text style={styles.senderName}>
                            {item.categoryAdmin
                              ? `${item.categoryAdmin.name} (Admin)`
                              : item.user?.name ?? 'Unknown'}
                          </Text>
                        ) : null}
                        <ChatBubble
                          isMine={!!currentUserId && !!item.user && item.user.id === currentUserId}
                          body={item.body}
                          replyTo={item.replyTo}
                          attachmentType={item.attachmentType}
                          attachmentUrl={item.attachmentUrl}
                          attachmentName={item.attachmentName}
                          createdAt={item.createdAt}
                          onReply={() =>
                            setReplyTo({
                              id: item.id,
                              body: item.body,
                              attachmentType: item.attachmentType,
                              attachmentUrl: item.attachmentUrl,
                              attachmentName: item.attachmentName,
                              user: item.user,
                              categoryAdmin: item.categoryAdmin,
                            })
                          }
                        />
                      </View>
                    )}
                  />
                )}

                {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
                {activeChat.messageMode === 'admin_only' ? (
                  <Text style={styles.readOnlyHint}>
                    Only your subcategory admin can send messages here. You can read updates from them.
                  </Text>
                ) : (
                  <>
                    {replyTo ? <ReplyComposerBar replyTo={replyTo} onCancel={() => setReplyTo(null)} /> : null}
                    {pendingAttachment ? (
                      <PendingAttachmentBar
                        attachment={pendingAttachment}
                        onRemove={() => setPendingAttachment(null)}
                      />
                    ) : null}
                    {uploading ? <Text style={styles.readOnlyHint}>Uploading… (max 5 MB)</Text> : null}
                    <ChatComposer
                      draft={draft}
                      onDraftChange={setDraft}
                      onSend={() => void handleSend()}
                      sending={sending}
                      uploading={uploading}
                      onPickImage={() => void pickImage()}
                      onPickPdf={() => void pickPdf()}
                      attachmentsDisabled={!!pendingAttachment}
                      hasPendingAttachment={!!pendingAttachment}
                    />
                  </>
                )}
              </KeyboardAvoidingView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    <View style={[styles.clubIconWrap, { width: size, height: size, borderRadius: 8 }]}>
      {isImageIconValue(icon) ? (
        <Image
          source={{ uri: imageSrc(icon) }}
          style={{ width: size - 8, height: size - 8 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={{ fontSize: size * 0.4, color: TEXT_DARK }}>{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEXT_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 0,
    maxHeight: '72%',
    minHeight: 320,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    marginRight: 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  headerSub: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  pickerHint: {
    fontSize: 13,
    color: TEXT_MUTED,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  pickerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  chatWrap: {
    flex: 1,
    minHeight: 320,
  },
  loader: {
    marginVertical: 24,
  },
  messageList: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  messageListContent: {
    padding: 12,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 13,
    marginTop: 24,
  },
  bubbleRow: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bubbleMine: {
    backgroundColor: TEXT_DARK,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  sendError: {
    color: '#dc3545',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  readOnlyHint: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  clubIconWrap: {
    backgroundColor: 'rgba(26, 31, 46, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
