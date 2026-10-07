import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoryAdminLayout } from '../components/CategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { CategoryAdminBlogsPendingPanel } from './CategoryAdminBlogsPendingPanel';
import { CategoryAdminBlogsApprovedPanel } from './CategoryAdminBlogsApprovedPanel';

type BlogsTab = 'pending' | 'approved';

const BLOG_TABS: { id: BlogsTab; label: string }[] = [
  { id: 'pending', label: 'Pending approval' },
  { id: 'approved', label: 'Approved blogs' },
];

function parseBlogsTab(raw: string | null): BlogsTab {
  return raw === 'approved' ? 'approved' : 'pending';
}

const TAB_SUBTITLES: Record<BlogsTab, string> = {
  pending: 'Review blog submissions from subcategory admins before they go public.',
  approved: 'Live blogs in your categories. Search, read, or remove from the public feed.',
};

export const CategoryAdminBlogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseBlogsTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.category } as CSSProperties;

  const setTab = (tab: BlogsTab) => {
    if (tab === 'pending') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const badgesNav = (
    <nav className="admin-dashboard-badges" aria-label="Blog sections">
      {BLOG_TABS.map(({ id, label }) => (
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
          <h1 className="admin-page-title">Blogs</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>
          {badgesNav}
        </header>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body admin-panel__body--flush-top">
            {activeTab === 'pending' ? <CategoryAdminBlogsPendingPanel /> : null}
            {activeTab === 'approved' ? <CategoryAdminBlogsApprovedPanel /> : null}
          </div>
        </section>
      </div>
    </CategoryAdminLayout>
  );
};
