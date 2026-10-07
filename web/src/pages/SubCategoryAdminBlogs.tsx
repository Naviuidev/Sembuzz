import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SubCategoryAdminBlogApprovedPanel } from '../components/SubCategoryAdminBlogApprovedPanel';
import { SubCategoryAdminBlogPendingPanel } from '../components/SubCategoryAdminBlogPendingPanel';
import { SubCategoryAdminBlogRejectedPanel } from '../components/SubCategoryAdminBlogRejectedPanel';
import { SubCategoryAdminBlogSuggestionsPanel } from '../components/SubCategoryAdminBlogSuggestionsPanel';
import {
  SubCategoryAdminPostBlogPanel,
  type ResubmitBlog,
} from './SubCategoryAdminPostBlog';
import type { BlogRow } from '../services/subcategory-admin-blogs.service';

type BlogsTab = 'create' | 'suggestions' | 'pending' | 'approved' | 'rejected';

const BLOG_TABS: { id: BlogsTab; label: string }[] = [
  { id: 'create', label: 'Post blog' },
  { id: 'suggestions', label: 'Received corrections' },
  { id: 'pending', label: 'Pending approval' },
  { id: 'approved', label: 'Approved list' },
  { id: 'rejected', label: 'Rejected' },
];

function parseBlogsTab(raw: string | null): BlogsTab {
  if (raw === 'blog-suggestions' || raw === 'suggestions') return 'suggestions';
  if (raw === 'blog-pending' || raw === 'pending') return 'pending';
  if (raw === 'blog-approved' || raw === 'approved') return 'approved';
  if (raw === 'blog-rejected' || raw === 'rejected') return 'rejected';
  return 'create';
}

const TAB_SUBTITLES: Record<BlogsTab, string> = {
  create: 'Build your article with blocks, preview it, then submit for category admin approval.',
  suggestions: 'Feedback from your category admin. Revise and resubmit as a new blog post.',
  pending: 'Blogs waiting for category admin approval.',
  approved: 'Blogs approved by the category admin (draft or published).',
  rejected: 'Blog submissions that were not approved.',
};

function toResubmitBlog(blog: BlogRow): ResubmitBlog {
  return {
    title: blog.title,
    content: blog.content,
    coverImageUrl: blog.coverImageUrl,
    subCategory: blog.subCategory,
  };
}

export const SubCategoryAdminBlogs = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseBlogsTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  const [resubmitBlog, setResubmitBlog] = useState<ResubmitBlog | null>(null);
  const hasAppliedNavResubmit = useRef(false);

  useEffect(() => {
    const fromState = (location.state as { resubmitBlog?: ResubmitBlog })?.resubmitBlog;
    if (fromState && !hasAppliedNavResubmit.current) {
      hasAppliedNavResubmit.current = true;
      setResubmitBlog(fromState);
      setSearchParams({}, { replace: true });
    }
  }, [location.state, setSearchParams]);

  const setTab = (tab: BlogsTab) => {
    if (tab === 'create') {
      setSearchParams({});
    } else {
      const param =
        tab === 'suggestions'
          ? 'blog-suggestions'
          : tab === 'pending'
            ? 'blog-pending'
            : tab === 'approved'
              ? 'blog-approved'
              : 'blog-rejected';
      setSearchParams({ tab: param });
    }
  };

  const handleReviseAndResubmit = useCallback(
    (blog: BlogRow) => {
      setResubmitBlog(toResubmitBlog(blog));
      setSearchParams({});
    },
    [setSearchParams],
  );

  const handleSubmitted = useCallback(() => {
    setResubmitBlog(null);
    setSearchParams({ tab: 'blog-pending' });
  }, [setSearchParams]);

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
    <SubCategoryAdminLayout>
      <div className="admin-posts-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Blogs</h1>
          <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>
          {badgesNav}
        </header>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body admin-panel__body--flush-top">
            {activeTab === 'create' ? (
              <SubCategoryAdminPostBlogPanel
                embedded
                resubmitBlog={resubmitBlog ?? undefined}
                onSubmitted={handleSubmitted}
              />
            ) : null}
            {activeTab === 'suggestions' ? (
              <SubCategoryAdminBlogSuggestionsPanel onReviseAndResubmit={handleReviseAndResubmit} />
            ) : null}
            {activeTab === 'pending' ? <SubCategoryAdminBlogPendingPanel /> : null}
            {activeTab === 'approved' ? <SubCategoryAdminBlogApprovedPanel /> : null}
            {activeTab === 'rejected' ? <SubCategoryAdminBlogRejectedPanel /> : null}
          </div>
        </section>
      </div>
    </SubCategoryAdminLayout>
  );
};
