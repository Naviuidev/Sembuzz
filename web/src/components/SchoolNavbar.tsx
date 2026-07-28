import { useUserAuth } from '../contexts/UserAuthContext';
import { useChatPopup } from '../contexts/ChatPopupContext';
import { imageSrc } from '../utils/image';
import { useState, useEffect } from 'react';

type SchoolNavbarProps = {
  chatUnreadCount?: number;
};

export const SchoolNavbar = ({ chatUnreadCount = 0 }: SchoolNavbarProps) => {
  const { user } = useUserAuth();
  const { openChat, isOpen } = useChatPopup();
  const [schoolLogoError, setSchoolLogoError] = useState(false);

  useEffect(() => setSchoolLogoError(false), [user?.schoolImage]);

  if (!user) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-between px-3 py-3"
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ width: 40 }} aria-hidden />

      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        {user.schoolImage && imageSrc(user.schoolImage) && !schoolLogoError ? (
          <img
            src={imageSrc(user.schoolImage)}
            alt={user.schoolName}
            style={{
              width: 48,
              height: 48,
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onError={() => setSchoolLogoError(true)}
          />
        ) : (
          <span style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '1.25rem' }}>
            {user.schoolName}
          </span>
        )}
      </div>

      <div style={{ width: 40 }} className="d-flex justify-content-end">
        <button
          type="button"
          className="btn btn-link p-0 border-0 position-relative"
          aria-label="Chat groups"
          aria-expanded={isOpen}
          onClick={openChat}
        >
          <i
            className={isOpen ? 'bi bi-chat-dots-fill' : 'bi bi-chat-dots'}
            style={{ fontSize: '1.35rem', color: '#1a1f2e' }}
          />
          {!isOpen && chatUnreadCount > 0 ? (
            <span
              className="position-absolute rounded-pill bg-danger text-white"
              style={{
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                border: '1.5px solid #fff',
              }}
            >
              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
};
