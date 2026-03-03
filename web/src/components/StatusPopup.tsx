interface StatusPopupProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export const StatusPopup = ({ show, type, message, onClose }: StatusPopupProps) => {
  if (!show) return null;

  // Parse message to extract enabled/disabled features
  const parseMessage = () => {
    const enabledMatch = message.match(/Enabled:\s*(.+?)(?:\n|$)/);
    const disabledMatch = message.match(/Disabled:\s*(.+?)(?:\n|$)/);
    const emailMatch = message.match(/email.*?school admin/i);
    
    const enabledFeatures = enabledMatch 
      ? enabledMatch[1].split(',').map(f => f.trim()).filter(f => f)
      : [];
    const disabledFeatures = disabledMatch
      ? disabledMatch[1].split(',').map(f => f.trim()).filter(f => f)
      : [];
    const emailMessage = emailMatch ? 'An email notification has been sent to the school admin.' : null;
    
    return { enabledFeatures, disabledFeatures, emailMessage };
  };

  const { enabledFeatures, disabledFeatures, emailMessage } = parseMessage();
  const hasFeatures = enabledFeatures.length > 0 || disabledFeatures.length > 0;

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
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: '#1a1f2e',
            border: 'none',
            fontSize: '1rem',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1,
            borderRadius: '50%',
            transition: 'color 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6c757d';
          }}
        >
          <i className="bi bi-x-lg"></i>
        </button>
        <div className="d-flex align-items-start gap-3">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i
              className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
              style={{
                fontSize: '1.5rem',
                color: type === 'success' ? '#155724' : '#721c24',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '0.5rem',
                marginTop: 0,
              }}
            >
              {type === 'success' ? 'Success' : 'Error'}
            </h3>
            {hasFeatures ? (
              <div>
                {disabledFeatures.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '50px',
                        fontSize: '0.875rem',
                        marginRight: '0.5rem',
                        fontWeight: '500',
                        border: '1px solid #f5c6cb',
                      }}
                    >
                      Disabled
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: '#6c757d',
                      }}
                    >
                      : {disabledFeatures.join(', ')}
                    </span>
                  </div>
                )}
                {enabledFeatures.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '50px',
                        fontSize: '0.875rem',
                        marginRight: '0.5rem',
                        fontWeight: '500',
                        border: '1px solid #c3e6cb',
                      }}
                    >
                      Enabled
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: '#6c757d',
                      }}
                    >
                      : {enabledFeatures.join(', ')}
                    </span>
                  </div>
                )}
                {emailMessage && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#6c757d',
                      marginBottom: 0,
                      marginTop: '0.5rem',
                    }}
                  >
                    {emailMessage}
                  </p>
                )}
              </div>
            ) : (
              <p
                style={{
                  fontSize: '1rem',
                  color: '#6c757d',
                  marginBottom: 0,
                  whiteSpace: 'wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
