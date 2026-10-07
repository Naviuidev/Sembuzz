import { useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SubCategoryAdminMessageConfigPanel } from '../components/SubCategoryAdminMessageConfigPanel';
import { CategoryAdminMessagesPanel } from '../components/CategoryAdminMessagesPanel';

type SubCategoryPrivacyTab = 'message-config' | 'messages';

function tabFromParam(tab: string | null): SubCategoryPrivacyTab {
  if (tab === 'messages') return 'messages';
  return 'message-config';
}

const TAB_SUBTITLES: Record<SubCategoryPrivacyTab, string> = {
  'message-config': 'Request club group chats and manage student group messaging for your subcategories.',
  messages: 'Direct messages with category admins and school admins.',
};

export const SubCategoryAdminPrivacy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [privacyTab, setPrivacyTab] = useState<SubCategoryPrivacyTab>(() =>
    tabFromParam(searchParams.get('tab')),
  );
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  useEffect(() => {
    setPrivacyTab(tabFromParam(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = (tab: SubCategoryPrivacyTab) => {
    setPrivacyTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'message-config') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const tabs: { id: SubCategoryPrivacyTab; label: string }[] = [
    { id: 'message-config', label: 'Request group chat' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <SubCategoryAdminLayout>
      <div className="admin-privacy-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Privacy</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[privacyTab]}</p>
          <nav className="admin-dashboard-badges mb-0" aria-label="Privacy sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-dashboard-badge${privacyTab === tab.id ? ' is-active' : ''}`}
                aria-pressed={privacyTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {privacyTab === 'message-config' ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <SubCategoryAdminMessageConfigPanel />
            </div>
          </section>
        ) : (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <CategoryAdminMessagesPanel variant="subcategory" />
            </div>
          </section>
        )}
      </div>
    </SubCategoryAdminLayout>
  );
};
