import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ChatPopupContextValue = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const ChatPopupContext = createContext<ChatPopupContextValue | undefined>(undefined);

export function ChatPopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <ChatPopupContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
    </ChatPopupContext.Provider>
  );
}

export function useChatPopup() {
  const ctx = useContext(ChatPopupContext);
  if (!ctx) {
    throw new Error('useChatPopup must be used within ChatPopupProvider');
  }
  return ctx;
}
