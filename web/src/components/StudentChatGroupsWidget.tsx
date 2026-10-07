import { useCallback, useEffect, useState } from 'react';
import { useChatPopup } from '../contexts/ChatPopupContext';
import { useUserAuth } from '../contexts/UserAuthContext';
import { ChatGroupsView } from './ChatGroupsView';
import { DirectChatPanel } from './DirectChatPanel';
import { GroupChatThread } from './GroupChatThread';
import type { ChatGroupListItem } from './chat-groups.types';
import type { DirectChatUser } from '../services/user-direct-chats.service';
import { userStudentChatGroupsService } from '../services/user-student-chat-groups.service';
import { userClubGroupChatsService } from '../services/user-club-group-chats.service';
import { ChatSidePanelShell } from './ChatSidePanelShell';

type PanelView = 'groups' | 'thread' | 'direct';

type ActiveDirectChat = {
  conversationId: string;
  peer: DirectChatUser;
};

export function StudentChatGroupsWidget() {
  const { isOpen, closeChat } = useChatPopup();
  const { user } = useUserAuth();
  const [panelView, setPanelView] = useState<PanelView>('groups');
  const [activeItem, setActiveItem] = useState<ChatGroupListItem | null>(null);
  const [activeDirectChat, setActiveDirectChat] = useState<ActiveDirectChat | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPanelView('groups');
      setActiveItem(null);
      setActiveDirectChat(null);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    closeChat();
    setPanelView('groups');
    setActiveItem(null);
    setActiveDirectChat(null);
  }, [closeChat]);

  const openGroup = useCallback((item: ChatGroupListItem) => {
    setActiveItem(item);
    setActiveDirectChat(null);
    setPanelView('thread');
  }, []);

  const openDirectChat = useCallback((conversation: ActiveDirectChat) => {
    setActiveDirectChat(conversation);
    setActiveItem(null);
    setPanelView('direct');
  }, []);

  const backToGroups = useCallback(() => {
    setPanelView('groups');
    setActiveItem(null);
    setActiveDirectChat(null);
  }, []);

  if (!isOpen || !user) return null;

  const closeButton = (
    <button
      type="button"
      className="btn btn-link p-0 text-decoration-none"
      style={{ color: '#6c757d' }}
      onClick={handleClose}
      aria-label="Close chat"
    >
      <i className="bi bi-x-lg" />
    </button>
  );

  const directCloseButton = (
    <button
      type="button"
      className="btn btn-link p-0 text-decoration-none text-white"
      onClick={handleClose}
      aria-label="Close chat"
    >
      <i className="bi bi-x-lg" />
    </button>
  );

  return (
    <ChatSidePanelShell ariaLabel="Chat groups" onClose={handleClose}>
        {panelView === 'groups' ? (
          <ChatGroupsView
            embedded
            onOpenGroup={openGroup}
            onOpenDirectChat={openDirectChat}
            onClose={handleClose}
          />
        ) : panelView === 'direct' && activeDirectChat ? (
          <DirectChatPanel
            currentUserId={user.id}
            embeddedConversation={activeDirectChat}
            onEmbeddedBack={backToGroups}
            headerExtra={directCloseButton}
          />
        ) : activeItem?.kind === 'student' && activeItem.studentGroup ? (
          <GroupChatThread
            groupId={activeItem.studentGroup.id}
            title={activeItem.studentGroup.name}
            subtitle={`${activeItem.studentGroup.memberCount} members · ${activeItem.studentGroup.visibility}`}
            currentUserId={user.id}
            queryKey={['user', 'student-chat-groups']}
            listMessages={userStudentChatGroupsService.listMessages}
            sendMessage={userStudentChatGroupsService.sendMessage}
            uploadEndpoint="/user/student-chat-groups/upload-attachment"
            onBack={backToGroups}
            onLeave={() => {
              if (window.confirm(`Leave "${activeItem.studentGroup!.name}"?`)) {
                void userStudentChatGroupsService.leave(activeItem.studentGroup!.id).then(() => {
                  backToGroups();
                });
              }
            }}
            headerExtra={closeButton}
          />
        ) : activeItem?.kind === 'club' && activeItem.clubGroup ? (
          <GroupChatThread
            groupId={activeItem.clubGroup.id}
            title={activeItem.clubGroup.pageName}
            subtitle="Official school club group"
            currentUserId={user.id}
            queryKey={['user', 'club-group-chats']}
            listMessages={userClubGroupChatsService.listMessages}
            sendMessage={userClubGroupChatsService.sendMessage}
            uploadEndpoint="/user/club-group-chats/upload-attachment"
            readOnly={activeItem.clubGroup.messageMode === 'admin_only'}
            onBack={backToGroups}
            headerExtra={closeButton}
          />
        ) : null}
    </ChatSidePanelShell>
  );
}
