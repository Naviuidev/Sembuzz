import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SchoolNavbar } from '../components/SchoolNavbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import {
  userNotificationsService,
  USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
  type UserNotificationInboxItem,
} from '../services/user-notifications.service';
import { imageSrc } from '../utils/image';

function NotificationInboxRowWeb({
  item,
  onClick,
}: {
  item: UserNotificationInboxItem;
  onClick: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const schoolName = item.schoolName?.trim() || 'School';
  const showLogo = Boolean(item.schoolLogoUrl?.trim()) && !logoFailed;
  const logo = showLogo ? imageSrc(item.schoolLogoUrl!) : '';
  const unread = !item.readAt;

  useEffect(() => {
    setLogoFailed(false);
  }, [item.id, item.schoolLogoUrl]);

  return (
    <button
      type="button"
      className="d-flex align-items-start gap-3 p-3 rounded-3 border-0 text-start w-100"
      style={{
        border: '1px solid #eee',
        backgroundColor: unread ? '#f8faff' : '#fff',
        borderColor: unread ? '#dbe4ff' : '#eee',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {showLogo && logo ? (
        <img
          key={`${item.id}-${item.schoolLogoUrl ?? ''}`}
          src={logo}
          alt=""
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={() => {
            if (import.meta.env.DEV) {
              console.warn('[Notifications] school logo failed', logo);
            }
            setLogoFailed(true);
          }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {schoolName.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="flex-grow-1 min-w-0">
        <div className={`small ${unread ? 'fw-bold text-dark' : 'fw-semibold'}`} style={{ color: '#212529' }}>
          From {schoolName}
        </div>
        <div className={`mt-1 ${unread ? 'fw-bold' : 'fw-semibold'}`} style={{ color: '#1a1f2e', fontSize: '0.95rem', lineHeight: 1.35 }}>
          {item.body || item.title}
        </div>
        <div className="small text-muted mt-2">{new Date(item.deliveredAt).toLocaleString()}</div>
      </div>
      {unread ? (
        <span className="rounded-circle flex-shrink-0 mt-1" style={{ width: 10, height: 10, backgroundColor: '#0d6efd' }} aria-hidden />
      ) : null}
    </button>
  );
}

export const Notifications = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [markingAll, setMarkingAll] = useState(false);

  const { data: items = [], isPending, isError, refetch } = useQuery({
    queryKey: ['user', 'notifications', 'inbox'],
    queryFn: () => userNotificationsService.getInbox(),
    enabled: !!user,
  });

  const unreadCount = useMemo(
    () => items.reduce((acc, item) => acc + (item.readAt ? 0 : 1), 0),
    [items],
  );

  const invalidateUnread = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY });
  }, [queryClient]);

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await userNotificationsService.markAllRead();
      await queryClient.invalidateQueries({ queryKey: ['user', 'notifications', 'inbox'] });
      invalidateUnread();
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id: string) => {
    await userNotificationsService.markRead(id);
    await queryClient.invalidateQueries({ queryKey: ['user', 'notifications', 'inbox'] });
    invalidateUnread();
  };

  const onRowClick = (item: UserNotificationInboxItem) => {
    if (!item.readAt) void markOneRead(item.id);
    navigate('/events', { replace: false });
  };

  if (!user) {
    navigate('/events', { replace: true, state: { openAuth: 'login' } });
    return null;
  }

  const loadError = isError ? 'Could not load notifications. Pull down to try again.' : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa', paddingBottom: '5rem' }}>
      <SchoolNavbar />
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center"
            onClick={() => navigate('/events', { state: { bottomNav: 'settings' } })}
            aria-label="Back to Settings"
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
          </button>
          <h1 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1f2e' }}>
            Notifications
          </h1>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <span className="small fw-semibold text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>
          <button
            type="button"
            className="btn btn-sm rounded-pill"
            style={{
              border: '1px solid #dbe4ff',
              backgroundColor: '#f3f6ff',
              color: '#2f56b0',
              fontWeight: 700,
              fontSize: '0.8rem',
              opacity: markingAll || unreadCount === 0 ? 0.5 : 1,
            }}
            disabled={markingAll || unreadCount === 0}
            onClick={() => void markAllAsRead()}
          >
            {markingAll ? 'Updating…' : 'Mark all as read'}
          </button>
        </div>

        {isPending ? (
          <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
            <p className="mt-2 mb-0 text-muted small">Loading…</p>
          </div>
        ) : loadError && items.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted small mb-3">{loadError}</p>
            <button type="button" className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted text-center py-5 small mb-0">No notifications yet.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {items.map((item) => (
              <NotificationInboxRowWeb key={item.id} item={item} onClick={() => onRowClick(item)} />
            ))}
          </div>
        )}

        {!isPending && items.length > 0 && (
          <div className="text-center mt-3">
            <button type="button" className="btn btn-link btn-sm text-muted" onClick={() => void refetch()}>
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
