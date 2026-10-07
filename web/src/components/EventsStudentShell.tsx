import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { EventsBottomNav, type EventsBottomNavTab } from './EventsBottomNav';
import { EventsGlobalSecondarySidebar } from './EventsGlobalSecondarySidebar';
import type { SavedCollectionTab } from '../utils/savedCollections';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useChatPopup } from '../contexts/ChatPopupContext';
import {
  USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
  userNotificationsService,
} from '../services/user-notifications.service';

type Props = {
  children: ReactNode;
  activeTab: EventsBottomNavTab;
  /** Highlight a saved collection link in the right sidebar */
  activeSavedTab?: SavedCollectionTab | null;
  /** Extra bottom padding for mobile bottom nav */
  contentClassName?: string;
};

export function EventsStudentShell({
  children,
  activeTab,
  activeSavedTab = null,
  contentClassName = '',
}: Props) {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const { openChat } = useChatPopup();

  const { data: unreadNotifData } = useQuery({
    queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: () => userNotificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 15_000,
  });
  const notifUnreadCount = unreadNotifData?.unreadCount ?? 0;

  const onSelectTab = (tab: EventsBottomNavTab) => {
    if (tab === 'chat') {
      if (user) openChat();
      else navigate('/events', { state: { openAuth: 'login' } });
      return;
    }
    navigate('/events', { state: { bottomNav: tab } });
  };

  return (
    <div className="min-h-screen events-app-page events-app-page--modern">
      <Navbar />
      <div className="events-app-shell events-app-shell--with-sidebar events-app-shell--with-tools">
        <EventsBottomNav
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          notifUnreadCount={notifUnreadCount}
          visible
          responsiveLayout
        />
        <EventsGlobalSecondarySidebar activeSavedTab={activeSavedTab} />
        <main className={`events-app-main events-feed-primary ${contentClassName}`.trim()}>
          <div className="container py-4 events-feed-container" style={{ maxWidth: 640 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
