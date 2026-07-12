import {
  type ChatMessageReplyTo,
  type ChatMessageShape,
  type PendingChatAttachment,
  attachmentLabel,
  chatAttachmentFullUrl,
  replyPreviewText,
  replySenderName,
} from '../utils/chatMessage';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const ACCENT = '#0d6efd';

export function ReplyQuote({
  reply,
  isMine,
}: {
  reply: ChatMessageReplyTo;
  isMine: boolean;
}) {
  return (
    <div
      className="px-2 py-1 mb-2 small"
      style={{
        borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.85)' : ACCENT}`,
        backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(13,110,253,0.08)',
        borderRadius: 4,
      }}
    >
      <div className="fw-semibold" style={{ color: isMine ? '#fff' : ACCENT, fontSize: '0.75rem' }}>
        {replySenderName(reply)}
      </div>
      <div
        className="text-truncate"
        style={{ color: isMine ? 'rgba(255,255,255,0.9)' : TEXT_MUTED, fontSize: '0.75rem' }}
      >
        {replyPreviewText(reply)}
      </div>
    </div>
  );
}

export function MessageAttachment({
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
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="d-block mb-1">
        <img
          src={fullUrl}
          alt={attachmentName || 'Image'}
          style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, display: 'block' }}
        />
      </a>
    );
  }

  if (attachmentType === 'pdf') {
    return (
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="d-flex align-items-center gap-2 text-decoration-none mb-1 px-2 py-2"
        style={{
          backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : '#f8f9fa',
          borderRadius: 8,
          color: isMine ? '#fff' : TEXT_DARK,
        }}
      >
        <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.25rem' }} aria-hidden />
        <span className="small text-truncate">{attachmentName || 'PDF document'}</span>
      </a>
    );
  }

  return null;
}

export function ChatMessageBubble({
  message,
  isMine,
  onReply,
  showSenderName,
}: {
  message: ChatMessageShape;
  isMine: boolean;
  onReply?: () => void;
  showSenderName?: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const senderName =
    message.sender?.name ?? message.user?.name ?? message.categoryAdmin?.name;

  return (
    <div className={`mb-2 d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
      <div style={{ maxWidth: '78%' }}>
        {!isMine && showSenderName && senderName ? (
          <div className="small text-muted mb-1">{senderName}</div>
        ) : null}
        <div className="position-relative group">
          <div
            className="px-3 py-2 shadow-sm"
            style={{
              backgroundColor: isMine ? ACCENT : '#fff',
              color: isMine ? '#fff' : TEXT_DARK,
              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              border: isMine ? 'none' : '1px solid #e9ecef',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.replyTo ? <ReplyQuote reply={message.replyTo} isMine={isMine} /> : null}
            {message.attachmentUrl ? (
              <MessageAttachment
                attachmentType={message.attachmentType}
                attachmentUrl={message.attachmentUrl}
                attachmentName={message.attachmentName}
                isMine={isMine}
              />
            ) : null}
            {message.body?.trim() ? <div>{message.body}</div> : null}
          </div>
          {onReply ? (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 position-absolute"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                [isMine ? 'right' : 'left']: '100%',
                marginLeft: isMine ? 0 : 4,
                marginRight: isMine ? 4 : 0,
                color: TEXT_MUTED,
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
              }}
              onClick={onReply}
              title="Reply"
            >
              <i className="bi bi-reply-fill" aria-hidden />
            </button>
          ) : null}
        </div>
        <div className={`small mt-1 ${isMine ? 'text-end' : ''}`} style={{ color: TEXT_MUTED, fontSize: '0.7rem' }}>
          {time}
        </div>
      </div>
    </div>
  );
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  sending,
  uploading,
  disabled,
  replyTo,
  onCancelReply,
  pendingAttachment,
  onRemoveAttachment,
  onPickImage,
  onPickPdf,
  placeholder = 'Type a message…',
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  disabled?: boolean;
  replyTo: ChatMessageReplyTo | null;
  onCancelReply: () => void;
  pendingAttachment: PendingChatAttachment | null;
  onRemoveAttachment: () => void;
  onPickImage: () => void;
  onPickPdf: () => void;
  placeholder?: string;
}) {
  const canSend = !disabled && !sending && !uploading && (draft.trim() || pendingAttachment);

  return (
    <div className="border-top pt-2">
      {replyTo ? (
        <div
          className="d-flex align-items-start gap-2 px-2 py-2 mb-2"
          style={{ backgroundColor: '#f0f2f5', borderLeft: `3px solid ${ACCENT}` }}
        >
          <div className="flex-grow-1 min-w-0">
            <div className="small fw-semibold" style={{ color: ACCENT }}>
              Replying to {replySenderName(replyTo)}
            </div>
            <div className="small text-muted text-truncate">{replyPreviewText(replyTo)}</div>
          </div>
          <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={onCancelReply} aria-label="Cancel reply">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      ) : null}

      {pendingAttachment ? (
        <div className="d-flex align-items-center gap-2 px-2 py-2 mb-2" style={{ backgroundColor: '#f8f9fa' }}>
          {pendingAttachment.attachmentType === 'image' && pendingAttachment.previewUrl ? (
            <img
              src={pendingAttachment.previewUrl}
              alt=""
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
            />
          ) : (
            <i className="bi bi-file-earmark-pdf-fill text-danger" style={{ fontSize: '1.5rem' }} aria-hidden />
          )}
          <div className="small flex-grow-1 text-truncate">
            {attachmentLabel(pendingAttachment.attachmentType, pendingAttachment.attachmentName)}
          </div>
          <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={onRemoveAttachment}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      ) : null}

      <div className="d-flex gap-2 align-items-end p-1">
        {!disabled ? (
          <>
            <button
              type="button"
              className="btn btn-link p-1 text-muted"
              onClick={onPickImage}
              disabled={uploading || !!pendingAttachment}
              title="Send image"
              aria-label="Send image"
            >
              <i className="bi bi-image" style={{ fontSize: '1.25rem' }} aria-hidden />
            </button>
            <button
              type="button"
              className="btn btn-link p-1 text-muted"
              onClick={onPickPdf}
              disabled={uploading || !!pendingAttachment}
              title="Send PDF"
              aria-label="Send PDF"
            >
              <i className="bi bi-paperclip" style={{ fontSize: '1.25rem' }} aria-hidden />
            </button>
          </>
        ) : null}
        <input
          type="text"
          className="form-control border-0"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          style={{ borderRadius: 20, backgroundColor: '#f0f2f5' }}
          disabled={disabled || sending || uploading}
        />
        <button
          type="button"
          className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 40, height: 40, flexShrink: 0 }}
          disabled={!canSend}
          onClick={onSend}
          aria-label="Send message"
        >
          {sending || uploading ? (
            <span className="spinner-border spinner-border-sm" role="status" />
          ) : (
            <i className="bi bi-send-fill" aria-hidden />
          )}
        </button>
      </div>
      {uploading ? <div className="small text-muted px-2 pb-1">Uploading… (max 5 MB)</div> : null}
    </div>
  );
}

export function HiddenChatFileInputs({
  imageInputRef,
  pdfInputRef,
  onImageSelected,
  onPdfSelected,
}: {
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelected: (file: File) => void;
  onPdfSelected: (file: File) => void;
}) {
  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="d-none"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onImageSelected(file);
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="d-none"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPdfSelected(file);
        }}
      />
    </>
  );
}
