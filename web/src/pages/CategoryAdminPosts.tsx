import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoryAdminLayout } from '../components/CategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { CategoryAdminPendingApprovalsPanel } from './CategoryAdminPendingApprovals';
import { CategoryAdminApprovedPostsPanel } from './CategoryAdminApprovedPosts';

type PostsTab = 'pending' | 'approved';

const POST_TABS: { id: PostsTab; label: string }[] = [
  { id: 'pending', label: 'Pending approvals' },
  { id: 'approved', label: 'Approved post' },
];

function parsePostsTab(raw: string | null): PostsTab {
  return raw === 'approved' ? 'approved' : 'pending';
}

const TAB_SUBTITLES: Record<PostsTab, string> = {
  pending: 'Events submitted by subcategory admins awaiting your approval.',
  approved: 'Published posts in your categories. Search, view details, or delete.',
};

export const CategoryAdminPosts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parsePostsTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.category } as CSSProperties;

  const setTab = (tab: PostsTab) => {
    if (tab === 'pending') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const badgesNav = (
    <nav className="admin-dashboard-badges" aria-label="Post sections">
      {POST_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`admin-dashboard-badge${activeTab === id ? ' is-active' : ''}`}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => setTab(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <CategoryAdminLayout>
      <div className="admin-posts-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Posts</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>
          {badgesNav}
        </header>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body admin-panel__body--flush-top">
            {activeTab === 'pending' ? <CategoryAdminPendingApprovalsPanel /> : null}
            {activeTab === 'approved' ? <CategoryAdminApprovedPostsPanel /> : null}
          </div>
        </section>
      </div>
    </CategoryAdminLayout>
  );
};
