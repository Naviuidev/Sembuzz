import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getDirectChatUnreadCount } from '../services/directChat';
import { getStudentChatGroupUnreadCount } from '../services/studentChatGroups';

/** DM + pending incoming + student group unread — matches web `messagesUnreadCount`. */
export function useMessagesUnreadCount(refreshKey?: unknown) {
  const { user, token } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id || !token) {
      setCount(0);
      return;
    }
    try {
      const [direct, groups] = await Promise.all([
        getDirectChatUnreadCount().catch(() => ({ unreadCount: 0, pendingIncomingCount: 0 })),
        getStudentChatGroupUnreadCount().catch(() => ({ unreadCount: 0 })),
      ]);
      setCount(
        (direct.unreadCount ?? 0) +
          (direct.pendingIncomingCount ?? 0) +
          (groups.unreadCount ?? 0),
      );
    } catch {
      /* keep last count */
    }
  }, [user?.id, token]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    const id = setInterval(() => void refresh(), 15_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [user?.id, refresh]);

  return { count, refresh };
}
