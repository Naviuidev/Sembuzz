const TEXT_DARK = '#1a1f2e';

interface MessagingDeleteRequestConfirmModalProps {
  isOpen: boolean;
  targetKind: 'student group' | 'group chat';
  targetName: string;
  targetMeta?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MessagingDeleteRequestConfirmModal({
  isOpen,
  targetKind,
  targetName,
  targetMeta,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: MessagingDeleteRequestConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
      }}
      onClick={onCancel}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          borderRadius: 0,
          minWidth: 400,
          maxWidth: 500,
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body p-4">
          <h3
            style={{
              fontSize: '1.5rem',
              fontWeight: 'normal',
              color: TEXT_DARK,
              marginBottom: '1rem',
            }}
          >
            Request deletion
          </h3>
          <p style={{ color: '#6c757d', marginBottom: targetMeta ? '0.75rem' : '1.5rem' }}>
            Request deletion of {targetKind} <strong style={{ color: TEXT_DARK }}>{targetName}</strong>?
            Category or school admin must approve.
          </p>
          {targetMeta ? (
            <div className="mb-4">
              <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: 10 }}>
                {targetMeta}
              </span>
            </div>
          ) : null}
          <div className="d-flex justify-content-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '50px',
                padding: '0.5rem 1.5rem',
                color: TEXT_DARK,
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="btn"
              style={{
                backgroundColor: '#dc3545',
                border: 'none',
                borderRadius: '50px',
                padding: '0.5rem 1.5rem',
                color: '#fff',
                fontWeight: '500',
                transition: 'all 0.3s',
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#c82333';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#dc3545';
                }
              }}
            >
              {isSubmitting ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
