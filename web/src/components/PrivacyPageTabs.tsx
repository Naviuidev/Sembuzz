const TEXT_DARK = '#1a1f2e';

export type PrivacyPageTab = 'admins' | 'message-config' | 'messages';

export function PrivacyPageTabs({
  activeTab,
  onChange,
  showMessagesTab = false,
}: {
  activeTab: PrivacyPageTab;
  onChange: (tab: PrivacyPageTab) => void;
  showMessagesTab?: boolean;
}) {
  const tabs: { id: PrivacyPageTab; label: string }[] = [
    { id: 'admins', label: 'Admin management' },
    { id: 'message-config', label: 'Message config' },
    ...(showMessagesTab ? [{ id: 'messages' as const, label: 'Messages' }] : []),
  ];

  return (
    <div className="d-flex gap-2 mb-4 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className="btn btn-sm"
          style={{
            borderRadius: 50,
            padding: '0.45rem 1.1rem',
            backgroundColor: activeTab === tab.id ? TEXT_DARK : '#fff',
            color: activeTab === tab.id ? '#fff' : TEXT_DARK,
            border: `1px solid ${TEXT_DARK}`,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
