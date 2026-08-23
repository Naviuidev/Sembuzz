import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  type ChatMessageReplyTo,
  type PendingChatAttachment,
  chatAttachmentFullUrl,
  replyPreviewText,
  replySenderName,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const ACCENT = '#0d6efd';

export function ReplyComposerBar({
  replyTo,
  onCancel,
}: {
  replyTo: ChatMessageReplyTo;
  onCancel: () => void;
}) {
  return (
    <View style={styles.replyBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.replyBarTitle}>Replying to {replySenderName(replyTo)}</Text>
        <Text style={styles.replyBarPreview} numberOfLines={1}>
          {replyPreviewText(replyTo)}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} hitSlop={8}>
        <Text style={styles.replyBarClose}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export function PendingAttachmentBar({
  attachment,
  onRemove,
}: {
  attachment: PendingChatAttachment;
  onRemove: () => void;
}) {
  return (
    <View style={styles.pendingBar}>
      {attachment.attachmentType === 'image' && attachment.localPreviewUri ? (
        <Image source={{ uri: attachment.localPreviewUri }} style={styles.pendingThumb} />
      ) : (
        <Text style={styles.pdfIcon}>PDF</Text>
      )}
      <Text style={styles.pendingLabel} numberOfLines={1}>
        {attachment.attachmentName}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <Text style={styles.replyBarClose}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ReplyQuoteInBubble({
  reply,
  isMine,
}: {
  reply: ChatMessageReplyTo;
  isMine: boolean;
}) {
  return (
    <View
      style={[
        styles.quote,
        { borderLeftColor: isMine ? 'rgba(255,255,255,0.85)' : ACCENT, backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(13,110,253,0.08)' },
      ]}
    >
      <Text style={[styles.quoteName, { color: isMine ? '#fff' : ACCENT }]}>
        {replySenderName(reply)}
      </Text>
      <Text style={[styles.quoteText, { color: isMine ? 'rgba(255,255,255,0.9)' : TEXT_MUTED }]} numberOfLines={2}>
        {replyPreviewText(reply)}
      </Text>
    </View>
  );
}

export function MessageAttachmentView({
  attachmentType,
  attachmentUrl,
  attachmentName,
  isMine,
}: {
  attachmentType: string | null;
  attachmentUrl: string;
  attachmentName: string | null;
  isMine: boolean;
}) {
  const fullUrl = chatAttachmentFullUrl(attachmentUrl);

  if (attachmentType === 'image') {
    return (
      <TouchableOpacity onPress={() => void Linking.openURL(fullUrl)}>
        <Image source={{ uri: fullUrl }} style={styles.imageAttachment} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  if (attachmentType === 'pdf') {
    return (
      <TouchableOpacity
        style={[styles.pdfAttachment, { backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : '#f8f9fa' }]}
        onPress={() => void Linking.openURL(fullUrl)}
      >
        <Text style={[styles.pdfIcon, { color: isMine ? '#fff' : '#dc3545' }]}>PDF</Text>
        <Text style={[styles.pdfName, { color: isMine ? '#fff' : TEXT_DARK }]} numberOfLines={1}>
          {attachmentName || 'Document'}
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
}

export function ChatBubble({
  isMine,
  body,
  replyTo,
  attachmentType,
  attachmentUrl,
  attachmentName,
  createdAt,
  onReply,
  containerStyle,
}: {
  isMine: boolean;
  body: string;
  replyTo?: ChatMessageReplyTo | null;
  attachmentType: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  onReply?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther, containerStyle]}>
      <View style={{ maxWidth: '82%' }}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {replyTo ? <ReplyQuoteInBubble reply={replyTo} isMine={isMine} /> : null}
          {attachmentUrl ? (
            <MessageAttachmentView
              attachmentType={attachmentType}
              attachmentUrl={attachmentUrl}
              attachmentName={attachmentName}
              isMine={isMine}
            />
          ) : null}
          {body.trim() ? (
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{body}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Text style={styles.bubbleTime}>
            {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {onReply ? (
            <TouchableOpacity onPress={onReply} hitSlop={8}>
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  sending,
  uploading,
  disabled = false,
  onPickImage,
  onPickPdf,
  placeholder = 'Type a message…',
  attachmentsDisabled = false,
  hasPendingAttachment = false,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  disabled?: boolean;
  onPickImage: () => void;
  onPickPdf: () => void;
  placeholder?: string;
  attachmentsDisabled?: boolean;
  hasPendingAttachment?: boolean;
}) {
  const inputDisabled = disabled || sending || uploading;
  const canSend =
    !inputDisabled && (draft.trim().length > 0 || hasPendingAttachment);

  return (
    <View style={composerStyles.wrap}>
      <View style={composerStyles.row}>
        {!disabled ? (
          <>
            <TouchableOpacity
              style={composerStyles.iconBtn}
              onPress={onPickImage}
              disabled={uploading || attachmentsDisabled}
              hitSlop={8}
              accessibilityLabel="Send image"
            >
              <Ionicons name="image-outline" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
            <TouchableOpacity
              style={composerStyles.iconBtn}
              onPress={onPickPdf}
              disabled={uploading || attachmentsDisabled}
              hitSlop={8}
              accessibilityLabel="Send PDF"
            >
              <Ionicons name="attach-outline" size={22} color={TEXT_MUTED} />
            </TouchableOpacity>
          </>
        ) : null}
        <TextInput
          style={composerStyles.input}
          placeholder={placeholder}
          placeholderTextColor="#adb5bd"
          value={draft}
          onChangeText={onDraftChange}
          editable={!inputDisabled}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          multiline
        />
        <TouchableOpacity
          style={[composerStyles.sendBtn, !canSend && composerStyles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!canSend}
          accessibilityLabel="Send message"
        >
          {sending || uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const composerStyles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: TEXT_DARK,
    backgroundColor: '#f0f2f5',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TEXT_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});

const styles = StyleSheet.create({
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f0f2f5',
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  replyBarTitle: { fontSize: 12, fontWeight: '700', color: ACCENT },
  replyBarPreview: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  replyBarClose: { fontSize: 16, color: TEXT_MUTED },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  pendingThumb: { width: 44, height: 44, borderRadius: 6 },
  pendingLabel: { flex: 1, fontSize: 13, color: TEXT_DARK },
  quote: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: 4,
  },
  quoteName: { fontSize: 11, fontWeight: '700' },
  quoteText: { fontSize: 11, marginTop: 2 },
  bubbleRow: { marginBottom: 8 },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: TEXT_DARK },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: TEXT_MUTED },
  replyBtn: { fontSize: 11, color: ACCENT, fontWeight: '600' },
  imageAttachment: { width: 200, height: 160, borderRadius: 8, marginBottom: 4 },
  pdfAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
    maxWidth: 220,
  },
  pdfIcon: { fontWeight: '800', fontSize: 12 },
  pdfName: { fontSize: 13, flex: 1 },
});
