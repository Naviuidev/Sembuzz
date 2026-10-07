import type { CSSProperties } from 'react';

export type SchoolAdminPrivacyTab = 'privacy' | 'manage-admins' | 'message-config';

export function SchoolAdminPrivacyTabs({
  activeTab,
  onChange,
  style,
}: {
  activeTab: SchoolAdminPrivacyTab;
  onChange: (tab: SchoolAdminPrivacyTab) => void;
  style?: CSSProperties;
}) {
  const tabs: { id: SchoolAdminPrivacyTab; label: string }[] = [
    { id: 'privacy', label: 'Privacy' },
    { id: 'manage-admins', label: 'Category admin setup' },
    { id: 'message-config', label: 'Message config' },
  ];

  return (
    <nav className="admin-dashboard-badges" aria-label="Privacy sections" style={style}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`admin-dashboard-badge${activeTab === tab.id ? ' is-active' : ''}`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
