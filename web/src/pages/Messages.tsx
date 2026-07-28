import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatPopup } from '../contexts/ChatPopupContext';
import { useUserAuth } from '../contexts/UserAuthContext';

/** Legacy route — opens the chat popup and returns to events. */
export default function Messages() {
  const navigate = useNavigate();
  const { openChat } = useChatPopup();
  const { user } = useUserAuth();

  useEffect(() => {
    if (!user) {
      navigate('/events', { replace: true, state: { openAuth: 'login' } });
      return;
    }
    openChat();
    navigate('/events', { replace: true });
  }, [user, navigate, openChat]);

  return null;
}
