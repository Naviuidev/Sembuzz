import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

const PANEL_OFFSET_BOTTOM = '88px';

type Props = {
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** Match StudentChatGroupsWidget default; club FAB uses more bottom padding */
  bottomOffset?: 'nav' | 'fab';
};

export function ChatSidePanelShell({
  ariaLabel,
  onClose,
  children,
  bottomOffset = 'nav',
}: Props) {
  const paddingBottom =
    bottomOffset === 'fab'
      ? `calc(${PANEL_OFFSET_BOTTOM} + 4.5rem)`
      : `calc(${PANEL_OFFSET_BOTTOM} + 0.75rem)`;

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="events-chat-side-panel"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1055,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: `0 1rem ${paddingBottom} 1rem`,
      }}
      onClick={onClose}
    >
      <div
        className="card border-0 shadow-lg d-flex flex-column overflow-hidden events-chat-side-panel__card"
        style={{
          width: '100%',
          maxWidth: 400,
          height: 'min(78vh, 580px)',
          borderRadius: 16,
          backgroundColor: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
