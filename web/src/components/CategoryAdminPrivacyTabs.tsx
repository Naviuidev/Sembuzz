const TEXT_DARK = '#1a1f2e';

export type CategoryAdminPrivacyTab = 'privacy' | 'manage-admins' | 'message-config';

export function CategoryAdminPrivacyTabs({
  activeTab,
  onChange,
}: {
  activeTab: CategoryAdminPrivacyTab;
  onChange: (tab: CategoryAdminPrivacyTab) => void;
}) {
  const tabs: { id: CategoryAdminPrivacyTab; label: string }[] = [
    { id: 'privacy', label: 'Privacy' },
    { id: 'manage-admins', label: 'Subcategory admin setup' },
    { id: 'message-config', label: 'Message config' },
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
