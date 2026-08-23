import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
  listStudentChatGroupMessages,
  sendStudentChatGroupMessage,
  markStudentChatGroupRead,
  type StudentChatGroupMessageItem,
} from '../services/studentChatGroups';
import {
  ChatBubble,
  PendingAttachmentBar,
  ReplyComposerBar,
  ChatComposer,
} from '../components/ChatMessageParts';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  uploadChatAttachmentMobile,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const CHAT_BG = '#f0f2f5';

export default function StudentGroupChatScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'StudentGroupChat'>>();
  const { groupId, groupName, visibility } = route.params;
  const [messages, setMessages] = useState<StudentChatGroupMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageReplyTo | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingChatAttachment | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<StudentChatGroupMessageItem> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const rows = await listStudentChatGroupMessages(groupId);
      setMessages(rows);
      await markStudentChatGroupRead(groupId).catch(() => undefined);
    } catch {
      setSendError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

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
    setSendError(null);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/student-chat-groups/upload-attachment', {
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
    setSendError(null);
    try {
      const uploaded = await uploadChatAttachmentMobile('/user/student-chat-groups/upload-attachment', {
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
      const msg = await sendStudentChatGroupMessage(groupId, {
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
  }, [draft, sending, uploading, pendingAttachment, replyTo, groupId]);

  const typeLabel = visibility === 'private' ? 'Private' : 'Public';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarLetter}>{groupName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupName}
          </Text>
          <Text style={styles.headerSub}>{typeLabel} group</Text>
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
              <Text style={styles.emptyText}>No messages yet. Say hello to the group!</Text>
            }
            renderItem={({ item }) => {
              const isMine = !!user?.id && item.senderUserId === user.id;
              return (
                <View>
                  {!isMine ? (
                    <Text style={styles.senderName}>{item.sender.name}</Text>
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
                        sender: item.sender,
                      })
                    }
                  />
                </View>
              );
            }}
          />
        )}

        {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
        {replyTo ? <ReplyComposerBar replyTo={replyTo} onCancel={() => setReplyTo(null)} /> : null}
        {pendingAttachment ? (
          <PendingAttachmentBar attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />
        ) : null}
        {uploading ? <Text style={styles.uploadHint}>Uploading… (max 5 MB)</Text> : null}

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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef1f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarLetter: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: TEXT_DARK },
  headerSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  loader: { marginTop: 40 },
  messageList: { flex: 1, backgroundColor: CHAT_BG },
  messageListContent: { padding: 14, paddingBottom: 8 },
  emptyText: { textAlign: 'center', color: TEXT_MUTED, marginTop: 40, fontSize: 14 },
  senderName: { fontSize: 12, color: TEXT_MUTED, marginBottom: 2, marginLeft: 4 },
  sendError: { color: '#b42318', fontSize: 12, paddingHorizontal: 14, paddingVertical: 6 },
  uploadHint: { fontSize: 12, color: TEXT_MUTED, paddingHorizontal: 14, paddingBottom: 4 },
});
