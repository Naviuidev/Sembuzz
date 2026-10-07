import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SchoolAdminCreatePost } from './SchoolAdminCreatePost';
import { SchoolAdminApprovedPostsPanel } from './SchoolAdminApprovedPosts';
import { SchoolAdminPostsListPanel } from './SchoolAdminPostsListPanel';

type PostsTab = 'create' | 'approved' | 'list';

const POST_TABS: { id: PostsTab; label: string }[] = [
  { id: 'create', label: 'Create post' },
  { id: 'approved', label: 'Approved post' },
  { id: 'list', label: 'Posts' },
];

function parsePostsTab(raw: string | null): PostsTab {
  if (raw === 'approved' || raw === 'list') return raw;
  return 'create';
}

const TAB_SUBTITLES: Record<PostsTab, string> = {
  create:
    'Share events, opportunities, announcements and more with your campus community.',
  approved:
    'Approved posts from subcategory admins. View, edit (title, description, link, images), or delete.',
  list:
    'All posts within your school. View details or delete. Edit is available only to Category admin.',
};

export const SchoolAdminPosts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parsePostsTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;

  const setTab = (tab: PostsTab) => {
    if (tab === 'create') {
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

  const postsHubHeader = (
    <header className="admin-page-header admin-page-header--in-grid mb-0" style={panelStyle}>
      <h1 className="admin-page-title">Posts</h1>
      <p className="admin-page-subtitle">{TAB_SUBTITLES.create}</p>
      {badgesNav}
    </header>
  );

  return (
    <SchoolAdminLayout>
      <div className={`admin-posts-page${activeTab === 'create' ? ' admin-posts-page--create' : ''}`}>
        {activeTab === 'create' ? (
          <SchoolAdminCreatePost embedded hubHeader={postsHubHeader} />
        ) : (
          <>
            <header className="admin-page-header" style={panelStyle}>
              <h1 className="admin-page-title">Posts</h1>
              <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>
              {badgesNav}
            </header>
            <section className="admin-panel" style={panelStyle}>
              <div className="admin-panel__body admin-panel__body--flush-top">
                {activeTab === 'approved' ? <SchoolAdminApprovedPostsPanel /> : null}
                {activeTab === 'list' ? <SchoolAdminPostsListPanel /> : null}
              </div>
            </section>
          </>
        )}
      </div>
    </SchoolAdminLayout>
  );
};
