import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import {
  listClubGroupMessages,
  sendClubGroupMessage,
  type ClubGroupMessageItem,
} from '../services/clubGroupChat';
import { imageSrc, isImageIconValue } from '../utils/image';
import {
  ChatBubble,
  PendingAttachmentBar,
  ReplyComposerBar,
} from '../components/ChatMessageParts';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  uploadChatAttachmentMobile,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const CHAT_BG = '#f0f2f5';

function ClubIcon({ icon, name, size = 40 }: { icon: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (isImageIconValue(icon) && !failed) {
    return (
      <Image
        source={{ uri: imageSrc(icon) }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailed(true)}
      />
    );
  }
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  if (icon && !isImageIconValue(icon)) {
    return (
      <View style={[styles.clubIcon, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.clubIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.clubIconLetter}>{letter}</Text>
    </View>
  );
}

export default function ClubGroupChatScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ClubGroupChat'>>();
  const { groupChatId, pageName, icon, messageMode: routeMessageMode } = route.params;
  const [messages, setMessages] = useState<ClubGroupMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const messageMode = routeMessageMode ?? 'members';
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ClubGroupMessageItem> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const rows = await listClubGroupMessages(groupChatId);
      setMessages(rows);
    } catch {
      setSendError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [groupChatId]);

  useEffect(() => {
    void loadMessages();
    pollRef.current = setInterval(() => void loadMessages(), 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/club-group-chats/upload-attachment', {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      });
      setPendingAttachment(uploaded);
    } catch {
      setSendError('Could not upload image.');
    } finally {
      setUploading(false);
    }
  }, []);

  const pickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/club-group-chats/upload-attachment', {
        uri: asset.uri,
        name: asset.name ?? 'document.pdf',
        mimeType: asset.mimeType ?? 'application/pdf',
        size: asset.size,
      });
      setPendingAttachment(uploaded);
    } catch {
      setSendError('Could not upload PDF.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if ((!text && !pendingAttachment) || sending || uploading) return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await sendClubGroupMessage(groupChatId, {
        body: text || undefined,
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
  }, [draft, sending, uploading, pendingAttachment, replyTo, groupChatId]);

  const readOnly = messageMode === 'admin_only';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
        </TouchableOpacity>
        <ClubIcon icon={icon} name={pageName} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {pageName}
          </Text>
          <Text style={styles.headerSub}>Club group</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading && messages.length === 0 ? (
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
            renderItem={({ item }) => {
              const isMine = !!user?.id && !!item.user && item.user.id === user.id;
              return (
                <View>
                  {!isMine ? (
                    <Text style={styles.senderName}>
                      {item.categoryAdmin
                        ? `${item.categoryAdmin.name} (Admin)`
                        : item.user?.name ?? 'Unknown'}
                    </Text>
                  ) : null}
                  <ChatBubble
                    isMine={isMine}
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
              );
            }}
          />
        )}

        {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
        {readOnly ? (
          <Text style={styles.readOnlyHint}>
            Only your subcategory admin can send messages here. You can read updates from them.
          </Text>
        ) : (
          <>
            {replyTo ? <ReplyComposerBar replyTo={replyTo} onCancel={() => setReplyTo(null)} /> : null}
            {pendingAttachment ? (
              <PendingAttachmentBar attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />
            ) : null}
            {uploading ? <Text style={styles.uploadHint}>Uploading… (max 5 MB)</Text> : null}
            <View style={styles.composer}>
              <TouchableOpacity style={styles.attachBtn} onPress={() => void pickImage()} disabled={uploading || !!pendingAttachment}>
                <Text style={styles.attachBtnText}>IMG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={() => void pickPdf()} disabled={uploading || !!pendingAttachment}>
                <Text style={styles.attachBtnText}>PDF</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Type a message…"
                placeholderTextColor="#adb5bd"
                value={draft}
                onChangeText={setDraft}
                editable={!sending && !uploading}
                returnKeyType="send"
                onSubmitEditing={() => void handleSend()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, ((!draft.trim() && !pendingAttachment) || sending || uploading) && styles.sendBtnDisabled]}
                onPress={() => void handleSend()}
                disabled={(!draft.trim() && !pendingAttachment) || sending || uploading}
              >
                <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  clubIcon: {
    backgroundColor: '#eef1f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubIconLetter: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_DARK },
  headerSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  loader: { marginTop: 40 },
  messageList: { flex: 1, backgroundColor: CHAT_BG },
  messageListContent: { padding: 14, paddingBottom: 8 },
  emptyText: { textAlign: 'center', color: TEXT_MUTED, marginTop: 40, fontSize: 14 },
  senderName: { fontSize: 12, color: TEXT_MUTED, marginBottom: 2, marginLeft: 4 },
  sendError: { color: '#b42318', fontSize: 12, paddingHorizontal: 14, paddingVertical: 6 },
  readOnlyHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
  },
  uploadHint: { fontSize: 12, color: TEXT_MUTED, paddingHorizontal: 14, paddingBottom: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    backgroundColor: '#fff',
  },
  attachBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  attachBtnText: { fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: TEXT_DARK,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: TEXT_DARK,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
