import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminMessageConfigPanel } from '../components/SubCategoryAdminMessageConfigPanel';
import { CategoryAdminMessagesPanel } from '../components/CategoryAdminMessagesPanel';

const TEXT_DARK = '#1a1f2e';

type SubCategoryPrivacyTab = 'message-config' | 'messages';

function tabFromParam(tab: string | null): SubCategoryPrivacyTab {
  if (tab === 'messages') return 'messages';
  return 'message-config';
}

export const SubCategoryAdminPrivacy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [privacyTab, setPrivacyTab] = useState<SubCategoryPrivacyTab>(() =>
    tabFromParam(searchParams.get('tab')),
  );

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
      <div className="mb-4">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: TEXT_DARK,
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          Privacy — Messaging
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1rem', margin: 0 }}>
          Request club group chats, approve student join requests, and manage group messaging.
        </p>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className="btn btn-sm"
            style={{
              borderRadius: 50,
              padding: '0.45rem 1.1rem',
              backgroundColor: privacyTab === tab.id ? TEXT_DARK : '#fff',
              color: privacyTab === tab.id ? '#fff' : TEXT_DARK,
              border: `1px solid ${TEXT_DARK}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {privacyTab === 'message-config' ? (
        <SubCategoryAdminMessageConfigPanel />
      ) : (
        <CategoryAdminMessagesPanel variant="subcategory" />
      )}
    </SubCategoryAdminLayout>
  );
};
